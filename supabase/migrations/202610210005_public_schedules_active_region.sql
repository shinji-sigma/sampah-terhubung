-- Deactivating a region withdraws its public schedule data. SECURITY DEFINER
-- bypasses RLS, so the RPC itself requires an active region alongside the
-- confirmation filter. Forward migration: safe whether or not 202610200004 ran.
create or replace function public.public_region_data(r uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
 'regions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from regions x),
 'schedules',(select coalesce(jsonb_agg(to_jsonb(x)-'worker_id'),'[]') from schedules x where region_id=r and confirmed_at is not null and exists(select 1 from regions g where g.id=r and g.active)),
 'exceptions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from schedule_exceptions x where region_id=r and exists(select 1 from regions g where g.id=r and g.active) and exists(select 1 from schedules s where s.id=x.schedule_id and s.region_id=r and s.confirmed_at is not null)),
 'runs',(select coalesce(jsonb_agg(to_jsonb(x)-'actor_id'),'[]') from schedule_runs x where region_id=r and exists(select 1 from regions g where g.id=r and g.active) and exists(select 1 from schedules s where s.id=x.schedule_id and s.region_id=r and s.confirmed_at is not null)),
 'incidents',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'public_label',public_label,'status',status,'verified_at',verified_at)),'[]') from incidents where region_id=r and not hidden),
 'events',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('participants',(select count(*) from registrations where event_id=x.id))),'[]') from events x where region_id=r and status<>'draft')
 ) $$;
