import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import ts from "typescript";

const require = createRequire(import.meta.url);
const regionId = "11111111-1111-4111-8111-111111111111";

test("demo contracts declare source, counts and filter without returning unrelated fixtures", async () => {
  for (const name of names) {
    const mod = route(name);
    const res = await mod.GET(new Request(`http://local/api/v1/${name}`));
    const body = await res.json();
    assert.equal(body.source, "mock_interop");
    assert.equal(body.total, body.data.length);
    assert.equal(body.region, "all");
    assert.ok(body.timestamp);
    const filtered = await (await mod.GET(new Request(`http://local/api/v1/${name}?region=${regionId}`))).json();
    assert.deepEqual(filtered.data, []);
    const preflight = await mod.OPTIONS();
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), "*");
  }
});

test("all-region requests enumerate public regions instead of passing null to a region-only SQL projection", async () => {
  for (const name of names) {
    const calls: unknown[] = [];
    const mod = route(name, true, async (_fn, args) => {
      const r = (args as { r: string | null }).r;
      calls.push(r);
      return { data: { regions: [{ id: regionId }], [name]: r ? [{ id: "public-item", weekdays: [1], starts_at: "2026-10-25T00:30:00Z", status: "published" }] : [] }, error: null };
    });
    const res = await mod.GET(new Request(`http://local/api/v1/${name}`));
    const body = await res.json();
    assert.equal(body.total, 1, name);
    assert.equal(body.source, "database");
    assert.deepEqual(calls, [null, regionId]);
    assert.match(res.headers.get("Cache-Control")!, /no-store/);
  }
});

test("provider failures are 503, CORS-enabled, uncached and do not expose details", async () => {
  for (const name of names) {
    const mod = route(name, true, async () => ({ data: null, error: new Error("private provider secret") }));
    const res = await mod.GET(new Request(`http://local/api/v1/${name}`));
    assert.equal(res.status, 503);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
    assert.match(res.headers.get("Cache-Control")!, /no-store/);
    assert.ok(!(await res.text()).includes("private provider secret"));
  }
});

test("public events omit contact/personnel data and use capacity plus status to decide openness", async () => {
  const mod = route("events", true, async () => ({ data: { events: [{ id: "e", title: "Public", starts_at: "2099-01-01T00:00:00Z", status: "published", capacity: 1, participants: 1, pic: "Private phone", duties: "Internal", worker_id: "secret" }] }, error: null }));
  const body = await (await mod.GET(new Request(`http://local/api/v1/events?region=${regionId}`))).json();
  assert.equal(body.data[0].is_open, false);
  for (const key of ["pic", "duties", "worker_id"]) assert.ok(!(key in body.data[0]));
});

test("docs advertise only implemented GET contracts, have h1, mock disclosure and honest HTTP status", () => {
  const docs = readFileSync("src/components/api-docs.tsx", "utf8");
  assert.doesNotMatch(docs, /\/api\/v1\/sync|OpenGov|plug and play|dua arah|Mendukung integrasi SIMPAN/);
  assert.match(docs, /level=\{1\}/);
  assert.match(docs, /className="api-documentation[\s"]/);
  assert.match(docs, /mock_interop/);
  assert.doesNotMatch(docs, />200 OK</);
});

const root = resolve("src/app/api/v1");
const names = ["schedules", "incidents", "events"] as const;
function route(name: string, configured = false, rpc = async (fn: string, args: unknown): Promise<unknown> => { void fn; void args; return { data: {}, error: null }; }) {
  function load(path: string): { GET: (req: Request) => Promise<Response>; OPTIONS: () => Response } {
    const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    const localRequire = (id: string): unknown => {
      if (id === "@/lib/supabase") return { configured: () => configured, userClient: async () => ({ rpc }) };
      if (id === "next/server") return { NextResponse: Response };
      if (id.startsWith(".")) return load(resolve(dirname(path), id + ".ts"));
      return require(id);
    };
    new Function("require", "module", "exports", code)(localRequire, module, module.exports);
    return module.exports as { GET: (req: Request) => Promise<Response>; OPTIONS: () => Response };
  }
  return load(resolve(root, name, "route.ts"));
}

test("public GET validates region before demo fallback; invalid filters never return unrelated data", async () => {
  for (const name of names) {
    for (const region of ["bad-id", ""]) {
      const res = await route(name).GET(new Request(`http://local/api/v1/${name}?region=${region}`));
      assert.equal(res.status, 400, name);
      assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
      assert.match(res.headers.get("Cache-Control")!, /no-store/);
    }
  }
});
