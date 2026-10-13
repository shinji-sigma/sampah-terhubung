// Verifies the current 004 demo release; never applies a migration or deploys.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { env, accounts, regionIds } from "./env";

const origin = "https://sampah-terhubung-langgamramadhan9-3266.vercel.app";
const marker = "Uji Langgam 13 Okt 2026 · SIMULASI QA";
const { admin, url, publishable, password } = env();
assert.equal(
  process.env.COMPUTERNAME,
  "LAPTOP-6OQ8DJT5",
  "Primary laptop required",
);
assert.equal(
  url,
  "https://jrozalhfgmzpxvpvzgcf.supabase.co",
  "Simulation target required",
);
const results: { name: string; passed: boolean }[] = [];
const artifacts: Record<string, unknown> = {};
const evidenceDir = "output/qa-report-evidence/20261013";
let phase = "preflight";
async function check(name: string, run: () => Promise<void>) {
  phase = name;
  await run();
  results.push({ name, passed: true });
  console.log("PASS: " + name);
}
async function session(email: string) {
  const cookies = new Map<string, string>();
  const db = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const login = await db.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null, "Existing simulation account login");
  const id = login.data.user!.id;
  async function request(path: string, body?: unknown, requestOrigin = origin) {
    const response = await fetch(origin + path, {
      method: body ? "POST" : "GET",
      headers: {
        Origin: requestOrigin,
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
      signal: AbortSignal.timeout(25000),
    });
    for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(";")[0],
        index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return response;
  }
  assert.equal(
    (await request("/api/auth", { action: "login", email, password })).status,
    200,
  );
  return { db, id, request };
}
type Session = Awaited<ReturnType<typeof session>>;
async function command(
  actor: Session,
  p: Record<string, unknown>,
  key = randomUUID(),
) {
  return actor.request("/api/commands", { p, request_key: key });
}
async function row(table: string, id: string) {
  const result = await admin.from(table).select("*").eq("id", id).single();
  assert.equal(result.error, null, "Expected simulation row");
  return result.data!;
}
async function photo(actor: Session) {
  const file = await readFile(evidenceDir + "/foto-sintetis.jpg");
  const body = new FormData();
  body.append(
    "photos",
    new Blob([file], { type: "image/jpeg" }),
    "foto-sintetis.jpg",
  );
  const response = await actor.request("/api/photos", body);
  assert.equal(response.status, 200, "Real Storage upload");
  const result = await response.json();
  assert.equal(result.ids.length, 1);
  return result.ids[0] as string;
}
async function main() {
  const schema = await admin.from("reports").select("evidence_mode").limit(0);
  assert.equal(
    schema.error?.code,
    "42703",
    "This script expects the active pre-005 release",
  );
  const roles = {
    coordinator: accounts.coordinator,
    worker: accounts.worker,
    coordinatorB: accounts.coordinatorB,
    workerB: accounts.workerB,
    reporter: accounts.reporter,
    reporterB: accounts.reporterB,
  };
  const sessions = Object.fromEntries(
    await Promise.all(
      Object.entries(roles).map(async ([name, email]) => [
        name,
        await session(email),
      ]),
    ),
  ) as Record<keyof typeof roles, Session>;
  const { coordinator, worker, coordinatorB, workerB, reporter, reporterB } =
    sessions;
  await check(
    "Real Cloud Auth and independent HTTPS API sessions",
    async () => {
      for (const actor of Object.values(sessions)) {
        const response = await actor.request(
          "/api/workspace?region=" + regionIds.a,
        );
        assert.equal(response.status, 200);
        assert.equal((await response.json()).profile.id, actor.id);
      }
    },
  );
  await check(
    "Expired/logged-out test session is 401; foreign Origin is 403",
    async () => {
      assert.equal(
        (
          await reporterB.request(
            "/api/auth",
            { action: "logout" },
            "https://example.invalid",
          )
        ).status,
        403,
      );
      assert.equal(
        (await reporterB.request("/api/auth", { action: "logout" })).status,
        200,
      );
      assert.equal(
        (await reporterB.request("/api/workspace?region=" + regionIds.a))
          .status,
        401,
      );
      assert.equal(
        (
          await reporterB.request("/api/commands", {
            p: { op: "task.accept", id: randomUUID(), version: 1 },
            request_key: randomUUID(),
          })
        ).status,
        401,
      );
    },
  );
  phase = "Exactly one fresh Langgam browser report available";
  const reports = await admin
    .from("reports")
    .select("id,reporter_id,status,lat,lng,landmark")
    .eq("landmark", marker);
  assert.equal(reports.error, null);
  if (reports.data?.length !== 1)
    throw new Error("Waiting for exactly one browser report from Langgam");
  const report = reports.data[0];
  const profile = await row("profiles", report.reporter_id);
  assert.equal(profile.display_name, "Langgam");
  artifacts.report_id = report.id;
  assert.equal(
    report.status,
    "pending",
    "Only the newly created QA report may be processed",
  );
  const photos = await admin
    .from("photos")
    .select("id,owner_id,path")
    .eq("report_id", report.id);
  assert.equal(photos.error, null);
  assert.equal(photos.data?.length, 1);
  const reportPhoto = photos.data![0];
  artifacts.report_photo_id = reportPhoto.id;
  await check(
    "Langgam browser report, photo ownership and illustrative pin persisted",
    async () => {
      assert.equal(reportPhoto.owner_id, report.reporter_id);
      assert.ok(Number.isFinite(report.lat) && Number.isFinite(report.lng));
      artifacts.pin = {
        lat: report.lat,
        lng: report.lng,
        kind: "manual illustrative pin, not physical GPS",
      };
      const response = await coordinator.request(
        "/api/photos/" + reportPhoto.id,
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "image/jpeg");
      assert.ok(response.headers.get("cache-control")?.includes("no-store"));
      assert.ok((await response.arrayBuffer()).byteLength > 0);
      const buckets = await admin.storage.listBuckets();
      assert.equal(
        buckets.data?.find((b) => b.name === "evidence")?.public,
        false,
      );
    },
  );
  await check(
    "Pending report RLS and photo API deny other reporter/region/unassigned workers",
    async () => {
      for (const actor of [reporter, coordinatorB, worker, workerB]) {
        const hidden = await actor.db
          .from("reports")
          .select("id")
          .eq("id", report.id);
        assert.equal(hidden.error, null);
        assert.equal(hidden.data?.length, 0);
        assert.equal(
          (await actor.request("/api/photos/" + reportPhoto.id)).status,
          404,
        );
        const download = await actor.db.storage
          .from("evidence")
          .download(reportPhoto.path);
        assert.ok(download.error);
      }
      assert.equal(
        (await fetch(origin + "/api/photos/" + reportPhoto.id)).status,
        401,
      );
      const directWrite = await coordinator.db
        .from("reports")
        .update({ status: "validated" })
        .eq("id", report.id);
      assert.ok(directWrite.error);
    },
  );
  await check(
    "Reporter, worker and other-region coordinator cannot validate through API",
    async () => {
      for (const actor of [reporter, worker, coordinatorB])
        assert.equal(
          (
            await command(actor, {
              op: "report.validate",
              id: report.id,
              version: 1,
              public_label: marker,
            })
          ).status,
          403,
        );
      assert.equal((await row("reports", report.id)).status, "pending");
    },
  );
  await check("Coordinator verifies the Langgam report", async () => {
    assert.equal(
      (
        await command(coordinator, {
          op: "report.validate",
          id: report.id,
          version: 1,
          public_label: marker,
        })
      ).status,
      200,
    );
  });
  const incidentId = (await row("reports", report.id)).incident_id as string;
  artifacts.incident_id = incidentId;
  await check(
    "Wrong-region assignment is denied; correct assignment is replay-safe",
    async () => {
      const incident = await row("incidents", incidentId);
      const p = {
        op: "incident.assign",
        id: incidentId,
        version: incident.version,
        worker_id: worker.id,
        due_at: new Date(Date.now() + 3600000).toISOString(),
        reason: "Penugasan QA sintetis Langgam",
      };
      assert.equal((await command(coordinatorB, p)).status, 403);
      assert.equal(
        (await command(coordinator, { ...p, worker_id: workerB.id })).status,
        403,
      );
      const key = randomUUID();
      assert.equal((await command(coordinator, p, key)).status, 200);
      assert.equal((await command(coordinator, p, key)).status, 200);
      const tasks = await admin
        .from("tasks")
        .select("id")
        .eq("incident_id", incidentId);
      assert.equal(tasks.data?.length, 1);
      artifacts.task_id = tasks.data![0].id;
      assert.equal((await row("incidents", incidentId)).status, "assigned");
    },
  );
  const taskId = artifacts.task_id as string;
  await check(
    "Only assigned worker accepts; concurrent stale acceptance is 409",
    async () => {
      const p = { op: "task.accept", id: taskId, version: 1 };
      assert.equal((await command(workerB, p)).status, 403);
      assert.equal((await command(reporter, p)).status, 403);
      const responses = await Promise.all([
        command(worker, p),
        command(worker, p),
      ]);
      assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
      assert.equal((await row("incidents", incidentId)).status, "working");
    },
  );
  await check(
    "Real worker photo evidence requires destination and remains awaiting review",
    async () => {
      const id = await photo(worker);
      artifacts.worker_photo_id = id;
      const task = await row("tasks", taskId);
      const p = {
        op: "task.evidence",
        id: taskId,
        version: task.version,
        action_taken: "Penanganan sintetis QA, bukan pekerjaan lapangan",
        performed_at: new Date().toISOString(),
        moved: true,
        photos: [id],
      };
      assert.equal((await command(worker, p)).status, 422);
      assert.equal((await row("incidents", incidentId)).status, "working");
      assert.equal(
        (await command(worker, { ...p, destination: "TPS simulasi QA" }))
          .status,
        200,
      );
      assert.equal((await row("photos", id)).task_id, taskId);
      assert.equal(
        (await row("incidents", incidentId)).status,
        "awaiting_review",
      );
    },
  );
  await check(
    "Closure denied to reporter/worker/other region; coordinator closes after review",
    async () => {
      const incident = await row("incidents", incidentId);
      const p = {
        op: "incident.review",
        id: incidentId,
        version: incident.version,
        approved: true,
        reason: "Foto sintetis QA dan tujuan simulasi diperiksa",
      };
      for (const actor of [reporter, worker, coordinatorB])
        assert.equal((await command(actor, p)).status, 403);
      assert.equal((await command(coordinator, p)).status, 200);
      const closed = await row("incidents", incidentId);
      assert.equal(closed.status, "closed");
      assert.equal(closed.reviewer_id, coordinator.id);
      assert.ok(closed.closed_at);
    },
  );
  await check(
    "Report create concurrent retry after simulated lost acknowledgement creates one row",
    async () => {
      const photoId = await photo(reporter);
      artifacts.retry_photo_id = photoId;
      const p = {
        op: "report.create",
        region_id: regionIds.a,
        category: "Penumpukan",
        landmark: marker + " · API retry",
        description: "Uji respons hilang sintetis; bukan laporan lapangan.",
        observed_at: new Date().toISOString(),
        photos: [photoId],
      };
      const key = randomUUID();
      const responses = await Promise.all([
        command(reporter, p, key),
        command(reporter, p, key),
      ]);
      assert.deepEqual(
        responses.map((r) => r.status),
        [200, 200],
      );
      const ids = await Promise.all(responses.map((r) => r.json()));
      assert.equal(ids[0].id, ids[1].id);
      artifacts.retry_report_id = ids[0].id;
      assert.equal((await command(reporter, p, key)).status, 200);
      assert.equal(
        (
          await command(
            reporter,
            { ...p, description: p.description + " changed" },
            key,
          )
        ).status,
        409,
      );
      const rows = await admin
        .from("reports")
        .select("id")
        .eq("landmark", p.landmark)
        .eq("reporter_id", reporter.id);
      assert.equal(rows.data?.length, 1);
      // Keep this isolated test report rejected, with a truthful reason, for review.
      assert.equal(
        (
          await command(coordinator, {
            op: "report.reject",
            id: ids[0].id,
            version: 1,
            reason: "Skenario API retry selesai; foto dan laporan sintetis QA",
          })
        ).status,
        200,
      );
    },
  );
  await check(
    "Inactive region and forged photo ownership rejected through API and direct RPC",
    async () => {
      const p = {
        op: "report.create",
        region_id: regionIds.a,
        category: "Penumpukan",
        landmark: marker + " · forbidden",
        description: "Percobaan negatif yang harus ditolak.",
        observed_at: new Date().toISOString(),
        photos: [reportPhoto.id],
      };
      assert.equal((await command(reporter, p)).status, 403);
      assert.equal(
        (await command(reporter, { ...p, region_id: regionIds.c })).status,
        422,
      );
      const rpc = await reporter.db.rpc("command", {
        p,
        request_key: randomUUID(),
      });
      assert.equal(rpc.error?.code, "42501");
      const rows = await admin
        .from("reports")
        .select("id")
        .eq("landmark", p.landmark);
      assert.equal(rows.data?.length, 0);
    },
  );
  artifacts.workflow =
    "closed; refresh Langgam browser to verify reporter result";
}
try {
  await main();
} catch {
  results.push({ name: phase, passed: false });
  console.error("STOP: " + phase + "; private response/credentials omitted");
  process.exitCode = 1;
} finally {
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(
    evidenceDir + "/active-cloud-api.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        host: process.env.COMPUTERNAME,
        origin,
        project: "jrozalhfgmzpxvpvzgcf",
        schema: "004, 005 absent",
        scope:
          "Real Supabase/Auth/Storage/API, synthetic photos and manual pin; not physical sensors",
        artifacts,
        results,
      },
      null,
      2,
    ),
  );
}
