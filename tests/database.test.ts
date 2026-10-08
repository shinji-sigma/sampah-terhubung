import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { jakartaDate } from "../src/lib/rules";
const ids = {
  a: "10000000-0000-4000-8000-000000000001",
  b: "10000000-0000-4000-8000-000000000002",
  reporter: "20000000-0000-4000-8000-000000000001",
  other: "20000000-0000-4000-8000-000000000002",
  coord: "20000000-0000-4000-8000-000000000003",
  worker: "20000000-0000-4000-8000-000000000004",
  coordB: "20000000-0000-4000-8000-000000000005",
  admin: "20000000-0000-4000-8000-000000000006",
};
test("PostgreSQL migration, RPC transitions and RLS (isolated PGlite; not Supabase Auth/Storage)", async (t) => {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant select,insert,update,delete on storage.objects to authenticated;
 `);
  const sql = await readFile(
    "supabase/migrations/202610080001_core.sql",
    "utf8",
  );
  await db.exec(
    sql.replace(
      "create extension if not exists pgcrypto;",
      "-- gen_random_uuid built in; pgcrypto extension omitted only in PGlite harness",
    ),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/202610080002_notifications.sql",
      "utf8",
    ),
  );
  await db.query(
    "insert into regions(id,name,coverage,active,lat,lng) values($1,'Simulasi A','Zona A',true,-7.3,112.7),($2,'Simulasi B','Zona B',true,-7.31,112.71)",
    [ids.a, ids.b],
  );
  for (const id of Object.values(ids).slice(2))
    await db.query(
      "insert into auth.users(id,raw_user_meta_data) values($1,$2)",
      [
        id,
        { display_name: "Akun simulasi", is_admin: true, role: "coordinator" },
      ],
    );
  await db.query("update profiles set is_admin=true where id=$1", [ids.admin]);
  await db.query(
    `insert into memberships(user_id,region_id,role) values($1,$2,'coordinator'),($3,$2,'worker'),($4,$5,'coordinator')`,
    [ids.coord, ids.a, ids.worker, ids.coordB, ids.b],
  );
  async function as(actor: string | null, fn: () => Promise<unknown>) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      actor || "",
    ]);
    await db.exec("set role " + (actor ? "authenticated" : "anon"));
    try {
      return await fn();
    } finally {
      await db.exec("reset role");
    }
  }
  async function command(
    actor: string,
    p: Record<string, unknown>,
    key = randomUUID(),
  ) {
    return (await as(actor, async () => {
      const q = await db.query<{ result: { id: string; message: string } }>(
        "select public.command($1::jsonb,$2::uuid) result",
        [JSON.stringify(p), key],
      );
      return q.rows[0].result;
    })) as { id: string; message: string };
  }
  async function photo(owner = ids.reporter) {
    const id = randomUUID();
    await db.query(
      "insert into photos(id,owner_id,path,size,mime) values($1,$2,$3,100,'image/jpeg')",
      [id, owner, owner + "/" + id + ".jpg"],
    );
    return id;
  }
  async function report(
    actor = ids.reporter,
    region = ids.a,
    observed_at = new Date(Date.now() - 60000).toISOString(),
  ) {
    return command(actor, {
      op: "report.create",
      region_id: region,
      category: "Penumpukan",
      landmark: "Belakang pagar simulasi",
      description: "Kantong menumpuk dekat pagar",
      observed_at,
      photos: [await photo(actor)],
    });
  }
  let reportId: string, incidentId: string, taskId: string, pointId: string;
  await t.test(
    "signup metadata cannot grant manager/admin; direct tables are immutable",
    async () => {
      const p = await db.query<{ is_admin: boolean }>(
        "select is_admin from profiles where id=$1",
        [ids.reporter],
      );
      assert.equal(p.rows[0].is_admin, false);
      await assert.rejects(
        () =>
          as(ids.reporter, () => db.exec("update profiles set is_admin=true")),
        /permission denied/,
      );
      await assert.rejects(
        () => as(ids.coord, () => db.exec("update regions set active=false")),
        /permission denied/,
      );
    },
  );
  await t.test(
    "server rules require photos, valid dates, coordinate ranges and active region",
    async () => {
      await assert.rejects(
        () =>
          command(ids.reporter, {
            op: "report.create",
            region_id: ids.a,
            category: "Penumpukan",
            landmark: "Patokan",
            description: "Sampah simulasi",
            observed_at: new Date().toISOString(),
            photos: [],
          }),
        /1–3 foto/,
      );
      await assert.rejects(
        () =>
          command(ids.reporter, {
            op: "report.create",
            region_id: ids.a,
            category: "Penumpukan",
            landmark: "Patokan",
            description: "Sampah simulasi",
            observed_at: "2099-01-01T00:00:00Z",
            photos: [randomUUID()],
          }),
        /masa depan/,
      );
      await assert.rejects(
        () =>
          command(ids.reporter, {
            op: "report.create",
            region_id: ids.a,
            category: "Penumpukan",
            landmark: "Patokan",
            description: "Sampah simulasi",
            observed_at: new Date().toISOString(),
            lat: 91,
            photos: [randomUUID()],
          }),
        /check constraint/,
      );
    },
  );
  await t.test(
    "report submit is idempotent and preserves ownership; reusing key with new payload fails",
    async () => {
      const key = randomUUID(),
        p = {
          op: "report.create",
          region_id: ids.a,
          category: "Penumpukan",
          landmark: "Pagar simulasi",
          description: "Kantong sampah simulasi",
          observed_at: new Date(Date.now() - 60000).toISOString(),
          photos: [await photo()],
        };
      const first = await command(ids.reporter, p, key),
        second = await command(ids.reporter, p, key);
      assert.equal(first.id, second.id);
      reportId = first.id;
      await assert.rejects(
        () =>
          command(ids.reporter, { ...p, description: "Perubahan isi" }, key),
        /isian berbeda/,
      );
    },
  );
  await t.test(
    "pending report and private photo are invisible to strangers, workers and other coordinators",
    async () => {
      for (const actor of [null, ids.other, ids.worker, ids.coordB]) {
        const r = (await as(actor, () =>
          db.query("select id from reports where id=$1", [reportId]),
        )) as { rows: unknown[] };
        assert.equal(r.rows.length, 0);
        const p = (await as(actor, () =>
          db.query("select id from photos where report_id=$1", [reportId]),
        )) as { rows: unknown[] };
        assert.equal(p.rows.length, 0);
      }
      await assert.rejects(
        () =>
          command(ids.coordB, {
            op: "report.validate",
            id: reportId,
            version: 1,
            public_label: "Pagar publik",
          }),
        /akses koordinator/,
      );
      await assert.rejects(
        () =>
          command(ids.coord, {
            op: "report.validate",
            id: reportId,
            public_label: "Pagar publik",
          }),
        /sudah berubah/,
      );
    },
  );
  await t.test(
    "coordinator merges two reports into one incident, preserving both reporters",
    async () => {
      await command(ids.coord, {
        op: "report.validate",
        id: reportId,
        version: 1,
        public_label: "Pagar simulasi",
      });
      const inc = await db.query<{ incident_id: string }>(
        "select incident_id from reports where id=$1",
        [reportId],
      );
      incidentId = inc.rows[0].incident_id;
      const pt = await db.query<{ point_id: string }>(
        "select point_id from incidents where id=$1",
        [incidentId],
      );
      pointId = pt.rows[0].point_id;
      const second = await report(ids.other);
      await command(ids.coord, {
        op: "report.validate",
        id: second.id,
        version: 1,
        incident_id: incidentId,
      });
      const count = await db.query<{ count: number }>(
        "select count(*)::int count from reports where incident_id=$1",
        [incidentId],
      );
      assert.equal(count.rows[0].count, 2);
      const owned = (await as(ids.other, () =>
        db.query("select id from incidents where id=$1", [incidentId]),
      )) as { rows: unknown[] };
      assert.equal(owned.rows.length, 1);
    },
  );
  await t.test(
    "offered task is not working; rejection requires reason and returns verified; reassignment preserves history",
    async () => {
      await command(ids.coord, {
        op: "incident.assign",
        id: incidentId,
        version: 1,
        worker_id: ids.worker,
        due_at: new Date().toISOString(),
        reason: "Kebutuhan angkut simulasi",
      });
      const tasks = await db.query<{ id: string }>(
        "select id from tasks where incident_id=$1",
        [incidentId],
      );
      taskId = tasks.rows[0].id;
      const status = await db.query<{ status: string }>(
        "select status from incidents where id=$1",
        [incidentId],
      );
      assert.equal(status.rows[0].status, "assigned");
      await assert.rejects(
        () =>
          command(ids.worker, {
            op: "task.reject",
            id: taskId,
            version: 1,
            reason: "",
          }),
        /wajib/,
      );
      await command(ids.worker, {
        op: "task.reject",
        id: taskId,
        version: 1,
        reason: "Armada tidak tersedia",
      });
      await command(ids.coord, {
        op: "incident.assign",
        id: incidentId,
        version: 3,
        worker_id: ids.worker,
        due_at: new Date().toISOString(),
        reason: "Armada simulasi tersedia",
      });
      const active = await db.query<{ id: string }>(
        "select id from tasks where incident_id=$1 and status='offered'",
        [incidentId],
      );
      taskId = active.rows[0].id;
      const total = await db.query<{ count: number }>(
        "select count(*)::int count from tasks where incident_id=$1",
        [incidentId],
      );
      assert.equal(total.rows[0].count, 2);
    },
  );
  await t.test(
    "only assigned worker can accept; stale acceptance fails; blocker does not close incident",
    async () => {
      await assert.rejects(
        () => command(ids.other, { op: "task.accept", id: taskId, version: 1 }),
        /bukan milik/,
      );
      await command(ids.worker, { op: "task.accept", id: taskId, version: 1 });
      await assert.rejects(
        () =>
          command(ids.worker, { op: "task.accept", id: taskId, version: 1 }),
        /sudah berubah/,
      );
      await command(ids.worker, {
        op: "task.block",
        id: taskId,
        version: 2,
        reason: "Akses lokasi simulasi tertutup",
      });
    },
  );
  await t.test(
    "evidence needs destination for moved waste; coordinator verifies before closure",
    async () => {
      await assert.rejects(
        () =>
          command(ids.coord, {
            op: "incident.review",
            id: incidentId,
            version: 5,
            approved: true,
            reason: "Coba tutup tanpa bukti",
          }),
        /belum menunggu/,
      );
      await assert.rejects(
        async () =>
          command(ids.worker, {
            op: "task.evidence",
            id: taskId,
            version: 3,
            action_taken: "Sampah diangkut",
            performed_at: new Date().toISOString(),
            moved: true,
            photos: [await photo(ids.worker)],
          }),
        /Tujuan/,
      );
      await command(ids.worker, {
        op: "task.evidence",
        id: taskId,
        version: 3,
        action_taken: "Sampah diangkut simulasi",
        performed_at: new Date().toISOString(),
        moved: true,
        destination: "TPS simulasi",
        photos: [await photo(ids.worker)],
      });
      await assert.rejects(
        () =>
          command(ids.reporter, {
            op: "incident.review",
            id: incidentId,
            version: 6,
            approved: true,
            reason: "Pelapor mencoba menutup",
          }),
        /akses koordinator/,
      );
      await command(ids.coord, {
        op: "incident.review",
        id: incidentId,
        version: 6,
        approved: false,
        reason: "Foto perlu dilengkapi",
      });
      await command(ids.worker, {
        op: "task.evidence",
        id: taskId,
        version: 5,
        action_taken: "Bukti tambahan simulasi",
        performed_at: new Date().toISOString(),
        moved: false,
        photos: [await photo(ids.worker)],
      });
      await command(ids.coord, {
        op: "incident.review",
        id: incidentId,
        version: 8,
        approved: true,
        reason: "Bukti diperiksa koordinator",
      });
    },
  );
  await t.test(
    "feedback does not change worker status; reopen uses same incident; recurrence requires new observation after closure",
    async () => {
      await command(ids.reporter, {
        op: "report.feedback",
        id: reportId,
        reason: "Masih ada sampah simulasi",
      });
      await command(ids.coord, {
        op: "incident.reopen",
        id: incidentId,
        version: 9,
        reason: "Bukti lama belum selesai",
      });
      const count = await db.query<{ count: number }>(
        "select count(*)::int count from incidents where point_id=$1",
        [pointId],
      );
      assert.equal(count.rows[0].count, 1);
      await command(ids.worker, {
        op: "task.evidence",
        id: taskId,
        version: 8,
        action_taken: "Perbaikan bukti pekerjaan",
        performed_at: new Date().toISOString(),
        moved: false,
        photos: [await photo(ids.worker)],
      });
      await command(ids.coord, {
        op: "incident.review",
        id: incidentId,
        version: 11,
        approved: true,
        reason: "Perbaikan telah diperiksa",
      });
      const old = await report();
      await assert.rejects(
        () =>
          command(ids.coord, {
            op: "report.validate",
            id: old.id,
            version: 1,
            point_id: pointId,
            public_label: "Patokan simulasi",
          }),
        /sebelum penanganan/,
      );
      const newer = await report(
        ids.reporter,
        ids.a,
        new Date(Date.now() + 1000).toISOString(),
      );
      await command(ids.coord, {
        op: "report.validate",
        id: newer.id,
        version: 1,
        point_id: pointId,
        public_label: "Patokan simulasi",
      });
      const events = await db.query<{ count: number }>(
        "select count(*)::int count from incidents where point_id=$1",
        [pointId],
      );
      assert.equal(events.rows[0].count, 2);
    },
  );
  await t.test(
    "schedule exceptions append history, enforce valid date and roles; actual runs are unique",
    async () => {
      const date = jakartaDate(),
        day = new Date(date + "T12:00:00Z").getUTCDay();
      const s = await command(ids.coord, {
        op: "schedule.save",
        region_id: ids.a,
        service: "Gerobak simulasi",
        zone: "Zona A",
        weekdays: [day],
        start_time: "08:00",
        end_time: "10:00",
        valid_from: "2020-01-01",
        valid_until: "2030-12-31",
        source: "Konfirmasi pengelola simulasi",
        confirmed: true,
        worker_id: ids.worker,
      });
      await assert.rejects(
        () =>
          command(ids.coordB, {
            op: "schedule.exception",
            id: s.id,
            date,
            cancelled: true,
            reason: "Coba lintas wilayah",
          }),
        /akses koordinator/,
      );
      await command(ids.coord, {
        op: "schedule.exception",
        id: s.id,
        date,
        cancelled: false,
        start_time: "10:00",
        end_time: "12:00",
        reason: "Perubahan jam simulasi",
      });
      await command(ids.coord, {
        op: "schedule.exception",
        id: s.id,
        date,
        cancelled: true,
        reason: "Dibatalkan simulasi",
      });
      const versions = await db.query<{ count: number }>(
        "select count(*)::int count from schedule_exceptions where schedule_id=$1",
        [s.id],
      );
      assert.equal(versions.rows[0].count, 2);
      await command(ids.worker, {
        op: "schedule.run",
        id: s.id,
        date,
        actual_at: new Date().toISOString(),
        reason: "Pengangkutan aktual tercatat",
      });
      await assert.rejects(
        () =>
          command(ids.worker, {
            op: "schedule.run",
            id: s.id,
            date,
            actual_at: new Date().toISOString(),
            reason: "Pengiriman ganda kunci berbeda",
          }),
        /duplicate key/,
      );
      await assert.rejects(
        () =>
          command(ids.worker, {
            op: "schedule.run",
            id: s.id,
            date: "2031-01-01",
            actual_at: new Date().toISOString(),
            reason: "Di luar masa berlaku",
          }),
        /aturan jadwal/,
      );
    },
  );
  await t.test(
    "event draft cannot publish without confirmed transport; last seat is locked and duplicate signup is safe",
    async () => {
      const e = await command(ids.coord, {
        op: "event.create",
        region_id: ids.a,
        title: "Kerja bakti simulasi",
        location: "Pagar simulasi",
        starts_at: "2029-01-01T01:00:00Z",
        capacity: 1,
        pic: "PIC simulasi",
        duties: "Pengumpulan sampah",
        equipment: "Sarung tangan",
        transporter: "",
        destination: "",
      });
      await assert.rejects(
        () => command(ids.coord, { op: "event.publish", id: e.id, version: 1 }),
        /Konfirmasi pengangkut/,
      );
      await command(ids.coord, {
        op: "event.transport",
        id: e.id,
        version: 1,
        transporter: "Pengangkut simulasi",
        pickup_at: "2029-01-01T04:00:00Z",
        destination: "TPS simulasi",
        transport_confirmed: true,
      });
      await command(ids.coord, { op: "event.publish", id: e.id, version: 2 });
      await command(ids.reporter, { op: "event.join", id: e.id });
      await command(ids.reporter, { op: "event.join", id: e.id });
      await assert.rejects(
        () => command(ids.other, { op: "event.join", id: e.id }),
        /penuh/,
      );
      const rows = await db.query(
        "select * from registrations where event_id=$1",
        [e.id],
      );
      assert.equal(rows.rows.length, 1);
      await command(ids.reporter, { op: "event.leave", id: e.id });
      await command(ids.other, { op: "event.join", id: e.id });
    },
  );
  await t.test(
    "prevention creation/evaluation enforces regional access and optimistic versions",
    async () => {
      const p = await command(ids.coord, {
        op: "prevention.create",
        point_id: pointId,
        hypothesis: "Dugaan perlu konfirmasi",
        basis: "Dua kejadian berbeda",
        action: "Tinjau jadwal pengangkutan",
        pic: "Koordinator simulasi",
        evaluate_on: jakartaDate(),
      });
      await assert.rejects(
        () =>
          command(ids.coordB, {
            op: "prevention.evaluate",
            id: p.id,
            version: 1,
            result: "Coba akses wilayah lain",
          }),
        /akses koordinator/,
      );
      await command(ids.coord, {
        op: "prevention.evaluate",
        id: p.id,
        version: 1,
        result: "Evaluasi tercatat tanpa klaim dampak",
      });
      await assert.rejects(
        () =>
          command(ids.coord, {
            op: "prevention.evaluate",
            id: p.id,
            version: 1,
            result: "Coba perubahan basi",
          }),
        /sudah berubah/,
      );
    },
  );
  await t.test(
    "event completion records photos and transport but does not close related incident",
    async () => {
      const e = randomUUID();
      const open = await db.query<{ id: string }>(
        "select id from incidents where point_id=$1 and status<>'closed'",
        [pointId],
      );
      await db.query(
        `insert into events(id,region_id,incident_id,title,location,starts_at,capacity,pic,duties,equipment,transporter,pickup_at,destination,transport_confirmed,status) values($1,$2,$3,'Kegiatan simulasi','Patokan simulasi',now()-interval '1 day',1,'PIC simulasi','Pengumpulan','Sarung tangan','Pengangkut',now()-interval '1 day','TPS simulasi',true,'published')`,
        [e, ids.a, open.rows[0].id],
      );
      await command(ids.coord, {
        op: "event.complete",
        id: e,
        version: 1,
        performed_at: new Date().toISOString(),
        completion_note: "Pengumpulan sampah simulasi selesai",
        transport_status: "Tertunda — perlu tindak lanjut",
        photos: [await photo(ids.coord)],
      });
      const status = await db.query<{ status: string }>(
        "select status from incidents where id=$1",
        [open.rows[0].id],
      );
      assert.equal(status.rows[0].status, "verified");
      const ev = await db.query<{ status: string; transport_status: string }>(
        "select status,transport_status from events where id=$1",
        [e],
      );
      assert.equal(ev.rows[0].status, "completed");
      assert.equal(
        ev.rows[0].transport_status,
        "Tertunda — perlu tindak lanjut",
      );
    },
  );
  await t.test(
    "coordinator receives task changes and reporter receives rejection notifications",
    async () => {
      const r = await report();
      await command(ids.coord, {
        op: "report.reject",
        id: r.id,
        version: 1,
        reason: "Laporan tidak relevan simulasi",
      });
      const notice = (await as(ids.reporter, () =>
        db.query("select id from notifications where entity_id=$1", [r.id]),
      )) as { rows: unknown[] };
      assert.ok(notice.rows.length > 0);
      const workerNotice = (await as(ids.coord, () =>
        db.query("select id from notifications where entity_id=$1", [
          incidentId,
        ]),
      )) as { rows: unknown[] };
      assert.ok(workerNotice.rows.length > 0);
    },
  );
  await t.test(
    "anonymous storage writes and unsafe internal RPC calls are denied",
    async () => {
      await assert.rejects(
        () =>
          as(ids.reporter, () =>
            db.exec(
              "insert into storage.objects(bucket_id,name) values('evidence','fake.jpg')",
            ),
          ),
        /row-level security/,
      );
      await assert.rejects(
        () =>
          as(ids.reporter, () =>
            db.query("select public.audit($1,'incident',$2,'Fake','Fake')", [
              ids.a,
              incidentId,
            ]),
          ),
        /permission denied/,
      );
    },
  );
  await t.test(
    "public projection hides identities and precise points; moderation keeps operational history",
    async () => {
      await command(ids.admin, {
        op: "admin.moderate",
        id: incidentId,
        entity_type: "incident",
        hidden: true,
        reason: "Konten simulasi disembunyikan",
      });
      const result = (await as(null, () =>
        db.query<{ data: Record<string, unknown> }>(
          "select public_region_data($1) data",
          [ids.a],
        ),
      )) as { rows: { data: Record<string, unknown> }[] };
      const json = JSON.stringify(result.rows[0].data);
      assert.ok(!json.includes(ids.reporter));
      assert.ok(!json.includes(ids.worker));
      assert.ok(!json.includes("reporter_id"));
      const histories = await db.query(
        "select * from history where entity_id=$1",
        [incidentId],
      );
      assert.ok(histories.rows.length > 5);
    },
  );
  await db.close();
});
