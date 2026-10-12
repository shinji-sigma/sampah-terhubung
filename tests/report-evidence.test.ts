import { test } from "node:test";
import assert from "node:assert/strict";
import { validateCommand } from "../src/lib/validation";
import { authInput } from "../src/lib/auth-input";
import { photoMetadata } from "../src/lib/photo-input";
import { HttpError } from "../src/lib/http";
const base = {
  op: "report.create",
  region_id: crypto.randomUUID(),
  category: "Penumpukan",
  landmark: "Patokan sintetis",
  description: "Laporan sintetis untuk kontrak bukti",
  observed_at: new Date().toISOString(),
  photos: [crypto.randomUUID()],
  location_confirmed: true,
};
const parse = (p: Record<string, unknown>) =>
  validateCommand({ p, request_key: crypto.randomUUID() });
test("report paths require a complete snapshot or a supporting reason; coordinates and time are bounded", () => {
  assert.doesNotThrow(() =>
    parse({
      ...base,
      evidence_mode: "supporting",
      supporting_reason: "Kamera tidak tersedia",
    }),
  );
  const direct = {
    ...base,
    evidence_mode: "direct",
    device_lat: -7.3,
    device_lng: 112.7,
    device_accuracy_m: 1500,
    device_measured_at: new Date().toISOString(),
    lat: -7.31,
    lng: 112.71,
  };
  assert.doesNotThrow(() => parse(direct));
  for (const invalid of [
    { ...base },
    { ...base, evidence_mode: "supporting" },
    { ...direct, device_lng: null },
    { ...direct, device_accuracy_m: Infinity },
    { ...direct, device_accuracy_m: -1 },
    { ...direct, device_lat: 91 },
    { ...direct, device_measured_at: "0000-01-01T00:00:00Z" },
    { ...direct, location_confirmed: false },
    { ...direct, lng: null },
  ])
    assert.throws(() => parse(invalid));
});
test("login accepts an existing shorter password while signup retains its policy and required name", () => {
  assert.doesNotThrow(() =>
    authInput.parse({
      action: "login",
      email: "synthetic@example.invalid",
      password: "legacy",
    }),
  );
  assert.throws(() =>
    authInput.parse({
      action: "signup",
      email: "synthetic@example.invalid",
      password: "legacy",
      display_name: "Pelapor",
    }),
  );
  assert.throws(() =>
    authInput.parse({
      action: "signup",
      email: "synthetic@example.invalid",
      password: "valid-password-123",
    }),
  );
  assert.equal(
    authInput.parse({
      action: "signup",
      email: "synthetic@example.invalid",
      password: "valid-password-123",
      display_name: "Pelapor",
      is_admin: true,
    }).action,
    "signup",
  );
});
test("photo metadata cannot label upload as camera without a bounded capture time", () => {
  assert.deepEqual(photoMetadata(null, 1), [{ source: "upload" }]);
  assert.equal(
    photoMetadata(
      JSON.stringify([
        { source: "camera_web", captured_at: new Date().toISOString() },
      ]),
      1,
    )[0].source,
    "camera_web",
  );
  for (const value of [
    [{ source: "camera_web" }],
    [{ source: "verified" }],
    [{ source: "camera_web", captured_at: "0000-01-01T00:00:00Z" }],
    [],
  ])
    assert.throws(() => photoMetadata(JSON.stringify(value), 1));
  assert.throws(
    () => photoMetadata("invalid JSON", 1),
    (error) => error instanceof HttpError && error.status === 422,
  );
});
