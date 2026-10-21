// Read-only Cloud verification of the photo association; never migrates/deploys.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { env, accounts, regionIds } from "./env";
import { withPhotoContext } from "../src/lib/photo-context";
import type { Photo } from "../src/lib/types";

const { admin, url, publishable, password } = env();
assert.equal(process.env.COMPUTERNAME, "LAPTOP-6OQ8DJT5");
assert.equal(url, "https://jrozalhfgmzpxvpvzgcf.supabase.co");
const checks: string[] = [];
try {
  const db = createClient(url, publishable, {
    auth: { persistSession: false },
  });
  assert.equal(
    (await db.auth.signInWithPassword({ email: accounts.reporter, password }))
      .error,
    null,
  );
  const [photos, incidents, tasks] = await Promise.all([
    db
      .from("photos")
      .select("id,owner_id,report_id,task_id,event_id,created_at"),
    db.from("incidents").select("id").eq("region_id", regionIds.a),
    db.from("tasks").select("id"),
  ]);
  for (const result of [photos, incidents, tasks])
    assert.equal(result.error, null);
  const ids = [
    ...new Set(photos.data!.flatMap((p) => (p.task_id ? [p.task_id] : []))),
  ];
  assert.ok(ids.length > 0, "Existing reporter has permitted worker evidence");
  assert.equal(tasks.data!.length, 0, "Reporter task details remain private");
  checks.push(
    "Real reporter RLS grants worker photos while withholding private task rows",
  );
  const context = await admin
    .from("tasks")
    .select("id,incident_id")
    .in("id", ids)
    .limit(1000);
  assert.equal(context.error, null);
  const linked = withPhotoContext(
    photos.data as Photo[],
    incidents.data!,
    context.data!,
  );
  assert.equal(
    linked.filter((p) => p.task_id && p.incident_id).length,
    ids.length,
  );
  assert.deepEqual(
    linked.map((p) => p.id),
    photos.data!.map((p) => p.id),
  );
  assert.ok(
    linked.every(
      (p) =>
        !p.incident_id || incidents.data!.some((i) => i.id === p.incident_id),
    ),
  );
  assert.ok(linked.every((p) => !("worker_id" in p) && !("reason" in p)));
  checks.push(
    "New association maps only RLS-visible photos to current-region visible incidents; no private task fields",
  );
  const scope =
    "Real read-only Supabase queries and new helper; not full new workspace HTTP route (005 absent)";
  await writeFile(
    "output/qa-report-evidence/20261013/photo-context.cloud.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        host: process.env.COMPUTERNAME,
        project: "jrozalhfgmzpxvpvzgcf",
        mutations: 0,
        scope,
        checks,
      },
      null,
      2,
    ),
  );
  checks.forEach((name) => console.log("PASS: " + name));
} catch {
  console.error("STOP: photo-context verification; private response omitted");
  process.exitCode = 1;
}
