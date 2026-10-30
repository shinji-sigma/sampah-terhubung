-- Anonymous SUS study responses. Dedicated table is intentionally isolated from
-- existing Cloud tables; no destructive changes or personal/account identifiers.
create table if not exists public.study_responses (
  submission_id uuid primary key,
  participant_code text not null unique check (participant_code ~ '^P-[A-F0-9]{8}$'),
  submitted_at timestamptz not null default now(),
  retention_until timestamptz not null default (now() + interval '90 days'),
  tasks jsonb not null check (jsonb_typeof(tasks) = 'object' and tasks ?& array['schedule','report','status'] and tasks - array['schedule','report','status'] = '{}'::jsonb),
  instrument_version text not null default 'sus-1.0',
  consent boolean not null default true check (consent),
  device text not null check (device in ('phone','tablet','desktop','other')),
  
  answers smallint[] not null check (
    cardinality(answers) = 10 and
    array_position(answers, null) is null and
    answers <@ array[1,2,3,4,5]::smallint[]
  ),
  score numeric(5,2) not null check (score between 0 and 100),
  comment text not null default '' check (length(comment) <= 500)
);
comment on table public.study_responses is 'Anonymous SUS responses; retain for at most 90 days and remove using participant code via study organizer.';
alter table public.study_responses enable row level security;
alter table public.study_responses force row level security;
revoke all on public.study_responses from public, anon, authenticated;
grant all on public.study_responses to service_role;

create or replace function public.submit_study_response(
  p_submission_id uuid,
  p_participant_code text,
  p_device text,
  p_tasks jsonb,
  p_answers integer[],
  p_score numeric,
  p_comment text default ''
) returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  calculated numeric(5,2);
  current_row public.study_responses%rowtype;
  recent_count integer;
begin
  if p_submission_id is null or p_participant_code is null or p_participant_code !~ '^P-[A-F0-9]{8}$' or p_device is null
    or p_device not in ('phone','tablet','desktop','other')
    or p_tasks is null or jsonb_typeof(p_tasks) <> 'object' or not (p_tasks ?& array['schedule','report','status']) or p_tasks - array['schedule','report','status'] <> '{}'::jsonb or exists (select 1 from jsonb_each(p_tasks) where jsonb_typeof(value) <> 'string' or value #>> '{}' not in ('success','help','failed','not_tried'))
    or p_answers is null or cardinality(p_answers) <> 10
    or array_position(p_answers, null) is not null
    or not (p_answers <@ array[1,2,3,4,5])
    or coalesce(length(p_comment),0) > 500 then
    raise exception using message='invalid study response', errcode='22023';
  end if;
  select coalesce(sum(case when n % 2 = 1 then p_answers[n]-1 else 5-p_answers[n] end),0)*2.5
    into calculated from generate_series(1,10) n;
  if p_score is distinct from calculated then
    raise exception using message='invalid study score', errcode='22023';
  end if;
  -- Serialize the hourly quota across instances. Codes are random P-XXXXXXXX,
  -- not derived from network/account data; each code can submit only once.
  perform pg_advisory_xact_lock(210006);
  select * into current_row from public.study_responses where submission_id=p_submission_id;
  if found then
    if current_row.participant_code=p_participant_code
      and current_row.device=p_device and current_row.tasks=p_tasks
      and current_row.answers=p_answers::smallint[] and current_row.score=calculated
      and current_row.comment=coalesce(p_comment,'') then return 'duplicate';
    end if;
    return 'conflict';
  end if;
  select count(*) into recent_count from public.study_responses
    where submitted_at > now()-interval '1 hour';
  if recent_count >= 60 then return 'rate_limited'; end if;
  if exists (select 1 from public.study_responses where participant_code=p_participant_code) then return 'conflict'; end if;
  begin
    insert into public.study_responses(submission_id,participant_code,device,tasks,answers,score,comment)
      values(p_submission_id,p_participant_code,p_device,p_tasks,p_answers::smallint[],calculated,coalesce(p_comment,''));
  exception when unique_violation then
    return 'conflict';
  end;
  return 'created';
end;
$$;
revoke all on function public.submit_study_response(uuid,text,text,jsonb,integer[],numeric,text) from public, anon, authenticated;
grant execute on function public.submit_study_response(uuid,text,text,jsonb,integer[],numeric,text) to anon, authenticated;
