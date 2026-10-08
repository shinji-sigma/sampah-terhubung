-- All writes pass through transactional commands. Tables remain read-only to API roles.
create extension if not exists pgcrypto;
create table public.regions (
 id uuid primary key default gen_random_uuid(), name text not null, coverage text not null,
 active boolean not null default false, owner_label text not null default 'Belum ditetapkan',
 lat double precision not null check(lat between -90 and 90), lng double precision not null check(lng between -180 and 180),
 recurrence_count integer not null default 2 check(recurrence_count between 2 and 20),
 recurrence_days integer not null default 30 check(recurrence_days between 1 and 365), version integer not null default 1
);
create table public.profiles (id uuid primary key references auth.users(id), display_name text not null, is_admin boolean not null default false);
create table public.memberships (user_id uuid references public.profiles(id), region_id uuid references public.regions(id), role text not null check(role in ('coordinator','worker')), active boolean not null default true, primary key(user_id,region_id,role));
create table public.points (id uuid primary key default gen_random_uuid(), region_id uuid not null references public.regions(id), label text not null, lat double precision check(lat between -90 and 90), lng double precision check(lng between -180 and 180));
create table public.incidents (
 id uuid primary key default gen_random_uuid(), region_id uuid not null references public.regions(id), point_id uuid not null references public.points(id),
 status text not null default 'verified' check(status in ('verified','assigned','working','awaiting_review','closed')),
 public_label text not null, hidden boolean not null default false, verified_at timestamptz not null default now(),
 observed_at timestamptz not null, closed_at timestamptz, reviewer_id uuid references public.profiles(id),
 previous_incident_id uuid references public.incidents(id), previous_closed_at timestamptz,
 version integer not null default 1, created_at timestamptz not null default now()
);
create unique index one_open_incident_per_point on public.incidents(point_id) where status <> 'closed';
create table public.reports (
 id uuid primary key default gen_random_uuid(), region_id uuid not null references public.regions(id), reporter_id uuid not null references public.profiles(id),
 incident_id uuid references public.incidents(id), category text not null check(category in ('Penumpukan','Tempat sampah penuh','Sampah berserakan')),
 landmark text not null, description text not null, observed_at timestamptz not null, lat double precision check(lat between -90 and 90), lng double precision check(lng between -180 and 180),
 status text not null default 'pending' check(status in ('pending','validated','rejected')), reason text, hidden boolean not null default false,
 version integer not null default 1, created_at timestamptz not null default now()
);
create table public.tasks (
 id uuid primary key default gen_random_uuid(), incident_id uuid not null references public.incidents(id), region_id uuid not null references public.regions(id),
 worker_id uuid not null references public.profiles(id), status text not null default 'offered' check(status in ('offered','accepted','rejected','superseded','submitted','verified')),
 due_at timestamptz not null, accepted_at timestamptz, reason text, blocker text, action_taken text, performed_at timestamptz, moved boolean not null default false, destination text,
 version integer not null default 1, created_at timestamptz not null default now()
);
create unique index one_current_task on public.tasks(incident_id) where status in ('offered','accepted','submitted');
create table public.feedback (id uuid primary key default gen_random_uuid(), report_id uuid not null references public.reports(id), region_id uuid not null references public.regions(id), author_id uuid not null references public.profiles(id), note text not null, reviewed_at timestamptz, review_note text, created_at timestamptz not null default now());
create table public.schedules (
 id uuid primary key default gen_random_uuid(), region_id uuid not null references public.regions(id), service text not null, zone text not null,
 weekdays integer[] not null check(cardinality(weekdays) between 1 and 7 and weekdays <@ array[0,1,2,3,4,5,6]), start_time time not null, end_time time not null check(end_time > start_time),
 valid_from date not null, valid_until date not null check(valid_until >= valid_from), source text not null,
 confirmed_at timestamptz, worker_id uuid references public.profiles(id), version integer not null default 1, updated_at timestamptz not null default now()
);
create table public.schedule_exceptions (id uuid primary key default gen_random_uuid(), schedule_id uuid not null references public.schedules(id), region_id uuid not null references public.regions(id), date date not null, cancelled boolean not null default false, start_time time, end_time time, reason text not null, created_at timestamptz not null default now());
create table public.schedule_runs (id uuid primary key default gen_random_uuid(), schedule_id uuid not null references public.schedules(id), region_id uuid not null references public.regions(id), date date not null, actual_at timestamptz not null, note text not null, actor_id uuid not null references public.profiles(id), unique(schedule_id,date));
create table public.preventions (id uuid primary key default gen_random_uuid(), region_id uuid not null references public.regions(id), point_id uuid not null references public.points(id), hypothesis text not null, basis text not null, action text not null, pic text not null, evaluate_on date not null, result text, evaluated_at timestamptz, version integer not null default 1);
create table public.events (
 id uuid primary key default gen_random_uuid(), region_id uuid not null references public.regions(id), point_id uuid references public.points(id), incident_id uuid references public.incidents(id),
 title text not null, location text not null, starts_at timestamptz not null, capacity integer not null check(capacity between 1 and 500),
 pic text not null, duties text not null, equipment text not null, transporter text not null, pickup_at timestamptz, destination text not null,
 transport_confirmed boolean not null default false, status text not null default 'draft' check(status in ('draft','published','completed')),
 transport_status text, completion_note text, performed_at timestamptz, version integer not null default 1, created_at timestamptz not null default now()
);
create table public.registrations (event_id uuid references public.events(id), user_id uuid references public.profiles(id), duty text not null, created_at timestamptz not null default now(), primary key(event_id,user_id));
create table public.photos (id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id), path text not null unique, report_id uuid references public.reports(id), task_id uuid references public.tasks(id), event_id uuid references public.events(id), size integer not null check(size between 1 and 5242880), mime text not null check(mime='image/jpeg'), created_at timestamptz not null default now(), check(num_nonnulls(report_id,task_id,event_id)<=1));
create table public.history (id bigint generated always as identity primary key, region_id uuid not null references public.regions(id), entity_type text not null, entity_id uuid not null, actor_id uuid not null references public.profiles(id), action text not null, note text not null, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), region_id uuid not null references public.regions(id), message text not null, entity_id uuid, read_at timestamptz, created_at timestamptz not null default now());
create table public.command_receipts (actor_id uuid references public.profiles(id), key uuid, payload jsonb not null, result jsonb not null, primary key(actor_id,key));

