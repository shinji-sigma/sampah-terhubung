import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL execution, isolated from remote Supabase/Auth/Storage.
test("public RPC exposes only confirmed schedules and their related records despite SECURITY DEFINER", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
      $$;
      grant usage on schema public,auth,storage to anon,authenticated,service_role;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant select,insert,update,delete on storage.objects to authenticated;
    `);
    for (const name of (await readdir("supabase/migrations")).sort()) {
      if (!name.endsWith(".sql")) continue;
      const sql = await readFile("supabase/migrations/" + name, "utf8");
      await db.exec(
        sql.replace(
          "create extension if not exists pgcrypto;",
          "-- PGlite provides gen_random_uuid",
        ),
      );
    }
    const region = "10000000-0000-4000-8000-000000000001";
    const other = "10000000-0000-4000-8000-000000000002";
    const inactive = "10000000-0000-4000-8000-000000000003";
    const actor = "20000000-0000-4000-8000-000000000001";
    await db.query(
      "insert into regions(id,name,coverage,active,lat,lng) values($1,'Region A','A',true,-7.3,112.7),($2,'Region B','B',true,-7.31,112.71),($3,'Inactive','C',false,-7.32,112.72)",
      [region, other, inactive],
    );
    await db.query("insert into auth.users(id) values($1)", [actor]);
    const schedules = await db.query<{ id: string; service: string }>(
      `
      insert into schedules(region_id,service,zone,weekdays,start_time,end_time,valid_from,valid_until,source,confirmed_at,worker_id)
      values ($1,'confirmed','Zone A',array[1],'08:00','10:00','2026-01-01','2026-12-31','Public source',now(),$3),
             ($1,'draft','Zone A',array[1],'08:00','10:00','2026-01-01','2026-12-31','Private draft source',null,$3),
             ($2,'other region','Zone B',array[1],'08:00','10:00','2026-01-01','2026-12-31','Other source',now(),$3),
             ($4,'inactive region schedule','Zone C',array[1],'08:00','10:00','2026-01-01','2026-12-31','Inactive source',now(),$3)
      returning id,service
    `,
      [region, other, actor, inactive],
    );
    const confirmed = schedules.rows.find(
      (row) => row.service === "confirmed",
    )!.id;
    for (const row of schedules.rows) {
      const r =
        row.service === "other region"
          ? other
          : row.service === "inactive region schedule"
            ? inactive
            : region;
      await db.query(
        `insert into schedule_exceptions(schedule_id,region_id,date,cancelled,reason)
        values($1,$2,'2026-10-19',true,$3)`,
        [row.id, r, row.service + " exception"],
      );
      await db.query(
        `insert into schedule_runs(schedule_id,region_id,date,actual_at,note,actor_id)
        values($1,$2,'2026-10-19','2026-10-19T08:00:00Z',$3,$4)`,
        [row.id, r, row.service + " run", actor],
      );
    }
    // Assert the actual anonymous call: table RLS alone must not be the protection.
    await db.exec("set role anon");
    assert.equal((await db.query("select id from schedules")).rows.length, 0);
    const { rows } = await db.query<{
      payload: Record<string, Record<string, unknown>[]>;
    }>("select public.public_region_data($1) payload", [region]);
    const payload = rows[0].payload;
    assert.deepEqual(
      payload.schedules.map((row) => row.id),
      [confirmed],
      "anonymous SECURITY DEFINER RPC must not disclose draft or other-region schedules",
    );
    assert.deepEqual(
      payload.exceptions.map((row) => row.schedule_id),
      [confirmed],
      "draft-linked exceptions must remain private",
    );
    assert.deepEqual(
      payload.runs.map((row) => row.schedule_id),
      [confirmed],
      "draft-linked runs must remain private",
    );
    assert.equal(payload.schedules[0].source, "Public source");
    assert.equal("worker_id" in payload.schedules[0], false);
    assert.equal("actor_id" in payload.runs[0], false);
    assert.deepEqual(Object.keys(payload).sort(), [
      "events",
      "exceptions",
      "incidents",
      "regions",
      "runs",
      "schedules",
    ]);
    const empty = await db.query<{ payload: typeof payload }>(
      "select public.public_region_data($1) payload",
      ["10000000-0000-4000-8000-000000000099"],
    );
    for (const key of [
      "schedules",
      "exceptions",
      "runs",
      "events",
      "incidents",
    ])
      assert.deepEqual(empty.rows[0].payload[key], []);
    const inactivePayload = await db.query<{ payload: typeof payload }>(
      "select public.public_region_data($1) payload",
      [inactive],
    );
    assert.deepEqual(
      inactivePayload.rows[0].payload.schedules,
      [],
      "inactive region must not expose public schedules even if confirmed",
    );
    await db.exec("reset role");
    const properties = await db.query(`select prosecdef,provolatile,proconfig,
      has_function_privilege('anon',oid,'execute') anon_execute,
      has_function_privilege('authenticated',oid,'execute') authenticated_execute
      from pg_proc where oid='public.public_region_data(uuid)'::regprocedure`);
    assert.deepEqual(properties.rows, [
      {
        prosecdef: true,
        provolatile: "s",
        proconfig: ["search_path=public"],
        anon_execute: true,
        authenticated_execute: true,
      },
    ]);
  } finally {
    await db.close();
  }
});
