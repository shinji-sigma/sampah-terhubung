import test from "node:test";
import assert from "node:assert/strict";
import { withPhotoContext } from "../src/lib/photo-context";
import type { Photo } from "../src/lib/types";

test("reporter can associate permitted worker evidence without receiving private tasks", () => {
  const photo = { id: "allowed-photo", task_id: "private-task" } as Photo;
  const task = {
    id: "private-task",
    incident_id: "own-incident",
    worker_id: "private-worker",
    reason: "private-reason",
  };
  const [result] = withPhotoContext([photo], [{ id: "own-incident" }], [task]);
  assert.equal(result.incident_id, "own-incident");
  assert.equal("worker_id" in result, false);
  assert.equal("reason" in result, false);
  assert.deepEqual(photo, { id: "allowed-photo", task_id: "private-task" });
});

test("context cannot add photos or associate evidence with an inaccessible incident", () => {
  const photos = [
    { id: "allowed", task_id: "task" },
    { id: "report-photo", task_id: null },
  ] as Photo[];
  const result = withPhotoContext(
    photos,
    [{ id: "own" }],
    [
      { id: "task", incident_id: "foreign" },
      { id: "foreign-task", incident_id: "own" },
    ],
  );
  assert.deepEqual(
    result.map((p) => p.incident_id),
    [null, null],
  );
  assert.deepEqual(
    result.map((p) => p.id),
    ["allowed", "report-photo"],
  );
});