create function public.on_signup() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,display_name) values(new.id, left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Pelapor'),80)); return new; end $$;
create trigger signup_profile after insert on auth.users for each row execute function public.on_signup();
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select coalesce((select is_admin from profiles where id=auth.uid()),false) $$;
create function public.has_role(r uuid, wanted text) returns boolean language sql stable security definer set search_path=public as $$ select public.is_admin() or exists(select 1 from memberships where user_id=auth.uid() and region_id=r and role=wanted and active) $$;
create function public.can_incident(i uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from incidents x where x.id=i and (has_role(x.region_id,'coordinator') or exists(select 1 from reports where incident_id=i and reporter_id=auth.uid()) or exists(select 1 from tasks where incident_id=i and worker_id=auth.uid() and has_role(x.region_id,'worker')))) $$;
create function public.can_report(r uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from reports x where x.id=r and (x.reporter_id=auth.uid() or has_role(x.region_id,'coordinator') or (x.status='validated' and exists(select 1 from tasks where incident_id=x.incident_id and worker_id=auth.uid() and has_role(x.region_id,'worker'))))) $$;
create function public.can_photo(p uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from photos x where x.id=p and ((x.owner_id=auth.uid() and x.report_id is null and x.task_id is null and x.event_id is null) or can_report(x.report_id) or exists(select 1 from tasks where id=x.task_id and can_incident(incident_id)) or exists(select 1 from events where id=x.event_id and has_role(region_id,'coordinator')))) $$;

alter table regions enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table points enable row level security;
alter table incidents enable row level security;
alter table reports enable row level security;
alter table tasks enable row level security;
alter table feedback enable row level security;
alter table schedules enable row level security;
alter table schedule_exceptions enable row level security;
alter table schedule_runs enable row level security;
alter table preventions enable row level security;
alter table events enable row level security;
alter table registrations enable row level security;
alter table photos enable row level security;
alter table history enable row level security;
alter table notifications enable row level security;
alter table command_receipts enable row level security;
create policy regions_read on regions for select using(true);
create policy profiles_read on profiles for select using(id=auth.uid() or is_admin() or exists(select 1 from memberships m where m.user_id=profiles.id and has_role(m.region_id,'coordinator')));
create policy memberships_read on memberships for select using(user_id=auth.uid() or has_role(region_id,'coordinator'));
create policy points_read on points for select using(has_role(region_id,'coordinator') or exists(select 1 from incidents i where i.point_id=points.id and can_incident(i.id)));
create policy incidents_read on incidents for select using(can_incident(id));
create policy reports_read on reports for select using(can_report(id));
create policy tasks_read on tasks for select using(has_role(region_id,'coordinator') or (worker_id=auth.uid() and has_role(region_id,'worker')));
create policy feedback_read on feedback for select using(author_id=auth.uid() or has_role(region_id,'coordinator'));
create policy schedules_read on schedules for select using(confirmed_at is not null or has_role(region_id,'coordinator'));
create policy exceptions_read on schedule_exceptions for select using(exists(select 1 from schedules s where s.id=schedule_id));
create policy runs_read on schedule_runs for select using(exists(select 1 from schedules s where s.id=schedule_id));
create policy preventions_read on preventions for select using(has_role(region_id,'coordinator'));
create policy events_read on events for select using(status<>'draft' or has_role(region_id,'coordinator'));
create policy registrations_read on registrations for select using(user_id=auth.uid() or exists(select 1 from events where id=event_id and has_role(region_id,'coordinator')));
create policy photos_read on photos for select using(can_photo(id));
create policy history_read on history for select using(has_role(region_id,'coordinator') or (entity_type='incident' and can_incident(entity_id)) or (entity_type='report' and can_report(entity_id)));
create policy notifications_read on notifications for select using(user_id=auth.uid());
grant select on all tables in schema public to anon, authenticated;
revoke insert,update,delete on all tables in schema public from anon,authenticated;

-- Public projection omits all user IDs, report text, precise coordinates and photo paths.
create function public.public_region_data(r uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
 'regions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from regions x),
 'schedules',(select coalesce(jsonb_agg(to_jsonb(x)-'worker_id'),'[]') from schedules x where region_id=r),
 'exceptions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from schedule_exceptions x where region_id=r),
 'runs',(select coalesce(jsonb_agg(to_jsonb(x)-'actor_id'),'[]') from schedule_runs x where region_id=r),
 'incidents',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'public_label',public_label,'status',status,'verified_at',verified_at)),'[]') from incidents where region_id=r and not hidden),
 'events',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('participants',(select count(*) from registrations where event_id=x.id))),'[]') from events x where region_id=r and status<>'draft')
 ) $$;

