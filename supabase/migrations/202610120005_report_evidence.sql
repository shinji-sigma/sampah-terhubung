-- Source labels describe client-provided context, never forensic authenticity.
begin;
alter table public.photos
 add column source text check (source in ('camera_web','upload')),
 add column captured_at timestamptz check (captured_at is null or (isfinite(captured_at) and captured_at between timestamptz '0001-01-01' and timestamptz '9999-12-31 23:59:59+00')),
 add constraint camera_capture_time check (source is distinct from 'camera_web' or captured_at is not null);
alter table public.reports
 add column evidence_mode text check (evidence_mode in ('direct','supporting')),
 add column supporting_reason text,
 add column location_confirmed boolean,
 add column device_lat double precision check (device_lat between -90 and 90),
 add column device_lng double precision check (device_lng between -180 and 180),
 add column device_accuracy_m double precision check (device_accuracy_m >= 0 and device_accuracy_m < 'Infinity'::float8),
 add column device_measured_at timestamptz check (device_measured_at is null or (isfinite(device_measured_at) and device_measured_at between timestamptz '0001-01-01' and timestamptz '9999-12-31 23:59:59+00')),
 add constraint complete_device_snapshot check (num_nonnulls(device_lat,device_lng,device_accuracy_m,device_measured_at) in (0,4));

-- Keep the audited transitions intact behind a private gateway, including PT409.
alter function public.command(jsonb,uuid) rename to command_legacy_004;
revoke all on function public.command_legacy_004(jsonb,uuid) from public,anon,authenticated,service_role;
create function public.command(p jsonb, request_key uuid) returns jsonb
language plpgsql security definer set search_path=public as $$
declare result jsonb; snapshot_count integer; mode text;
begin
 if auth.uid() is null then raise exception using message='Silakan masuk terlebih dahulu.',errcode='42501'; end if;
 if octet_length(p::text)>25000 then raise exception using message='Permintaan terlalu besar.',errcode='22023'; end if;
 if p->>'op' <> 'report.create' then return public.command_legacy_004(p,request_key); end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||request_key::text,0));
 -- Existing receipts (including legacy reports) must retain idempotent retries.
 if exists(select 1 from command_receipts where actor_id=auth.uid() and key=request_key) then
  return public.command_legacy_004(p,request_key);
 end if;
 mode:=p->>'evidence_mode';
 if mode is null or mode not in ('direct','supporting') then
  raise exception using message='Pilih jalur bukti laporan. Muat ulang jika formulir lama masih terbuka.',errcode='22023';
 end if;
 if (p->>'location_confirmed')::boolean is distinct from true then
  raise exception using message='Konfirmasikan lokasi kejadian.',errcode='22023';
 end if;
 if num_nonnulls(nullif(p->>'lat',''),nullif(p->>'lng','')) not in (0,2) then
  raise exception using message='Koordinat kejadian harus lengkap.',errcode='22023';
 end if;
 snapshot_count:=num_nonnulls(nullif(p->>'device_lat',''),nullif(p->>'device_lng',''),nullif(p->>'device_accuracy_m',''),nullif(p->>'device_measured_at',''));
 if snapshot_count not in (0,4) or (mode='direct' and snapshot_count<>4) then
  raise exception using message='Ambil lokasi perangkat atau gunakan bukti pendukung.',errcode='22023';
 end if;
 if mode='supporting' then perform require_text(p,'supporting_reason',3); end if;
 if mode='direct' and not exists(
  select 1 from photos where id in (select value::uuid from jsonb_array_elements_text(p->'photos'))
   and owner_id=auth.uid() and source='camera_web' and captured_at is not null
   and report_id is null and task_id is null and event_id is null
 ) then
  raise exception using message='Ambil setidaknya satu foto kamera web atau gunakan bukti pendukung.',errcode='22023';
 end if;
 result:=public.command_legacy_004(p,request_key);
 update reports set evidence_mode=mode,
  supporting_reason=case when mode='supporting' then btrim(p->>'supporting_reason') else null end,
  location_confirmed=true, device_lat=(p->>'device_lat')::float8,device_lng=(p->>'device_lng')::float8,
  device_accuracy_m=(p->>'device_accuracy_m')::float8,device_measured_at=(p->>'device_measured_at')::timestamptz
 where id=(result->>'id')::uuid and reporter_id=auth.uid();
 return result;
end $$;
revoke all on function public.command(jsonb,uuid) from public,anon;
grant execute on function public.command(jsonb,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
