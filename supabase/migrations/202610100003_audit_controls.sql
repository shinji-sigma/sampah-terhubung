-- Additive audit corrections. No existing records are deleted or rewritten.
-- Public schedules/runs use public_region_data, which excludes worker/actor IDs.
-- Direct operational table reads require a coordinator or assigned active worker.
alter policy schedules_read on public.schedules using (
 public.has_role(region_id,'coordinator') or
 (worker_id=auth.uid() and public.has_role(region_id,'worker'))
);
create or replace function public.command(p jsonb, request_key uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare
 actor uuid:=auth.uid(); op text:=p->>'op'; r uuid; target uuid; result jsonb; saved command_receipts;
 rep reports; inc incidents; task tasks; ev events; sch schedules; pt points; prev incidents; n integer; note text; field_name text;
begin
 if actor is null then raise exception using message='Silakan masuk terlebih dahulu.',errcode='42501'; end if;
 if octet_length(p::text)>25000 then raise exception using message='Permintaan terlalu besar.',errcode='22023'; end if;
 -- Direct RPC callers do not pass through Zod. Reject PostgreSQL infinity and
 -- out-of-range years before they can poison browser date formatting/workflows.
 foreach field_name in array array['observed_at','performed_at','actual_at','due_at','starts_at','pickup_at'] loop
  if nullif(p->>field_name,'') is not null and (not isfinite((p->>field_name)::timestamptz) or
   (p->>field_name)::timestamptz not between timestamptz '0001-01-01 00:00:00+00' and timestamptz '9999-12-31 23:59:59.999999+00') then
   raise exception using message='Waktu harus berupa tanggal yang sah.',errcode='22023';
  end if;
 end loop;
 foreach field_name in array array['date','valid_from','valid_until','evaluate_on'] loop
  if nullif(p->>field_name,'') is not null and (not isfinite((p->>field_name)::date) or
   (p->>field_name)::date not between date '0001-01-01' and date '9999-12-31') then
   raise exception using message='Tanggal harus berupa tanggal yang sah.',errcode='22023';
  end if;
 end loop;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||request_key::text,0));
 select * into saved from command_receipts where actor_id=actor and key=request_key;
 if found then if saved.payload<>p then raise exception using message='Kunci pengiriman sudah digunakan untuk isian berbeda.',errcode='40001'; end if; return saved.result; end if;
 r:=(p->>'region_id')::uuid; target:=(p->>'id')::uuid;
 if op='report.create' then
  if not exists(select 1 from regions where id=r and active) then raise exception using message='Wilayah belum terlayani.',errcode='22023'; end if;
  if (p->>'observed_at')::timestamptz>now()+interval '5 minutes' then raise exception using message='Waktu pengamatan tidak boleh di masa depan.',errcode='22023'; end if;
  insert into reports(region_id,reporter_id,category,landmark,description,observed_at,lat,lng) values(r,actor,require_text(p,'category'),require_text(p,'landmark',3),require_text(p,'description',10),(p->>'observed_at')::timestamptz,(p->>'lat')::float8,(p->>'lng')::float8) returning id into target;
  perform attach_photos(p,'report',target); perform audit(r,'report',target,'Menunggu validasi','Laporan baru diterima secara privat.');
 elsif op in ('report.validate','report.reject') then
  select * into rep from reports where id=target for update; if not found then raise exception 'Laporan tidak ditemukan.'; end if; r:=rep.region_id; perform require_coordinator(r);
  if rep.status<>'pending' or rep.version is distinct from (p->>'version')::integer then raise exception using message='Laporan sudah berubah. Muat ulang.',errcode='40001'; end if;
  if op='report.reject' then update reports set status='rejected',reason=require_text(p,'reason',3),version=version+1 where id=target; perform audit(r,'report',target,'Ditolak',p->>'reason');
  else
   if nullif(p->>'incident_id','') is not null then
    select * into inc from incidents where id=(p->>'incident_id')::uuid for update;
    if not found or inc.region_id<>r or inc.status='closed' then raise exception using message='Pilih insiden terbuka di wilayah yang sama.',errcode='22023'; end if;
   else
    if nullif(p->>'point_id','') is not null then
     select * into pt from points where id=(p->>'point_id')::uuid for update;
     if not found or pt.region_id<>r then raise exception using message='Titik tidak tersedia di wilayah ini.',errcode='42501'; end if;
    else
     insert into points(region_id,label,lat,lng) values(r,require_text(p,'public_label',3),rep.lat,rep.lng) returning * into pt;
    end if;
    if exists(select 1 from incidents where point_id=pt.id and status<>'closed') then raise exception using message='Titik masih memiliki insiden terbuka. Tautkan sebagai laporan pendukung.',errcode='40001'; end if;
    select * into prev from incidents where point_id=pt.id order by closed_at desc nulls last limit 1;
    if found and rep.observed_at<=prev.closed_at then raise exception using message='Pengamatan terjadi sebelum penanganan terakhir. Tinjau sebagai kejadian lama.',errcode='22023'; end if;
    insert into incidents(region_id,point_id,public_label,observed_at,previous_incident_id,previous_closed_at) values(r,pt.id,require_text(p,'public_label',3),rep.observed_at,prev.id,prev.closed_at) returning * into inc;
   end if;
   update reports set status='validated',incident_id=inc.id,version=version+1 where id=target;
   perform audit(r,'incident',inc.id,'Terverifikasi','Laporan '||left(target::text,8)||' ditautkan setelah pemeriksaan.');
  end if;
 elsif op='incident.assign' then
  select * into inc from incidents where id=target for update; if not found then raise exception 'Insiden tidak ditemukan.'; end if; r:=inc.region_id; perform require_coordinator(r);
  if inc.status not in ('verified','assigned','working') or inc.version is distinct from (p->>'version')::integer then raise exception using message='Status insiden sudah berubah atau belum dapat ditugaskan.',errcode='40001'; end if;
  if not exists(select 1 from memberships where user_id=(p->>'worker_id')::uuid and region_id=r and role='worker' and active) then raise exception using message='Petugas tidak aktif di wilayah ini.',errcode='42501'; end if;
  note:=require_text(p,'reason',3);
  update tasks set status='superseded',reason=note,version=version+1 where incident_id=inc.id and status in ('offered','accepted');
  insert into tasks(incident_id,region_id,worker_id,due_at) values(inc.id,r,(p->>'worker_id')::uuid,(p->>'due_at')::timestamptz);
  update incidents set status='assigned',version=version+1 where id=target; perform audit(r,'incident',target,'Ditugaskan',note);
 elsif op in ('task.accept','task.reject','task.block','task.evidence') then
  -- Always lock incident before task, matching assignment/review lock ordering.
  select incident_id into target from tasks where id=(p->>'id')::uuid;
  select * into inc from incidents where id=target for update;
  select * into task from tasks where id=(p->>'id')::uuid for update;
  if not found or task.worker_id<>actor or not has_role(task.region_id,'worker') then raise exception using message='Tugas bukan milik Anda.',errcode='42501'; end if; r:=task.region_id;
  if task.version is distinct from (p->>'version')::integer then raise exception using message='Tugas sudah berubah. Muat ulang.',errcode='40001'; end if;
  if op in ('task.accept','task.reject') then
   if task.status<>'offered' or inc.status<>'assigned' then raise exception using message='Penawaran tugas sudah berubah.',errcode='40001'; end if;
   if op='task.accept' then update tasks set status='accepted',accepted_at=now(),version=version+1 where id=task.id; update incidents set status='working',version=version+1 where id=inc.id; note:='Petugas menerima dan mulai mengerjakan.';
   else note:=require_text(p,'reason',3); update tasks set status='rejected',reason=note,version=version+1 where id=task.id; update incidents set status='verified',version=version+1 where id=inc.id; end if;
  elsif op='task.block' then
   if task.status<>'accepted' or inc.status<>'working' then raise exception using message='Kendala hanya pada pekerjaan yang diterima.',errcode='40001'; end if;
   note:=require_text(p,'reason',3); update tasks set blocker=note,version=version+1 where id=task.id;
  else
   if task.status<>'accepted' or inc.status<>'working' then raise exception using message='Tugas belum dikerjakan.',errcode='40001'; end if;
   note:=require_text(p,'action_taken',5);
   if coalesce((p->>'moved')::boolean,false) and length(btrim(coalesce(p->>'destination','')))<3 then raise exception using message='Tujuan pengangkutan wajib diisi.',errcode='22023'; end if;
   if nullif(p->>'performed_at','') is null or (p->>'performed_at')::timestamptz>now()+interval '5 minutes' then raise exception 'Waktu pekerjaan belum terjadi.'; end if;
   perform attach_photos(p,'task',task.id);
   update tasks set status='submitted',action_taken=note,performed_at=(p->>'performed_at')::timestamptz,moved=coalesce((p->>'moved')::boolean,false),destination=p->>'destination',version=version+1 where id=task.id;
   update incidents set status='awaiting_review',version=version+1 where id=inc.id;
  end if;
  perform audit(r,'incident',inc.id,case op when 'task.accept' then 'Dikerjakan' when 'task.reject' then 'Tugas ditolak' when 'task.block' then 'Kendala' else 'Menunggu verifikasi' end,note); target:=task.id;
 elsif op in ('incident.review','incident.reopen') then
  select * into inc from incidents where id=target for update; if not found then raise exception 'Insiden tidak ditemukan.'; end if; r:=inc.region_id; perform require_coordinator(r);
  if inc.version is distinct from (p->>'version')::integer then raise exception using message='Insiden sudah berubah.',errcode='40001'; end if; note:=require_text(p,'reason',3);
  if op='incident.reopen' then
   if inc.status<>'closed' then raise exception 'Hanya insiden selesai dapat dibuka kembali.'; end if;
   if exists(select 1 from incidents where point_id=inc.point_id and id<>inc.id and status<>'closed') then raise exception 'Ada kejadian baru terbuka. Tinjau riwayat sebelum membuka kembali.'; end if;
   select * into task from tasks where incident_id=inc.id and status='verified' order by created_at desc limit 1 for update;
   if not exists(select 1 from memberships where user_id=task.worker_id and region_id=r and role='worker' and active) then raise exception 'Petugas lama tidak aktif. Penugasan perlu dipulihkan administrator dahulu.'; end if;
   update tasks set status='accepted',version=version+1 where id=task.id;
   update incidents set status='working',closed_at=null,reviewer_id=null,version=version+1 where id=inc.id;
  else
   if inc.status<>'awaiting_review' then raise exception 'Insiden belum menunggu verifikasi.'; end if;
   select * into task from tasks where incident_id=inc.id and status='submitted' for update;
   if not found or task.action_taken is null or task.performed_at is null or not exists(select 1 from photos where task_id=task.id) then raise exception 'Bukti pekerjaan belum lengkap.'; end if;
   if coalesce((p->>'approved')::boolean,false) then
    update tasks set status='verified',version=version+1 where id=task.id;
    update incidents set status='closed',closed_at=now(),reviewer_id=actor,version=version+1 where id=inc.id;
   else update tasks set status='accepted',version=version+1 where id=task.id; update incidents set status='working',version=version+1 where id=inc.id; end if;
  end if;
  perform audit(r,'incident',target,case when op='incident.reopen' then 'Dikerjakan kembali' when coalesce((p->>'approved')::boolean,false) then 'Selesai terverifikasi' else 'Perlu perbaikan' end,note);
 elsif op='report.feedback' then
  select * into rep from reports where id=target; if not found or rep.reporter_id<>actor or rep.status<>'validated' then raise exception using message='Tanggapan hanya untuk laporan tervalidasi milik Anda.',errcode='42501'; end if; r:=rep.region_id;
  insert into feedback(report_id,region_id,author_id,note) values(rep.id,r,actor,require_text(p,'reason',3)) returning id into target;
  perform audit(r,'report',rep.id,'Tanggapan pelapor',p->>'reason');
 elsif op='feedback.review' then
  select region_id into r from feedback where id=target for update; perform require_coordinator(r);
  update feedback set reviewed_at=now(),review_note=require_text(p,'reason',3) where id=target; perform audit(r,'feedback',target,'Tanggapan ditinjau',p->>'reason');
 elsif op='schedule.save' then
  perform require_coordinator(r);
  if target is not null then select * into sch from schedules where id=target for update; if not found or sch.region_id<>r then raise exception using message='Jadwal tidak tersedia.',errcode='42501'; end if;
   if sch.version is distinct from (p->>'version')::integer then raise exception using message='Jadwal sudah berubah.',errcode='40001'; end if;
   -- Rule replacement is a new dated rule. Preserve the previous rule and its actual runs.
   if (p->>'valid_from')::date<=sch.valid_from then raise exception 'Aturan pengganti harus mulai sesudah aturan lama.'; end if;
   update schedules set valid_until=least(valid_until,(p->>'valid_from')::date-1),version=version+1,updated_at=now() where id=target;
  end if;
  if nullif(p->>'worker_id','') is not null and not exists(select 1 from memberships where user_id=(p->>'worker_id')::uuid and region_id=r and role='worker' and active) then raise exception 'Petugas jadwal tidak aktif di wilayah ini.'; end if;
  insert into schedules(region_id,service,zone,weekdays,start_time,end_time,valid_from,valid_until,source,confirmed_at,worker_id)
  values(r,require_text(p,'service',3),require_text(p,'zone',3),array(select value::integer from jsonb_array_elements_text(p->'weekdays')),(p->>'start_time')::time,(p->>'end_time')::time,(p->>'valid_from')::date,(p->>'valid_until')::date,require_text(p,'source',3),case when (p->>'confirmed')::boolean then now() end,nullif(p->>'worker_id','')::uuid) returning id into target;
  perform audit(r,'schedule',target,'Aturan jadwal disimpan',p->>'source');
 elsif op in ('schedule.exception','schedule.run') then
  select * into sch from schedules where id=target for update; if not found then raise exception 'Jadwal tidak ditemukan.'; end if; r:=sch.region_id;
  if (p->>'date')::date not between sch.valid_from and sch.valid_until or not (extract(dow from (p->>'date')::date)::integer=any(sch.weekdays)) then raise exception 'Tanggal tidak termasuk aturan jadwal.'; end if;
  if op='schedule.exception' then
   perform require_coordinator(r); if (p->>'cancelled')::boolean is not true and ((p->>'start_time')::time is null or (p->>'end_time')::time is null or (p->>'end_time')::time<=(p->>'start_time')::time) then raise exception 'Rentang jam perubahan tidak sah.'; end if;
   insert into schedule_exceptions(schedule_id,region_id,date,cancelled,start_time,end_time,reason) values(target,r,(p->>'date')::date,coalesce((p->>'cancelled')::boolean,false),(p->>'start_time')::time,(p->>'end_time')::time,require_text(p,'reason',3));
  else
   if not has_role(r,'coordinator') and not (sch.worker_id is not distinct from actor and has_role(r,'worker')) then raise exception using message='Pelaksanaan bukan tanggung jawab Anda.',errcode='42501'; end if;
   if (p->>'actual_at')::timestamptz>now()+interval '5 minutes' or ((p->>'actual_at')::timestamptz at time zone 'Asia/Jakarta')::date<>(p->>'date')::date then raise exception 'Waktu aktual harus pada tanggal layanan dan sudah terjadi.'; end if;
   insert into schedule_runs(schedule_id,region_id,date,actual_at,note,actor_id) values(target,r,(p->>'date')::date,(p->>'actual_at')::timestamptz,require_text(p,'reason',3),actor);
  end if; perform audit(r,'schedule',target,'Jadwal diperbarui',p->>'reason');
 elsif op in ('prevention.create','prevention.evaluate') then
  if op='prevention.create' then
   select * into pt from points where id=(p->>'point_id')::uuid; if not found then raise exception 'Titik tidak ditemukan.'; end if; r:=pt.region_id; perform require_coordinator(r);
   insert into preventions(region_id,point_id,hypothesis,basis,action,pic,evaluate_on) values(r,pt.id,require_text(p,'hypothesis',3),require_text(p,'basis',3),require_text(p,'action',3),require_text(p,'pic',3),(p->>'evaluate_on')::date) returning id into target;
  else
   select region_id,version into r,n from preventions where id=target for update; perform require_coordinator(r);
   if n is distinct from (p->>'version')::integer then raise exception using message='Pencegahan sudah berubah.',errcode='40001'; end if;
   update preventions set result=require_text(p,'result',3),evaluated_at=now(),version=version+1 where id=target;
  end if; perform audit(r,'prevention',target,'Pencegahan diperbarui','Dugaan penyebab perlu konfirmasi.');
 elsif op='event.create' then
  perform require_coordinator(r);
  if nullif(p->>'point_id','') is not null and not exists(select 1 from points where id=(p->>'point_id')::uuid and region_id=r) then raise exception 'Titik kegiatan di luar wilayah.'; end if;
  if nullif(p->>'incident_id','') is not null and not exists(select 1 from incidents where id=(p->>'incident_id')::uuid and region_id=r) then raise exception 'Insiden kegiatan di luar wilayah.'; end if;
  insert into events(region_id,point_id,incident_id,title,location,starts_at,capacity,pic,duties,equipment,transporter,pickup_at,destination,transport_confirmed)
  values(r,nullif(p->>'point_id','')::uuid,nullif(p->>'incident_id','')::uuid,require_text(p,'title',3),require_text(p,'location',3),(p->>'starts_at')::timestamptz,(p->>'capacity')::integer,require_text(p,'pic',3),require_text(p,'duties',3),require_text(p,'equipment',3),coalesce(p->>'transporter',''),nullif(p->>'pickup_at','')::timestamptz,coalesce(p->>'destination',''),coalesce((p->>'transport_confirmed')::boolean,false)) returning id into target;
  perform audit(r,'event',target,'Draf kegiatan','Rencana pengangkutan perlu diperiksa sebelum terbit.');
 elsif op in ('event.transport','event.publish','event.join','event.leave','event.complete','event.duty') then
  select * into ev from events where id=target for update; if not found then raise exception 'Kegiatan tidak ditemukan.'; end if; r:=ev.region_id;
  if op in ('event.join','event.leave') then
   if ev.status<>'published' or ev.starts_at<=now() then raise exception 'Pendaftaran tidak dibuka.'; end if;
   if op='event.join' then
    if exists(select 1 from registrations where event_id=target and user_id=actor) then result:=jsonb_build_object('id',target,'message','Anda sudah terdaftar.');
    else select count(*) into n from registrations where event_id=target; if n>=ev.capacity then raise exception using message='Kapasitas kegiatan sudah penuh.',errcode='40001'; end if;
     insert into registrations(event_id,user_id,duty) values(target,actor,'Peserta — menunggu pembagian tugas');
    end if;
   else delete from registrations where event_id=target and user_id=actor; end if;
  else
   perform require_coordinator(r); if ev.version is distinct from (p->>'version')::integer then raise exception using message='Kegiatan sudah berubah.',errcode='40001'; end if;
   if op='event.transport' then
    if ev.status<>'draft' then raise exception 'Rencana hanya dapat diperbarui pada draf.'; end if;
    update events set transporter=require_text(p,'transporter',3),pickup_at=(p->>'pickup_at')::timestamptz,destination=require_text(p,'destination',3),transport_confirmed=coalesce((p->>'transport_confirmed')::boolean,false),version=version+1 where id=target;
   elsif op='event.publish' then
    if ev.status<>'draft' or not ev.transport_confirmed or length(ev.transporter)<3 or length(ev.destination)<3 or ev.pickup_at is null or ev.pickup_at<ev.starts_at or ev.starts_at<=now() then raise exception 'Konfirmasi pengangkut, waktu, tujuan, dan jadwal kegiatan sebelum menerbitkan.'; end if;
    update events set status='published',version=version+1 where id=target;
   elsif op='event.duty' then
    update registrations set duty=require_text(p,'duty',3) where event_id=target and user_id=(p->>'user_id')::uuid; if not found then raise exception 'Peserta tidak ditemukan.'; end if;
    update events set version=version+1 where id=target;
   else
    if ev.status<>'published' or nullif(p->>'performed_at','') is null or (p->>'performed_at')::timestamptz>now()+interval '5 minutes' or (p->>'performed_at')::timestamptz<ev.starts_at then raise exception 'Kegiatan belum dapat diselesaikan.'; end if;
    note:=require_text(p,'transport_status',3); if note not in ('Sudah diangkut','Tertunda — perlu tindak lanjut') then raise exception 'Status pengangkutan tidak sah.'; end if;
    perform attach_photos(p,'event',target);
    update events set status='completed',completion_note=require_text(p,'completion_note',3),performed_at=(p->>'performed_at')::timestamptz,transport_status=note,version=version+1 where id=target;
   end if;
   perform audit(r,'event',target,'Kegiatan diperbarui',op);
  end if;
 elsif op='notification.read' then update notifications set read_at=now() where id=target and user_id=actor;
 elsif op in ('admin.region','admin.membership','admin.moderate') then
  if not is_admin() then raise exception using message='Hanya administrator.',errcode='42501'; end if; note:=require_text(p,'reason',3);
  if op='admin.region' then
   if target is null then
    insert into regions(name,coverage,active,owner_label,lat,lng) values(require_text(p,'name',3),require_text(p,'coverage',3),coalesce((p->>'active')::boolean,false),require_text(p,'owner_label',3),(p->>'lat')::float8,(p->>'lng')::float8) returning id into target; r:=target;
   else
    select version into n from regions where id=target for update; if n is distinct from (p->>'version')::integer then raise exception using message='Wilayah sudah berubah.',errcode='40001'; end if; r:=target;
    update regions set active=coalesce((p->>'active')::boolean,false),recurrence_count=(p->>'recurrence_count')::integer,recurrence_days=(p->>'recurrence_days')::integer,version=version+1 where id=target;
   end if;
  elsif op='admin.membership' then
   if not exists(select 1 from profiles where id=(p->>'user_id')::uuid) then raise exception 'Akun belum terdaftar.'; end if;
   insert into memberships(user_id,region_id,role,active) values((p->>'user_id')::uuid,r,require_text(p,'role'),coalesce((p->>'active')::boolean,true)) on conflict(user_id,region_id,role) do update set active=excluded.active; target:=(p->>'user_id')::uuid;
  else
   if p->>'entity_type'='report' then select region_id into r from reports where id=target; update reports set hidden=coalesce((p->>'hidden')::boolean,true),version=version+1 where id=target;
   elsif p->>'entity_type'='incident' then select region_id into r from incidents where id=target; update incidents set hidden=coalesce((p->>'hidden')::boolean,true),version=version+1 where id=target;
   else raise exception 'Jenis konten moderasi tidak sah.'; end if;
  end if; perform audit(r,'admin',target,'Moderasi / akses wilayah',note);
 else raise exception using message='Tindakan tidak dikenal.',errcode='22023'; end if;
 result:=coalesce(result,jsonb_build_object('id',target,'message','Perubahan tersimpan.'));
 insert into command_receipts(actor_id,key,payload,result) values(actor,request_key,p,result);
 return result;
end $$;

-- Replacing the existing gateway preserves receipt/lock/history behavior and grants.
revoke execute on function public.command(jsonb,uuid) from public,anon;
grant execute on function public.command(jsonb,uuid) to authenticated;
-- Notify coordinators of task changes and reporters of report rejection.
create or replace function public.audit(r uuid, kind text, entity uuid, act text, note text)
returns void language plpgsql security definer set search_path=public as $$
begin
 insert into history(region_id,entity_type,entity_id,actor_id,action,note)
 values(r,kind,entity,auth.uid(),act,note);
 insert into notifications(user_id,region_id,message,entity_id)
 select recipient,r,act||': '||note,entity from (
  select reporter_id as recipient from reports where kind='incident' and incident_id=entity
  union select worker_id from tasks where kind='incident' and incident_id=entity and status in ('offered','accepted','submitted') and exists(select 1 from memberships m where m.user_id=tasks.worker_id and m.region_id=r and m.role='worker' and m.active)
  union select user_id from memberships where region_id=r and role='coordinator' and active
  union select reporter_id from reports where kind='report' and id=entity
 ) recipients;
end $$;
revoke execute on function public.audit(uuid,text,uuid,text,text) from public,anon,authenticated;