create function public.require_text(p jsonb, k text, min_length integer default 1) returns text language plpgsql immutable set search_path=public as $$
declare v text:=btrim(coalesce(p->>k,'')); begin if length(v)<min_length or length(v)>2000 then raise exception using message='Isian '||k||' wajib dan maksimal 2000 karakter.',errcode='22023'; end if; return v; end $$;
create function public.require_coordinator(r uuid) returns void language plpgsql stable security definer set search_path=public as $$ begin if not has_role(r,'coordinator') then raise exception using message='Tidak memiliki akses koordinator wilayah ini.',errcode='42501'; end if; end $$;
create function public.audit(r uuid, kind text, entity uuid, act text, note text) returns void language plpgsql security definer set search_path=public as $$ begin
 insert into history(region_id,entity_type,entity_id,actor_id,action,note) values(r,kind,entity,auth.uid(),act,note);
 if kind='incident' then
 insert into notifications(user_id,region_id,message,entity_id) select distinct reporter_id,r,act||': '||note,entity from reports where incident_id=entity;
 insert into notifications(user_id,region_id,message,entity_id) select distinct worker_id,r,act||': '||note,entity from tasks where incident_id=entity and status in ('offered','accepted','submitted');
 else
 insert into notifications(user_id,region_id,message,entity_id) select user_id,r,act||': '||note,entity from memberships where region_id=r and role='coordinator' and active;
 end if;
end $$;
create function public.attach_photos(p jsonb, kind text, entity uuid) returns void language plpgsql security definer set search_path=public as $$
declare ids uuid[]; n integer; begin
 select array_agg(value::uuid) into ids from jsonb_array_elements_text(coalesce(p->'photos','[]'));
 if cardinality(ids) is null or cardinality(ids) not between 1 and 3 then raise exception using message='Gunakan 1–3 foto.',errcode='22023'; end if;
 perform id from photos where id=any(ids) for update;
 select count(*) into n from photos where id=any(ids) and owner_id=auth.uid() and report_id is null and task_id is null and event_id is null;
 if n<>cardinality(ids) then raise exception using message='Foto tidak tersedia atau bukan milik Anda.',errcode='42501'; end if;
 update photos set report_id=case when kind='report' then entity else null end, task_id=case when kind='task' then entity else null end, event_id=case when kind='event' then entity else null end where id=any(ids);
end $$;

-- The single command gateway provides idempotency, row locks and optimistic versions.
create function public.command(p jsonb, request_key uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare
 actor uuid:=auth.uid(); op text:=p->>'op'; r uuid; target uuid; result jsonb; saved command_receipts;
 rep reports; inc incidents; task tasks; ev events; sch schedules; pt points; prev incidents; n integer; note text;
begin
 if actor is null then raise exception using message='Silakan masuk terlebih dahulu.',errcode='42501'; end if;
 if octet_length(p::text)>25000 then raise exception using message='Permintaan terlalu besar.',errcode='22023'; end if;
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
   if (p->>'performed_at')::timestamptz>now()+interval '5 minutes' then raise exception 'Waktu pekerjaan belum terjadi.'; end if;
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
   if not has_role(r,'coordinator') and not (sch.worker_id=actor and has_role(r,'worker')) then raise exception using message='Pelaksanaan bukan tanggung jawab Anda.',errcode='42501'; end if;
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
    if ev.status<>'published' or (p->>'performed_at')::timestamptz>now()+interval '5 minutes' or (p->>'performed_at')::timestamptz<ev.starts_at then raise exception 'Kegiatan belum dapat diselesaikan.'; end if;
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

-- Internal helpers are not exposed as writable RPC endpoints.
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.is_admin(),public.has_role(uuid,text),public.can_incident(uuid),public.can_report(uuid),public.can_photo(uuid),public.public_region_data(uuid) to anon,authenticated;
grant execute on function public.command(jsonb,uuid) to authenticated;
-- Only the server service role can register validated/re-encoded photos.
grant insert,delete on public.photos to service_role;
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('evidence','evidence',false,5242880,array['image/jpeg']);
-- No client INSERT/UPDATE/DELETE storage policies: upload validation cannot be bypassed.
create policy evidence_read on storage.objects for select to authenticated using(bucket_id='evidence' and exists(select 1 from public.photos p where p.path=name and public.can_photo(p.id)));
