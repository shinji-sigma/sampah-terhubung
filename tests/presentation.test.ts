import { test } from "node:test";
import assert from "node:assert/strict";
import { dateLabel, incidentReference } from "../src/lib/types";

test("incident display references distinguish common UUID prefixes and suffixes without changing IDs", () => {
  const ids = [
    "40000000-0000-4000-8000-000000000001",
    "40000000-0000-4000-8000-000000000002",
    "40000000-0001-4000-8000-000000000001",
    "40000000-0000-4001-8000-000000000001",
  ];
  const snapshot = [...ids];
  assert.equal(
    new Set(ids.map((id) => incidentReference(id, ids))).size,
    ids.length,
  );
  assert.notEqual(
    incidentReference(ids[0], ids),
    incidentReference(ids[1], ids),
  );
  assert.equal(
    incidentReference(ids[0], ids),
    incidentReference(ids[0], [...ids].reverse()),
  );
  assert.deepEqual(ids, snapshot);
});
test("service metadata dates use Indonesian month names and empty-state text", () => {
  const iso = "2026-10-08";
  assert.equal(dateLabel(iso), "8 Oktober 2026");
  assert.equal(dateLabel(""), "Tanggal belum dipilih");
});
