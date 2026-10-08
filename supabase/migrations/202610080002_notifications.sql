-- Notify coordinators of task changes and reporters of report rejection.
create or replace function public.audit(r uuid, kind text, entity uuid, act text, note text)
returns void language plpgsql security definer set search_path=public as $$
begin
 insert into history(region_id,entity_type,entity_id,actor_id,action,note)
 values(r,kind,entity,auth.uid(),act,note);
 insert into notifications(user_id,region_id,message,entity_id)
 select recipient,r,act||': '||note,entity from (
  select reporter_id as recipient from reports where kind='incident' and incident_id=entity
  union select worker_id from tasks where kind='incident' and incident_id=entity and status in ('offered','accepted','submitted')
  union select user_id from memberships where region_id=r and role='coordinator' and active
  union select reporter_id from reports where kind='report' and id=entity
 ) recipients;
end $$;
revoke execute on function public.audit(uuid,text,uuid,text,text) from public,anon,authenticated;
