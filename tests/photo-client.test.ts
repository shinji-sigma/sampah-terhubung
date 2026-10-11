import { test } from "node:test";
import assert from "node:assert/strict";
import { preparePhoto, uploadPhotoFiles } from "../src/lib/photo-client";

test("three photos use separate bounded requests and partial retry keeps successful IDs", async () => {
  const files = [0, 1, 2].map((i) =>
    new File([new Uint8Array(3 * 1024 * 1024)], `photo-${i}.jpg`, {
      type: "image/jpeg",
    }),
  );
  const ids: string[] = [];
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
  assert.deepEqual(ids, ["photo-0.jpg"]);
  await uploadPhotoFiles(files, ids, upload);
  assert.deepEqual(ids, files.map((f) => f.name));
  assert.deepEqual(requests, ["photo-0.jpg", "photo-1.jpg", "photo-1.jpg", "photo-2.jpg"]);
  assert.equal(await preparePhoto(files[0]), files[0]);
});
