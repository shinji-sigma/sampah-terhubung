import { test } from "node:test";
import assert from "node:assert/strict";
import { api, ApiError } from "../src/components/forms";

test("API recovery preserves actionable errors across proxy HTML, network loss and field validation", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response("<h1>Unavailable</h1>", { status: 503 });
    await assert.rejects(
      () => api("/api/commands", { op: "synthetic" }),
      /Respons layanan.*Isian tetap tersedia/,
    );
    globalThis.fetch = async () => {
      throw new TypeError("synthetic network loss");
    };
    await assert.rejects(
      () => api("/api/commands", {}),
      /Koneksi terputus.*Isian tetap tersedia/,
    );
    globalThis.fetch = async () =>
      Response.json(
        { error: "Periksa isian", fields: { description: "Terlalu singkat" } },
        { status: 422 },
      );
    await assert.rejects(
      () => api("/api/commands", {}),
      (error) =>
        error instanceof ApiError &&
        error.fields.description === "Terlalu singkat",
    );
    globalThis.fetch = async () =>
      Response.json({ message: "Perubahan tersimpan." });
    assert.equal(
      (await api("/api/commands", {})).message,
      "Perubahan tersimpan.",
    );
  } finally {
    globalThis.fetch = original;
  }
});
