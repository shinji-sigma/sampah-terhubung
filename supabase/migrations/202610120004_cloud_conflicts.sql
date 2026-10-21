-- Application conflicts must return HTTP 409 rather than serialization_failure.
-- PostgREST 14 retries custom 40001 exceptions indefinitely. Preserve migrations
-- 001-003, the function's privileges and all existing data/access controls.
do $migration$
declare
  definition text;
begin
  definition := pg_get_functiondef('public.command(jsonb,uuid)'::regprocedure);
  if position('errcode=''40001''' in definition) > 0 then
    execute replace(definition, 'errcode=''40001''', 'errcode=''PT409''');
  end if;
end
$migration$;

notify pgrst, 'reload schema';
