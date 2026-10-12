async (page) => {
  const equal = (actual, expected) => {
    if (actual !== expected)
      throw Error(`MOCK cache: ${actual} !== ${expected}`);
  };
  const before = page.__evidenceQa.uploads.length;
  const firstId = page.__evidenceQa.requests.at(-1).p.photos[0];
  const jpeg = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    canvas.getContext("2d").fillRect(0, 0, 16, 16);
    return canvas.toDataURL("image/jpeg").split(",")[1];
  });
  await page.getByLabel("Foto pendukung (JPG, PNG, WebP)").setInputFiles({
    name: "supporting-MOCK.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from(jpeg, "base64"),
  });
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page.waitForTimeout(200);
  equal(page.__evidenceQa.uploads.length, before + 1);
  equal(page.__evidenceQa.requests.at(-1).p.photos[0], firstId);
  equal(page.__evidenceQa.requests.at(-1).p.photos.length, 2);
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page.waitForTimeout(200);
  equal(page.__evidenceQa.uploads.length, before + 1);
  await page.getByRole("button", { name: "Hapus foto 2", exact: true }).click();
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page.waitForTimeout(200);
  equal(page.__evidenceQa.uploads.length, before + 1);
  equal(page.__evidenceQa.requests.at(-1).p.photos.length, 1);
  equal(page.__evidenceQa.requests.at(-1).p.photos[0], firstId);
  const result =
    "Menambah/menghapus foto pada draf gagal mempertahankan ID upload dan retry tidak mengunggah ulang";
  page.__evidenceQa.browserResults.push(result);
  return { verification: "MOCK only; no Cloud upload", passed: [result] };
};
