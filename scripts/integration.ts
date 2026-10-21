import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env, accounts, regionIds } from "./env";
import { jakartaDate, recurrence, scheduleOn } from "../src/lib/rules";
import type {
  Incident,
  Schedule,
  ScheduleException,
  ScheduleRun,
} from "../src/lib/types";
const { admin, url, publishable, password } = env();
const origin = process.env.APP_ORIGIN || "http://localhost:3000";
const results: { name: string; result: string }[] = [];
const keys: string[] = [],
  reportIds: string[] = [],
  incidentIds: string[] = [],
  photoIds: string[] = [],
  eventIds: string[] = [],
  preventionIds: string[] = [],
  pointIds: string[] = [],
  scheduleIds: string[] = [];
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, result: "Lulus" });
    console.log("Lulus: " + name);
  } catch (error) {
    if (error instanceof assert.AssertionError)
      console.error(
        "Assertion gagal: " + error.operator + " (" + error.code + ")",
      );
    else if (
      error instanceof Error &&
      error.message.startsWith("RPC uji gagal")
    )
      console.error(error.message);
    results.push({ name, result: "Gagal" });
    // eslint-disable-next-line preserve-caught-error -- Do not expose response bodies or credential-bearing causes in Cloud diagnostics.
    throw new Error(
      "Pemeriksaan gagal: " +
        name +
        ". Tidak ada token atau secret yang dicetak.",
    );
  }
}
async function login(email: string) {
  const client = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user)
    throw new Error(
      "Auth demo gagal. Periksa akun simulasi yang sudah tersedia dan DEMO_PASSWORD; jangan seed ulang proyek ini.",
    );
  return { db: client, id: data.user.id };
}
async function httpSession(email: string) {
  const cookies = new Map<string, string>();
  async function request(path: string, body?: unknown) {
    const response = await fetch(origin + path, {
      method: body ? "POST" : "GET",
      headers: {
        Origin: origin,
        Cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
        ...(body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0],
        i = pair.indexOf("=");
      cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    return response;
  }
  const response = await request("/api/auth", {
    action: "login",
    email,
    password,
  });
  assert.equal(response.status, 200, "HTTP Auth");
  return request;
}
const jpeg = await sharp({
  create: { width: 100, height: 100, channels: 3, background: "#166534" },
})
  .jpeg()
  .toBuffer();
async function photo(
  request: Awaited<ReturnType<typeof httpSession>>,
  source: "upload" | "camera_web" = "upload",
) {
  const body = new FormData();
  body.append(
    "photos",
    new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }),
    "bukti-simulasi.jpg",
  );
  body.append(
    "metadata",
    JSON.stringify([
      {
        source,
        ...(source === "camera_web"
          ? { captured_at: new Date().toISOString() }
          : {}),
      },
    ]),
  );
  const response = await request("/api/photos", body);
  assert.equal(response.status, 200);
  const { ids } = await response.json();
  photoIds.push(...ids);
  return ids as string[];
}
async function command(
  db: SupabaseClient,
  p: Record<string, unknown>,
  key = randomUUID(),
) {
  keys.push(key);
  const { data, error } = await db.rpc("command", { p, request_key: key });
  if (error) throw new Error("RPC uji gagal (" + error.code + ").");
  return data as { id: string };
}
const { error: migrationError } = await admin
  .from("reports")
  .select(
    "evidence_mode,device_lat,device_lng,device_accuracy_m,device_measured_at,location_confirmed",
  )
  .limit(0);
if (migrationError)
  throw new Error(
    "Migrasi 005 belum tersedia atau akses skema gagal. Integrasi dihentikan sebelum login/unggahan/mutasi; jangan seed ulang. Kode: " +
      migrationError.code,
  );
const [reporter, reporter2, coordinator, worker, coordinatorB] =
  await Promise.all([
    login(accounts.reporter),
    login(accounts.reporter2),
    login(accounts.coordinator),
    login(accounts.worker),
    login(accounts.coordinatorB),
  ]);
const [httpReporter, httpWorker, httpCoordB, httpCoordinator] =
  await Promise.all([
    httpSession(accounts.reporter),
    httpSession(accounts.worker),
    httpSession(accounts.coordinatorB),
    httpSession(accounts.coordinator),
  ]);
const stamp = "Uji integrasi " + new Date().toISOString();
let incidentId = "",
  taskId = "",
  eventId = "",
  pointId = "",
  closedAt = "";
try {
  await check("Auth Cloud + sesi HTTP benar-benar terverifikasi", async () => {
    const {
      data: { user },
      error,
    } = await reporter.db.auth.getUser();
    assert.equal(error, null);
    assert.equal(user?.id, reporter.id);
    const response = await httpReporter("/api/workspace?region=" + regionIds.a);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).profile.id, reporter.id);
  });
  let photos: string[] = [],
    created = { id: "" };
  await check(
    "Unggah foto sungguhan; SVG ditolak dan bucket privat",
    async () => {
      photos = await photo(httpReporter);
      const bad = new FormData();
      bad.append(
        "photos",
        new Blob(["<svg/>"], { type: "image/svg+xml" }),
        "bad.svg",
      );
      assert.equal((await httpReporter("/api/photos", bad)).status, 422);
      const { data: buckets } = await admin.storage.listBuckets();
      assert.equal(buckets?.find((b) => b.name === "evidence")?.public, false);
    },
  );
  await check(
    "Laporan tersimpan; pengiriman ulang menghasilkan ID yang sama",
    async () => {
      const p = {
        op: "report.create",
        evidence_mode: "supporting",
        supporting_reason:
          "Foto sintetis untuk uji integrasi, bukan foto lapangan",
        location_confirmed: true,
        region_id: regionIds.a,
        category: "Penumpukan",
        landmark: stamp,
        description: "Laporan pengujian terisolasi, data simulasi.",
        observed_at: new Date(Date.now() - 60000).toISOString(),
        photos,
      };
      const key = randomUUID();
      created = await command(reporter.db, p, key);
      reportIds.push(created.id);
      assert.equal((await command(reporter.db, p, key)).id, created.id);
      const { data } = await reporter.db
        .from("reports")
        .select("id,status")
        .eq("id", created.id)
        .single();
      assert.equal(data?.status, "pending");
    },
  );
  await check(
    "RLS lintas wilayah, petugas belum ditugaskan, dan akses foto ditebak ditolak",
    async () => {
      for (const db of [coordinatorB.db, worker.db, reporter2.db]) {
        const { data, error } = await db
          .from("reports")
          .select("id")
          .eq("id", created.id);
        assert.equal(error, null);
        assert.equal(data?.length, 0);
        const hidden = await db.from("photos").select("id").in("id", photos);
        assert.equal(hidden.data?.length, 0);
      }
      assert.equal((await httpCoordB("/api/photos/" + photos[0])).status, 404);
      const { data: paths } = await admin
        .from("photos")
        .select("path")
        .eq("id", photos[0])
        .single();
      const denied = await coordinatorB.db.storage
        .from("evidence")
        .download(paths!.path);
      assert.ok(denied.error);
      const direct = await reporter.db
        .from("reports")
        .update({ status: "validated" })
        .eq("id", created.id);
      assert.ok(direct.error);
    },
  );
  await check(
    "Validasi + dua laporan pendukung untuk satu insiden",
    async () => {
      await command(coordinator.db, {
        op: "report.validate",
        id: created.id,
        version: 1,
        public_label: stamp,
      });
      const { data } = await reporter.db
        .from("reports")
        .select("incident_id")
        .eq("id", created.id)
        .single();
      incidentId = data!.incident_id;
      incidentIds.push(incidentId);
      const i = await admin
        .from("incidents")
        .select("point_id")
        .eq("id", incidentId)
        .single();
      pointId = i.data!.point_id;
      pointIds.push(pointId);
      const second = await command(reporter.db, {
        op: "report.create",
        evidence_mode: "supporting",
        supporting_reason:
          "Foto sintetis untuk uji integrasi, bukan foto lapangan",
        location_confirmed: true,
        region_id: regionIds.a,
        category: "Penumpukan",
        landmark: stamp,
        description: "Laporan pendukung untuk kejadian yang sama.",
        observed_at: new Date(Date.now() - 60000).toISOString(),
        photos: await photo(httpReporter),
      });
      reportIds.push(second.id);
      await command(coordinator.db, {
        op: "report.validate",
        id: second.id,
        version: 1,
        incident_id: incidentId,
      });
      const reports = await admin
        .from("reports")
        .select("id")
        .eq("incident_id", incidentId);
      assert.equal(reports.data?.length, 2);
    },
  );
  await check(
    "Penugasan belum bekerja; penolakan dan penugasan ulang mempertahankan riwayat",
    async () => {
      await command(coordinator.db, {
        op: "incident.assign",
        id: incidentId,
        version: 1,
        worker_id: worker.id,
        due_at: new Date().toISOString(),
        reason: stamp,
      });
      let t = await admin
        .from("tasks")
        .select("id")
        .eq("incident_id", incidentId)
        .eq("status", "offered")
        .single();
      await command(worker.db, {
        op: "task.reject",
        id: t.data!.id,
        version: 1,
        reason: "Kapasitas simulasi tidak tersedia",
      });
      await command(coordinator.db, {
        op: "incident.assign",
        id: incidentId,
        version: 3,
        worker_id: worker.id,
        due_at: new Date().toISOString(),
        reason: "Penugasan ulang simulasi",
      });
      t = await admin
        .from("tasks")
        .select("id")
        .eq("incident_id", incidentId)
        .eq("status", "offered")
        .single();
      taskId = t.data!.id;
      const status = await admin
        .from("incidents")
        .select("status")
        .eq("id", incidentId)
        .single();
      assert.equal(status.data?.status, "assigned");
    },
  );
  await check(
    "Konkurensi penerimaan tugas: tepat satu transisi diterima",
    async () => {
      const attempts = await Promise.all(
        [1, 2].map(() => {
          const request_key = randomUUID();
          keys.push(request_key);
          return worker.db
            .rpc("command", {
              p: { op: "task.accept", id: taskId, version: 1 },
              request_key,
            })
            .abortSignal(AbortSignal.timeout(20000));
        }),
      );
      console.log(
        "Hasil konkurensi (kode saja): " +
          JSON.stringify(
            attempts.map((attempt) => ({
              error: !!attempt.error,
              code: attempt.error?.code || null,
              status: attempt.status,
              dataPresent: !!attempt.data,
            })),
          ),
      );
      assert.equal(attempts.filter((a) => !a.error).length, 1);
      assert.equal(
        attempts.filter((a) => a.error?.code === "PT409" && a.status === 409)
          .length,
        1,
      );
      await command(worker.db, {
        op: "task.block",
        id: taskId,
        version: 2,
        reason: "Kendala akses, data simulasi",
      });
    },
  );
  await check(
    "Bukti + pemeriksaan koordinator menutup insiden; pelapor tidak dapat menutup",
    async () => {
      await command(worker.db, {
        op: "task.evidence",
        id: taskId,
        version: 3,
        action_taken: "Pengangkutan selesai simulasi",
        performed_at: new Date().toISOString(),
        moved: true,
        destination: "TPS simulasi",
        photos: await photo(httpWorker),
      });
      const invalid = await reporter.db.rpc("command", {
        p: {
          op: "incident.review",
          id: incidentId,
          version: 6,
          approved: true,
          reason: "Pelapor tidak berwenang",
        },
        request_key: randomUUID(),
      });
      assert.equal(invalid.error?.code, "42501");
      await command(coordinator.db, {
        op: "incident.review",
        id: incidentId,
        version: 6,
        approved: true,
        reason: "Bukti sungguhan uji diperiksa",
      });
      const inc = await admin
        .from("incidents")
        .select("status,reviewer_id,closed_at")
        .eq("id", incidentId)
        .single();
      assert.equal(inc.data?.status, "closed");
      assert.equal(inc.data?.reviewer_id, coordinator.id);
      assert.ok(inc.data?.closed_at);
      closedAt = inc.data!.closed_at;
    },
  );
  await check(
    "Kejadian baru setelah penutupan terpisah dari laporan duplikat",
    async () => {
      // Simulated observation follows the server's closure even with small clock skew.
      const observed = new Date(
        Math.max(Date.now(), Date.parse(closedAt) + 1),
      ).toISOString();
      const later = await command(reporter.db, {
        op: "report.create",
        evidence_mode: "supporting",
        supporting_reason:
          "Foto sintetis untuk uji integrasi, bukan foto lapangan",
        location_confirmed: true,
        region_id: regionIds.a,
        category: "Penumpukan",
        landmark: stamp,
        description: "Kejadian baru setelah penutupan, data simulasi.",
        observed_at: observed,
        photos: await photo(httpReporter),
      });
      reportIds.push(later.id);
      await command(coordinator.db, {
        op: "report.validate",
        id: later.id,
        version: 1,
        point_id: pointId,
        public_label: stamp,
      });
      const row = await admin
        .from("reports")
        .select("incident_id")
        .eq("id", later.id)
        .single();
      assert.equal(row.error, null);
      assert.notEqual(row.data!.incident_id, incidentId);
      incidentIds.push(row.data!.incident_id);
      const incidents = await coordinator.db
        .from("incidents")
        .select("*")
        .eq("point_id", pointId);
      assert.equal(incidents.error, null);
      const serverNow = new Date(
        Math.max(
          Date.now(),
          ...incidents.data!.map((i) => Date.parse(i.verified_at)),
        ),
      );
      assert.equal(
        recurrence(incidents.data as Incident[], serverNow).get(pointId)
          ?.length,
        2,
      );
    },
  );
  await check(
    "Jadwal Cloud: perubahan hanya satu tanggal dan aktual tidak ganda",
    async () => {
      const date = jakartaDate();
      const day = new Date(date + "T12:00:00+07:00").getUTCDay();
      const next = jakartaDate(new Date(Date.now() + 7 * 86400000));
      const s = await command(coordinator.db, {
        op: "schedule.save",
        region_id: regionIds.a,
        service: "Layanan uji simulasi",
        zone: stamp,
        weekdays: [day],
        start_time: "08:00",
        end_time: "10:00",
        valid_from: date,
        valid_until: next,
        source: "Konfirmasi pengelola uji simulasi",
        confirmed: true,
        worker_id: worker.id,
      });
      scheduleIds.push(s.id);
      const denied = await coordinatorB.db.rpc("command", {
        p: {
          op: "schedule.exception",
          id: s.id,
          date,
          cancelled: true,
          reason: "Coba lintas wilayah",
        },
        request_key: randomUUID(),
      });
      assert.equal(denied.error?.code, "42501");
      await command(coordinator.db, {
        op: "schedule.exception",
        id: s.id,
        date,
        cancelled: false,
        start_time: "10:00",
        end_time: "12:00",
        reason: "Perubahan satu tanggal uji",
      });
      const payload = {
        op: "schedule.run",
        id: s.id,
        date,
        actual_at: new Date().toISOString(),
        reason: "Pelaksanaan aktual uji",
      };
      await command(worker.db, payload);
      const duplicate = await worker.db.rpc("command", {
        p: payload,
        request_key: randomUUID(),
      });
      assert.equal(duplicate.error?.code, "23505");
      const [rules, exceptions, runs] = await Promise.all([
        coordinator.db.from("schedules").select("*").eq("id", s.id),
        coordinator.db
          .from("schedule_exceptions")
          .select("*")
          .eq("schedule_id", s.id),
        coordinator.db
          .from("schedule_runs")
          .select("*")
          .eq("schedule_id", s.id),
      ]);
      assert.equal(rules.error, null);
      assert.equal(exceptions.error, null);
      assert.equal(runs.error, null);
      const current = scheduleOn(
        rules.data![0] as Schedule,
        date,
        exceptions.data as ScheduleException[],
        runs.data as ScheduleRun[],
      );
      const following = scheduleOn(
        rules.data![0] as Schedule,
        next,
        exceptions.data as ScheduleException[],
        runs.data as ScheduleRun[],
      );
      assert.equal(current?.start, "10:00:00");
      assert.ok(current?.run);
      assert.equal(following?.start, "08:00:00");
      assert.equal(following?.exception, undefined);
    },
  );
  await check(
    "P1 pencegahan + draf kegiatan memerlukan konfirmasi pengangkutan",
    async () => {
      const p = await command(coordinator.db, {
        op: "prevention.create",
        point_id: pointId,
        hypothesis: "Dugaan simulasi perlu konfirmasi",
        basis: "Riwayat insiden uji",
        action: "Tinjau waktu pengangkutan",
        pic: "Koordinator simulasi",
        evaluate_on: new Date().toISOString().slice(0, 10),
      });
      preventionIds.push(p.id);
      await command(coordinator.db, {
        op: "prevention.evaluate",
        id: p.id,
        version: 1,
        result: "Evaluasi simulasi tercatat",
      });
      const e = await command(coordinator.db, {
        op: "event.create",
        region_id: regionIds.a,
        point_id: pointId,
        title: stamp,
        location: "Lokasi pengujian simulasi",
        starts_at: new Date(Date.now() + 86400000).toISOString(),
        capacity: 1,
        pic: "Koordinator simulasi",
        duties: "Dokumentasi dan pengumpulan",
        equipment: "Sarung tangan",
        transporter: "",
        destination: "",
      });
      eventId = e.id;
      eventIds.push(eventId);
      const rejected = await coordinator.db.rpc("command", {
        p: { op: "event.publish", id: eventId, version: 1 },
        request_key: randomUUID(),
      });
      assert.ok(rejected.error);
      await command(coordinator.db, {
        op: "event.transport",
        id: eventId,
        version: 1,
        transporter: "Petugas simulasi",
        pickup_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        destination: "TPS simulasi",
        transport_confirmed: true,
      });
      await command(coordinator.db, {
        op: "event.publish",
        id: eventId,
        version: 2,
      });
    },
  );
  await check(
    "Pendaftaran kursi terakhir bersamaan tidak melebihi kapasitas; tidak ganda",
    async () => {
      const attempts = await Promise.all(
        [reporter.db, reporter2.db].map((db) => {
          const request_key = randomUUID();
          keys.push(request_key);
          return db.rpc("command", {
            p: { op: "event.join", id: eventId },
            request_key,
          });
        }),
      );
      assert.equal(attempts.filter((a) => !a.error).length, 1);
      const members = await admin
        .from("registrations")
        .select("user_id")
        .eq("event_id", eventId);
      assert.equal(members.data?.length, 1);
      const winner =
        members.data![0].user_id === reporter.id ? reporter.db : reporter2.db;
      await command(winner, { op: "event.join", id: eventId });
      const after = await admin
        .from("registrations")
        .select("user_id")
        .eq("event_id", eventId);
      assert.equal(after.data?.length, 1);
    },
  );
  await check(
    "CSV membatasi wilayah dan foto publik tidak dapat dibaca",
    async () => {
      assert.equal(
        (
          await httpCoordB(
            "/api/export?region=" +
              regionIds.a +
              "&from=2020-01-01&until=2030-01-01",
          )
        ).status,
        403,
      );
      const publicResponse = await fetch(origin + "/api/photos/" + photoIds[0]);
      assert.equal(publicResponse.status, 401);
      const publicDb = createClient(url, publishable, {
        auth: { persistSession: false },
      });
      const { data } = await publicDb.rpc("public_region_data", {
        r: regionIds.a,
      });
      assert.ok(!JSON.stringify(data).includes(reporter.id));
    },
  );
  await check(
    "Alur HTTP tiga sesi: laporan + foto, penugasan, bukti, konflik 409, pembaruan dan logout",
    async () => {
      async function send(
        request: typeof httpReporter,
        p: Record<string, unknown>,
      ) {
        const request_key = randomUUID();
        keys.push(request_key);
        const response = await request("/api/commands", { p, request_key });
        assert.equal(response.status, 200);
        assert.match(response.headers.get("cache-control") || "", /no-store/);
        return response.json();
      }
      async function workspace(request: typeof httpReporter) {
        const response = await request("/api/workspace?region=" + regionIds.a);
        assert.equal(response.status, 200);
        return response.json();
      }
      const report = await send(httpReporter, {
        op: "report.create",
        evidence_mode: "direct",
        device_lat: -7.3,
        device_lng: 112.7,
        device_accuracy_m: 2500,
        device_measured_at: new Date().toISOString(),
        lat: -7.31,
        lng: 112.71,
        location_confirmed: true,
        region_id: regionIds.a,
        category: "Penumpukan",
        landmark: stamp,
        description: "Alur HTTP nyata dengan data simulasi.",
        observed_at: new Date(Date.now() - 60000).toISOString(),
        photos: await photo(httpReporter, "camera_web"),
      });
      reportIds.push(report.id);
      const evidence = (await workspace(httpCoordinator)).reports.find(
        (r: { id: string }) => r.id === report.id,
      );
      assert.equal(evidence.evidence_mode, "direct");
      assert.equal(evidence.device_lat, -7.3);
      assert.equal(evidence.lat, -7.31);
      assert.ok(
        (await workspace(httpCoordinator)).reports.some(
          (r: { id: string }) => r.id === report.id,
        ),
      );
      await send(httpCoordinator, {
        op: "report.validate",
        id: report.id,
        version: 1,
        public_label: stamp,
      });
      let data = await workspace(httpCoordinator);
      const incident = data.incidents.find(
        (i: { id: string }) =>
          i.id ===
          data.reports.find((r: { id: string }) => r.id === report.id)
            .incident_id,
      );
      incidentIds.push(incident.id);
      pointIds.push(incident.point_id);
      await send(httpCoordinator, {
        op: "incident.assign",
        id: incident.id,
        version: incident.version,
        worker_id: worker.id,
        due_at: new Date().toISOString(),
        reason: stamp,
      });
      const task = (await workspace(httpWorker)).tasks.find(
        (t: { incident_id: string }) => t.incident_id === incident.id,
      );
      await send(httpWorker, {
        op: "task.accept",
        id: task.id,
        version: task.version,
      });
      const staleKey = randomUUID();
      keys.push(staleKey);
      const conflict = await httpWorker("/api/commands", {
        p: { op: "task.accept", id: task.id, version: task.version },
        request_key: staleKey,
      });
      assert.equal(conflict.status, 409);
      assert.match((await conflict.json()).error, /sudah berubah/);
      await send(httpWorker, {
        op: "task.evidence",
        id: task.id,
        version: task.version + 1,
        action_taken: "Pengangkutan simulasi selesai",
        performed_at: new Date().toISOString(),
        moved: true,
        destination: "TPS simulasi",
        photos: await photo(httpWorker),
      });
      data = await workspace(httpCoordinator);
      const awaiting = data.incidents.find(
        (i: { id: string }) => i.id === incident.id,
      );
      await send(httpCoordinator, {
        op: "incident.review",
        id: incident.id,
        version: awaiting.version,
        approved: true,
        reason: "Bukti HTTP simulasi diperiksa",
      });
      assert.equal(
        (await workspace(httpReporter)).incidents.find(
          (i: { id: string }) => i.id === incident.id,
        ).status,
        "closed",
      );
      assert.equal(
        (await httpReporter("/api/photos/" + photoIds.at(-1))).status,
        200,
      );
      assert.equal(
        (await httpWorker("/api/auth", { action: "logout" })).status,
        200,
      );
      assert.equal(
        (await httpWorker("/api/workspace?region=" + regionIds.a)).status,
        401,
      );
    },
  );
  console.log("Pemeriksaan Cloud lulus. Memeriksa pembersihan artefak uji.");
} finally {
  // Delete only IDs produced by this test, never reset the project's existing data.
  const cleanupFailures: string[] = [];
  async function clean(label: string, query: PromiseLike<{ error: unknown }>) {
    try {
      if ((await query).error) cleanupFailures.push(label);
    } catch {
      cleanupFailures.push(label);
    }
  }
  async function remove(table: string, column: string, ids: string[]) {
    if (ids.length)
      await clean(table, admin.from(table).delete().in(column, ids));
  }
  const scoped = [
    ...reportIds,
    ...incidentIds,
    ...eventIds,
    ...preventionIds,
    ...scheduleIds,
  ];
  if (photoIds.length) {
    const { data: paths, error } = await admin
      .from("photos")
      .select("path")
      .in("id", photoIds);
    if (error) cleanupFailures.push("Daftar path foto");
    if (paths?.length)
      await clean(
        "Objek evidence",
        admin.storage.from("evidence").remove(paths.map((p) => p.path)),
      );
    await remove("photos", "id", photoIds);
  }
  if (keys.length) await remove("command_receipts", "key", keys);
  if (scoped.length) {
    await remove("notifications", "entity_id", scoped);
    await remove("history", "entity_id", scoped);
  }
  if (eventIds.length) {
    await remove("registrations", "event_id", eventIds);
    await remove("events", "id", eventIds);
  }
  if (preventionIds.length) await remove("preventions", "id", preventionIds);
  if (reportIds.length) {
    await remove("feedback", "report_id", reportIds);
    await remove("reports", "id", reportIds);
  }
  if (incidentIds.length) {
    await remove("tasks", "incident_id", incidentIds);
    await remove("incidents", "id", incidentIds);
  }
  if (scheduleIds.length) {
    await remove("schedule_runs", "schedule_id", scheduleIds);
    await remove("schedule_exceptions", "schedule_id", scheduleIds);
    await remove("schedules", "id", scheduleIds);
  }
  await remove("points", "id", pointIds);
  await mkdir("output/private", { recursive: true });
  await writeFile(
    "output/private/cloud-integration.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        backend: "Supabase Cloud",
        results,
        cleanupFailures,
        createdIds: {
          reportIds,
          incidentIds,
          photoIds,
          eventIds,
          preventionIds,
          pointIds,
          scheduleIds,
        },
      },
      null,
      2,
    ),
  );
  if (cleanupFailures.length) {
    process.exitCode = 1;
    console.error(
      "Pembersihan uji belum selesai. Periksa output/private/cloud-integration.json secara privat sebelum mengulang.",
    );
  }
}
