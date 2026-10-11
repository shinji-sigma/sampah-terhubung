import { PGlite } from '@electric-sql/pglite';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema storage; create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth,storage to anon,authenticated,service_role; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; grant select,insert,update,delete on storage.objects to authenticated;`);
await db.exec((await readFile('supabase/migrations/202610080001_core.sql','utf8')).replace('create extension if not exists pgcrypto;', '-- built-in UUID in PGlite'));
await db.exec(await readFile('supabase/migrations/202610080002_notifications.sql','utf8'));
const region = randomUUID(),coord=randomUUID(),worker=randomUUID(),reporter=randomUUID();
await db.query("insert into regions(id,name,coverage,active,lat,lng) values($1,'Audit synthetic','Synthetic',true,0,0)",[region]);
for(const id of [coord,worker,reporter]) await db.query("insert into auth.users(id,raw_user_meta_data) values($1,'{}')",[id]);
await db.query("insert into memberships(user_id,region_id,role) values($1,$2,'coordinator'),($3,$2,'worker')",[coord,region,worker]);
async function as(actor,fn){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[actor||'']);await db.exec(actor?'set role authenticated':'set role anon');try{return await fn();}finally{await db.exec('reset role')}}
async function cmd(actor,p,key=randomUUID()){return await as(actor,()=>db.query('select command($1::jsonb,$2::uuid) result',[JSON.stringify(p),key]))}
async function photo(actor){const id=randomUUID();await db.query("insert into photos(id,owner_id,path,size,mime) values($1,$2,$3,100,'image/jpeg')",[id,actor,actor+'/'+id+'.jpg']);return id}
const findings=[];
async function attempt(name,fn,inspect){try{await fn();findings.push({name,result:'allowed',actual:await inspect()})}catch(e){findings.push({name,result:'denied',message:e.message})}}
const date=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'}),day=new Date(date+'T12:00:00+07:00').getUTCDay();
const sch=randomUUID();await db.query("insert into schedules(id,region_id,service,zone,weekdays,start_time,end_time,valid_from,valid_until,source,confirmed_at) values($1,$2,'Synthetic','Synthetic',$3,'08:00','10:00','2020-01-01','2030-12-31','Synthetic',now())",[sch,region,[day]]);
await attempt('worker can record unassigned schedule run',()=>cmd(worker,{op:'schedule.run',id:sch,date,actual_at:new Date().toISOString(),reason:'Synthetic recorded without assignment'}),async()=>(await db.query('select count(*)::int count from schedule_runs where schedule_id=$1',[sch])).rows);
await db.query('update schedules set worker_id=$1 where id=$2',[worker,sch]);
findings.push({name:'anonymous direct confirmed schedule SELECT',result:'allowed',actual:(await as(null,()=>db.query('select worker_id from schedules where id=$1',[sch]))).rows.map(x=>({worker_id_present:!!x.worker_id}))});
const ev=randomUUID();await db.query("insert into events(id,region_id,title,location,starts_at,capacity,pic,duties,equipment,transporter,destination,status) values($1,$2,'Synthetic','Synthetic',now()-interval '1 day',1,'Synthetic','Synthetic','Synthetic','Synthetic','Synthetic','published')",[ev,region]);
await attempt('event completion missing performed_at bypasses RPC validation',async()=>cmd(coord,{op:'event.complete',id:ev,version:1,completion_note:'Synthetic complete without time',transport_status:'Sudah diangkut',photos:[await photo(coord)]}),async()=>(await db.query('select status,performed_at is null performed_at_missing from events where id=$1',[ev])).rows);
const point=randomUUID(),incident=randomUUID(),task=randomUUID();await db.query("insert into points(id,region_id,label) values($1,$2,'Synthetic')",[point,region]);await db.query("insert into incidents(id,region_id,point_id,status,public_label,observed_at) values($1,$2,$3,'working','Synthetic',now())",[incident,region,point]);await db.query("insert into tasks(id,incident_id,region_id,worker_id,status,due_at) values($1,$2,$3,$4,'accepted',now())",[task,incident,region,worker]);
await attempt('task evidence missing performed_at bypasses RPC validation',async()=>cmd(worker,{op:'task.evidence',id:task,version:1,action_taken:'Synthetic missing time',moved:false,photos:[await photo(worker)]}),async()=>(await db.query('select status,performed_at is null performed_at_missing from tasks where id=$1',[task])).rows);
await db.query('update tasks set performed_at=now() where id=$1',[task]);
await db.query('update memberships set active=false where user_id=$1 and region_id=$2',[worker,region]);
await attempt('inactive worker receives new review notification',()=>cmd(coord,{op:'incident.review',id:incident,version:2,approved:false,reason:'Synthetic private note AFTER membership revoked'}),async()=>({task_rows:(await as(worker,()=>db.query('select id from tasks where id=$1',[task]))).rows.length,new_notification_rows:(await as(worker,()=>db.query("select id from notifications where user_id=$1 and message like '%AFTER membership revoked%'",[worker]))).rows.length}));
await attempt('reporter direct RPC negative-infinity observation',async()=>cmd(reporter,{op:'report.create',region_id:region,category:'Penumpukan',landmark:'Synthetic invalid datetime',description:'Synthetic report invalid datetime',observed_at:'-infinity',photos:[await photo(reporter)]}),async()=>(await db.query("select count(*)::int count from reports where observed_at='-infinity'::timestamptz")).rows);
try { new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeZone:'Asia/Jakarta'}).format(new Date('-infinity')); findings.push({name:'negative-infinity frontend rendering',result:'accepted'}) } catch(e){findings.push({name:'negative-infinity frontend rendering',result:'throws',message:e.message})}
await writeFile('output/audit/security/initial-sql-probes.json',JSON.stringify({backend:'isolated PGlite with auth/storage stubs; no real Supabase',findings},null,2));
process.stdout.write(JSON.stringify(findings,null,2));await db.close();


