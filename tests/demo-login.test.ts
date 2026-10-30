import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

test("demo credentials require explicit opt-in and return only allowlisted accounts", async () => {
  assert.ok(
    existsSync("src/app/api/demo-login/route.ts"),
    "demo login route must exist",
  );
  const { GET, POST } = await import("../src/app/api/demo-login/route");
  const names = [
    "DEMO_MODE",
    "DEMO_LOGIN_ENABLED",
    "DEMO_PASSWORD",
    "APP_ORIGIN",
  ] as const;
  const saved = names.map((name) => process.env[name]);
  const request = (role: string, origin = "https://demo.test") =>
    new Request("https://demo.test/api/demo-login", {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
  try {
    process.env.APP_ORIGIN = "https://demo.test";
    process.env.DEMO_PASSWORD = "test-only-not-a-real-password";
    for (const mode of [undefined, "false", "true"]) {
      for (const enabled of [undefined, "false", "true"]) {
        if (mode === undefined) delete process.env.DEMO_MODE;
        else process.env.DEMO_MODE = mode;
        if (enabled === undefined) delete process.env.DEMO_LOGIN_ENABLED;
        else process.env.DEMO_LOGIN_ENABLED = enabled;
        if (mode === "true" && enabled === "true") continue;
        assert.equal((await POST(request("admin"))).status, 404);
        assert.deepEqual(await (await GET()).json(), {
          enabled: false,
          available: false,
        });
      }
    }
    process.env.DEMO_MODE = "true";
    process.env.DEMO_LOGIN_ENABLED = "true";
    assert.deepEqual(await (await GET()).json(), {
      enabled: true,
      available: true,
    });
    for (const [role, email] of [
      ["admin", "admin@demo.invalid"],
      ["user", "pelapor.a@demo.invalid"],
    ]) {
      const response = await POST(request(role));
      assert.equal(response.status, 200);
      assert.match(response.headers.get("cache-control")!, /no-store/);
      assert.deepEqual(await response.json(), {
        email,
        password: process.env.DEMO_PASSWORD,
      });
      assert.equal(response.headers.get("set-cookie"), null);
    }
    assert.equal(
      (await POST(request("admin", "https://other.test"))).status,
      403,
    );
    assert.equal((await POST(request("constructor"))).status, 422);
    assert.equal((await POST(request("other@demo.invalid"))).status, 422);
    delete process.env.DEMO_PASSWORD;
    assert.deepEqual(await (await GET()).json(), {
      enabled: true,
      available: false,
    });
    assert.equal((await POST(request("admin"))).status, 503);
  } finally {
    names.forEach((name, i) => {
      if (saved[i] === undefined) delete process.env[name];
      else process.env[name] = saved[i];
    });
  }
});
