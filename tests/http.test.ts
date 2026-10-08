import { test } from "node:test";
import assert from "node:assert/strict";
import { readLimited } from "../src/lib/body";
import { checkOrigin } from "../src/lib/http";
test("chunked requests cannot bypass maximum body size by omitting content-length", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(6));
      controller.enqueue(new Uint8Array(6));
      controller.close();
    },
  });
  const req = new Request("http://localhost:3000/api/photos", {
    method: "POST",
    body: stream,
    duplex: "half",
  } as RequestInit);
  await assert.rejects(() => readLimited(req, 10), /terlalu besar/);
  assert.equal(
    (
      await readLimited(
        new Request("http://localhost:3000", { method: "POST", body: "small" }),
        10,
      )
    ).byteLength,
    5,
  );
});
test("cross-origin mutation is rejected before authentication/database access", () => {
  assert.throws(
    () =>
      checkOrigin(
        new Request("http://localhost:3000/api/commands", {
          headers: { Origin: "https://other.invalid" },
        }),
      ),
    /tidak diizinkan/,
  );
  assert.doesNotThrow(() =>
    checkOrigin(
      new Request("http://localhost:3000/api/commands", {
        headers: { Origin: process.env.APP_ORIGIN || "http://localhost:3000" },
      }),
    ),
  );
});
