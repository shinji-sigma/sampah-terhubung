-- SECURITY DEFINER bypasses schedule RLS: enforce publication in the RPC itself.
-- Draft-linked exceptions/runs are private too. CREATE OR REPLACE retains the
-- existing owner and EXECUTE grants; keep all payload keys and ID redactions.
create or replace function public.public_region_data(r uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
 'regions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from regions x),
 'schedules',(select coalesce(jsonb_agg(to_jsonb(x)-'worker_id'),'[]') from schedules x where region_id=r and confirmed_at is not null),
 'exceptions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from schedule_exceptions x where region_id=r and exists(select 1 from schedules s where s.id=x.schedule_id and s.region_id=r and s.confirmed_at is not null)),
 'runs',(select coalesce(jsonb_agg(to_jsonb(x)-'actor_id'),'[]') from schedule_runs x where region_id=r and exists(select 1 from schedules s where s.id=x.schedule_id and s.region_id=r and s.confirmed_at is not null)),
 'incidents',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'public_label',public_label,'status',status,'verified_at',verified_at)),'[]') from incidents where region_id=r and not hidden),
 'events',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('participants',(select count(*) from registrations where event_id=x.id))),'[]') from events x where region_id=r and status<>'draft')
 ) $$;
