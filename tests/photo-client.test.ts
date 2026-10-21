import { test } from "node:test";
import assert from "node:assert/strict";
import { preparePhoto, uploadPhotoFiles } from "../src/lib/photo-client";

test("three photos use separate bounded requests and partial retry keeps successful IDs", async () => {
  const files = [0, 1, 2].map(
    (i) =>
      new File([new Uint8Array(3 * 1024 * 1024)], `photo-${i}.jpg`, {
        type: "image/jpeg",
      }),
  );
  const ids = new Map<File, string>();
  const requests: string[] = [];
  let fail = true;
  const upload = async (body: FormData) => {
    assert.equal(body.getAll("photos").length, 1);
    const file = body.get("photos") as File;
    assert.equal(file.size, 3 * 1024 * 1024);
    requests.push(file.name);
    if (file.name === "photo-1.jpg" && fail) {
      fail = false;
      throw new Error("synthetic connection failure");
    }
    return { ids: [file.name] };
  };
  await assert.rejects(() => uploadPhotoFiles(files, ids, upload), /failure/);
  assert.deepEqual([...ids.values()], ["photo-0.jpg"]);
  await uploadPhotoFiles(files, ids, upload);
  assert.deepEqual(
    [...ids.values()],
    files.map((f) => f.name),
  );
  assert.deepEqual(requests, [
    "photo-0.jpg",
    "photo-1.jpg",
    "photo-1.jpg",
    "photo-2.jpg",
  ]);
  assert.equal(await preparePhoto(files[0]), files[0]);
});
test("photo source metadata stays aligned with each file across a partial retry", async () => {
  const files = [
    new File(["photo-a"], "a.jpg", { type: "image/jpeg" }),
    new File(["photo-b"], "b.jpg", { type: "image/jpeg" }),
  ];
  const ids = new Map([[files[0], "already-uploaded-a"]]),
    captured_at = new Date().toISOString();
  await uploadPhotoFiles(
    files,
    ids,
    async (body) => {
      assert.equal((body.get("photos") as File).name, "b.jpg");
      assert.deepEqual(JSON.parse(String(body.get("metadata"))), [
        { source: "camera_web", captured_at },
      ]);
      return { ids: ["camera-b"] };
    },
    [{ source: "upload" }, { source: "camera_web", captured_at }],
  );
  assert.deepEqual([...ids.values()], ["already-uploaded-a", "camera-b"]);
});
test("editing and reordering a failed photo selection reuses successful files and prunes removed ones", async () => {
  const files = [0, 1, 2].map(
    (index) => new File(["synthetic"], index + ".jpg", { type: "image/jpeg" }),
  );
  const cache = new Map<File, string>(),
    requests: string[] = [];
  const upload = async (body: FormData) => {
    const file = body.get("photos") as File;
    requests.push(file.name);
    return { ids: [file.name] };
  };
  assert.deepEqual(await uploadPhotoFiles(files.slice(0, 1), cache, upload), [
    "0.jpg",
  ]);
  assert.deepEqual(
    await uploadPhotoFiles([files[2], files[0]], cache, upload),
    ["2.jpg", "0.jpg"],
  );
  assert.deepEqual(requests, ["0.jpg", "2.jpg"]);
  assert.deepEqual(await uploadPhotoFiles([files[2]], cache, upload), [
    "2.jpg",
  ]);
  assert.equal(cache.has(files[0]), false);
});
