import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { recurrence, scheduleOn, csvCell, csv } from "../src/lib/rules";
import { validateImage } from "../src/lib/uploads";
import { validateCommand } from "../src/lib/validation";
import type { Incident, Schedule, ScheduleException } from "../src/lib/types";
test("five supporting reports / reopening still count one distinct incident; new incident after closure counts twice", () => {
  const i = {
    id: "1",
    point_id: "p",
    verified_at: "2026-10-01T00:00:00Z",
    observed_at: "2026-10-01T00:00:00Z",
    previous_incident_id: null,
  } as Incident;
  const newer = {
    ...i,
    id: "2",
    verified_at: "2026-10-05T00:00:00Z",
    observed_at: "2026-10-04T00:00:00Z",
    previous_incident_id: "1",
    previous_closed_at: "2026-10-02T00:00:00Z",
  };
  assert.equal(
    recurrence([i, i, i, i, i], new Date("2026-10-08"), 30).get("p")?.length,
    1,
  );
  assert.equal(
    recurrence([i, newer], new Date("2026-10-08"), 30).get("p")?.length,
    2,
  );
  assert.equal(
    recurrence(
      [i, { ...newer, observed_at: "2026-10-01T00:00:00Z" }],
      new Date("2026-10-08"),
      30,
    ).get("p")?.length,
    1,
  );
});
test("dated schedule change affects only one date; actual and unconfirmed states remain distinct", () => {
  const s = {
    id: "s",
    weekdays: [4],
    valid_from: "2026-10-01",
    valid_until: "2026-12-31",
    start_time: "08:00",
    end_time: "10:00",
    confirmed_at: null,
  } as Schedule;
  const e = {
    id: "x",
    schedule_id: "s",
    date: "2026-10-08",
    cancelled: false,
    start_time: "10:00",
    end_time: "12:00",
    reason: "Perubahan",
    created_at: "2026-10-01",
  } as ScheduleException;
  assert.equal(scheduleOn(s, "2026-10-08", [e], [])?.start, "10:00");
  assert.equal(scheduleOn(s, "2026-10-15", [e], [])?.start, "08:00");
  assert.equal(scheduleOn(s, "2026-10-08", [e], [])?.confirmed, false);
  assert.equal(scheduleOn(s, "2026-10-09", [e], []), null);
});
test("CSV protects formula prefixes, whitespace tricks and escapes quoted multiline text", () => {
  for (const value of ["=SUM(A1)", " +SUM(A1)", "\t@SUM(A1)", "-1+1", "\r=1"])
    assert.ok(csvCell(value).startsWith("\"'"));
  assert.equal(csvCell('Sampah "A"'), '"Sampah ""A"""');
  assert.ok(csv([["Data simulasi"]]).startsWith("\uFEFF"));
});
test("image validation decodes real image, strips metadata, rejects wrong mime, SVG, oversized and invalid bytes", async () => {
  const png = await sharp({
    create: { width: 50, height: 50, channels: 3, background: "#166534" },
  })
    .png()
    .toBuffer();
  const jpeg = await validateImage(png, "image/png");
  assert.equal((await sharp(jpeg).metadata()).format, "jpeg");
  await assert.rejects(() => validateImage(png, "image/jpeg"), /Isi foto/);
  await assert.rejects(
    () => validateImage(Buffer.from("<svg></svg>"), "image/svg+xml"),
    /JPG/,
  );
  await assert.rejects(
    () => validateImage(Buffer.alloc(5242881), "image/jpeg"),
    /5 MB/,
  );
  await assert.rejects(
    () => validateImage(Buffer.from("broken"), "image/png"),
    /Isi foto/,
  );
});
test("server command schema rejects absent versions, invalid coords, forged photo UUIDs and too many images", () => {
  assert.throws(() =>
    validateCommand({
      request_key: crypto.randomUUID(),
      p: { op: "task.accept", id: crypto.randomUUID() },
    }),
  );
  assert.throws(() =>
    validateCommand({
      request_key: crypto.randomUUID(),
      p: {
        op: "report.create",
        region_id: crypto.randomUUID(),
        landmark: "Patokan",
        category: "Penumpukan",
        description: "Deskripsi valid",
        observed_at: new Date().toISOString(),
        lat: 100,
        photos: ["fake"],
      },
    }),
  );
});
