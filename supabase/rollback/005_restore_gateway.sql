-- Emergency rollback paired with promoting the previous Vercel deployment.
-- Leaves reports/photos and all metadata intact; disables the new evidence rule.
begin;
alter function public.command(jsonb,uuid) rename to command_evidence_005;
revoke all on function public.command_evidence_005(jsonb,uuid) from public,anon,authenticated,service_role;
alter function public.command_legacy_004(jsonb,uuid) rename to command;
revoke all on function public.command(jsonb,uuid) from public,anon;
grant execute on function public.command(jsonb,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
