import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";

const require = createRequire(import.meta.url);
const id = "11111111-1111-4111-8111-111111111111";
const code = "P-A1B2C3D4";
const tasks = { schedule: "success", report: "failed", status: "not_tried" };
const base = { submissionId: id, participantCode: code, consent: true, eligible18: true, consentVersion: "sus-consent-1.1", device: "phone", tasks, answers: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1], honey: "" };
const calls: unknown[] = [];
function route(rpc = async (_name: string, args: unknown) => { calls.push(args); return { data: "created", error: null }; }) {
  const path = "src/app/api/evaluasi/route.ts";
  const source = readFileSync(path, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const localRequire = (name: string): unknown => {
    if (name === "@/lib/supabase") return { configured: () => true, userClient: async () => ({ rpc }) };
    if (name === "@/lib/http") return { checkOrigin: (req: Request) => { if (req.headers.get("origin") !== "https://example.test") throw Object.assign(new Error("origin"), { status: 403 }); }, privateHeaders: { "Cache-Control": "private, no-store" } };
    if (name === "next/server") return { NextResponse: { json: (body: unknown, opts?: ResponseInit) => Response.json(body, opts) } };
    return require(name);
  };
  new Function("require", "module", "exports", code)(localRequire, module, module.exports);
  return module.exports as { POST: (request: Request) => Promise<Response>; GET?: (request: Request) => Promise<Response> };
}
function request(body: unknown, origin = "https://example.test") {
  return new Request("https://example.test/api/evaluasi", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
}
test("valid anonymous submission computes SUS on server and only returns acknowledgement", async () => {
  calls.length = 0;
  const result = await route().POST(request(base));
  assert.equal(result.status, 201);
  assert.deepEqual(await result.json(), { status: "created" });
  assert.match(result.headers.get("cache-control")!, /no-store/);
  assert.equal(calls.length, 1);
  const args = calls[0] as Record<string, unknown>;
  assert.equal(args.p_score, 100);
  assert.deepEqual(args.p_answers, base.answers);
  assert.equal(args.p_participant_code, code);
  assert.equal(args.p_submission_id, id);
  assert.ok(!JSON.stringify(args).includes("email"));
});
test("accepts the study form contract and preserves all three task outcomes", async () => {
  calls.length = 0;
  const form = base;
  assert.equal((await route().POST(request({ ...form, participantCode: "P-A1B2C3D4", device: "phone", tasks, honey: "" }))).status, 201);
  assert.deepEqual((calls[0] as Record<string, unknown>).p_tasks, tasks);
});
test("mixed odd/even answers score 50 without counting task outcome", async () => {
  calls.length = 0;
  const result = await route().POST(request({ ...base, answers: Array(10).fill(3), tasks: { ...tasks, report: "failed" } }));
  assert.equal(result.status, 201);
  assert.equal((calls[0] as Record<string, unknown>).p_score, 50);
});
test("invalid answers, missing consent, invalid outcomes, PII fields, and honeypot never reach storage", async () => {
  calls.length = 0;
  for (const payload of [
    { ...base, answers: Array(9).fill(3) },
    { ...base, answers: [...Array(9).fill(3), 0] },
    { ...base, answers: [...Array(9).fill(3), 6] },
    { ...base, answers: [...Array(9).fill(3), 2.5] },
    { ...base, consent: false },
    { ...base, eligible18: false },
    { ...base, eligible18: undefined },
    { ...base, consentVersion: "sus-consent-1.0" },
    { ...base, participantCode: "private-name" },
    { ...base, participantCode: "22222222-2222-4222-8222-222222222222" },
    { ...base, tasks: { schedule: "success", report: "failed" } },
    { ...base, tasks: { ...tasks, status: null } },
    { ...base, tasks: { ...tasks, extra: "success" } },
    { ...base, tasks: { ...tasks, report: "unknown" } },
    { ...base, device: "Pixel 9 user-agent" },
    { ...base, email: "private@example.test" },
    { ...base, honey: "spam" },
    { ...base, comment: "Contact me at private@example.test" },
  ]) {
    const result = await route().POST(request(payload));
    assert.equal(result.status, 422, JSON.stringify(payload));
  }
  assert.equal(calls.length, 0);
});
test("origin, payload size, content type, and public GET are restricted", async () => {
  assert.equal((await route().POST(request(base, "https://attacker.test"))).status, 403);
  assert.equal((await route().POST(request({ ...base, dummy: "a".repeat(6000) }))).status, 413);
  assert.equal((await route().POST(new Request("https://example.test/api/evaluasi", { method: "POST", headers: { origin: "https://example.test", "content-type": "text/plain" }, body: "{}" }))).status, 415);
  assert.equal(route().GET, undefined);
});
test("database idempotency and one response per participant code; no anonymous read", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon,authenticated,service_role");
    await db.exec(readFileSync("supabase/migrations/202610210006_study_responses.sql", "utf8"));
    const args = [id, code, "phone", JSON.stringify(tasks), base.answers, 100, ""];
    const query = "select public.submit_study_response($1::uuid,$2::text,$3::text,$4::jsonb,$5::integer[],$6::numeric,$7::text) as result";
    const first = await db.query<{ result: string }>(query, args);
    assert.equal(first.rows[0].result, "created");
    const again = await db.query<{ result: string }>(query, args);
    assert.equal(again.rows[0].result, "duplicate");
    const different = await db.query<{ result: string }>(query, [id, code, "desktop", JSON.stringify(tasks), base.answers, 100, ""]);
    assert.equal(different.rows[0].result, "conflict");
    const otherId = await db.query<{ result: string }>(query, ["33333333-3333-4333-8333-333333333333", code, "phone", JSON.stringify(tasks), base.answers, 100, ""]);
    assert.equal(otherId.rows[0].result, "conflict");
    const rows = await db.query<{ score: number; tasks: unknown; participant_code: string }>("select score,tasks,participant_code from study_responses");
    assert.equal(rows.rows.length, 1);
    assert.equal(Number(rows.rows[0].score), 100);
    assert.deepEqual(rows.rows[0].tasks, tasks);
    assert.equal(rows.rows[0].participant_code, code);
    for (const badTasks of [{ ...tasks, status: null }, { schedule: "success" }, { ...tasks, report: "unknown" }, { ...tasks, extra: "success" }]) {
      await assert.rejects(db.query(query, [id, code, "phone", JSON.stringify(badTasks), base.answers, 100, ""]), /invalid study response/);
    }
    await db.exec("set role anon");
    assert.equal((await db.query<{ result: string }>(query, args)).rows[0].result, "duplicate");
    for (const statement of ["select * from study_responses", "delete from study_responses", "update study_responses set score=0"]) {
      await assert.rejects(db.exec(statement), /permission denied/);
    }
    await db.exec("reset role");
    await assert.rejects(db.query(query, [id, code, "phone", JSON.stringify(tasks), Array(10).fill(3), 100, ""]), /invalid study score/);
    // Global cross-instance quota, not an IP/account fingerprint.
    await db.exec(`insert into study_responses(submission_id,participant_code,device,tasks,answers,score) select gen_random_uuid(),'P-' || upper(substr(md5(random()::text),1,8)),'phone','{"schedule":"success","report":"failed","status":"not_tried"}'::jsonb,array[3,3,3,3,3,3,3,3,3,3]::smallint[],50 from generate_series(1,60)`);
    assert.equal((await db.query<{ result: string }>(query, ["44444444-4444-4444-8444-444444444444", "P-55555555", "phone", JSON.stringify(tasks), base.answers, 100, ""])).rows[0].result, "rate_limited");
  } finally { await db.close(); }
});
