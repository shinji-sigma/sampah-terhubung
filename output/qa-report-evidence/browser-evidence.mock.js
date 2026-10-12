async (page) => {
  const equal = (actual, expected) => {
    if (actual !== expected)
      throw Error("MOCK assertion: " + actual + " !== " + expected);
  };
  const results = [];
  const artifact = (name) =>
    "output/qa-report-evidence/" + page.__qaSession + "-" + name;
  await page.getByLabel("Kategori").selectOption("Penumpukan");
  await page.getByLabel("Lokasi atau patokan").fill("Patokan sintetis · MOCK");
  await page
    .getByLabel("Apa yang Anda lihat?")
    .fill("Draf sintetis harus bertahan setelah sesi berakhir.");
  await page.getByLabel("Saya telah memeriksa lokasi/patokan kejadian").check();
  await page
    .getByRole("button", { name: "Lampirkan lokasi perangkat", exact: true })
    .click();
  await page.getByText(/Perkiraan ketelitian ±2500 meter/).waitFor();
  results.push(
    "GPS sintetis berakurasi rendah diterima tanpa radius pemblokiran",
  );
  await page.getByRole("button", { name: "Ambil foto", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("video")?.videoWidth > 0,
  );
  await page.getByRole("button", { name: "Ambil gambar", exact: true }).click();
  await page
    .getByRole("button", { name: "Gunakan foto", exact: true })
    .waitFor();
  equal(await page.evaluate(() => window.__evidenceMock.stopped), 1);
  await page.getByRole("button", { name: "Ambil ulang", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("video")?.videoWidth > 0,
  );
  await page.getByRole("button", { name: "Ambil gambar", exact: true }).click();
  await page.getByRole("button", { name: "Gunakan foto", exact: true }).click();
  equal(await page.evaluate(() => window.__evidenceMock.started), 2);
  equal(await page.evaluate(() => window.__evidenceMock.stopped), 2);
  results.push("Preview/capture/retake/use menghentikan semua track");
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Isian tetap tersedia" })
    .waitFor();
  equal(page.__evidenceQa.requests.at(-1).p.evidence_mode, "direct");
  equal(page.__evidenceQa.uploads.length, 1);
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page.waitForTimeout(200);
  equal(page.__evidenceQa.uploads.length, 1);
  equal(
    page.__evidenceQa.requests.at(-1).request_key,
    page.__evidenceQa.requests.at(-2).request_key,
  );
  results.push("Retry memakai ID foto dan request key yang sama");
  await page.getByRole("button", { name: "Hapus pin", exact: true }).click();
  await page.getByText(/Lokasi perangkat: -7.30000, 112.70000/).waitFor();
  results.push("Menghapus pin kejadian tidak mengganti snapshot perangkat");
  await page.screenshot({
    path: artifact("direct-desktop.mock.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: artifact("direct-phone.mock.png"),
    fullPage: true,
  });
  equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.setViewportSize({ width: 812, height: 375 });
  equal(
    await page.getByLabel("Lokasi atau patokan").inputValue(),
    "Patokan sintetis · MOCK",
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  page.__evidenceQa.commandMode = "401";
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Masuk ke lingkungan Anda" })
    .waitFor();
  await page.getByLabel("Email").fill("pelapor@example.invalid");
  await page.getByLabel("Password").fill("legacy");
  await page
    .locator("main")
    .getByRole("button", { name: "Masuk", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Sampaikan yang Anda temukan" })
    .waitFor();
  equal(
    await page.getByLabel("Lokasi atau patokan").inputValue(),
    "Patokan sintetis · MOCK",
  );
  equal(await page.getByRole("img", { name: "Foto laporan 1" }).count(), 1);
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page.waitForTimeout(200);
  equal(page.__evidenceQa.uploads.length, 1);
  results.push(
    "401 → login akun sama memulihkan teks/foto dan ID upload tanpa duplikasi",
  );
  await page.evaluate(() => {
    window.__evidenceMock.cameraMode = "denied";
  });
  await page.getByRole("button", { name: "Ambil foto", exact: true }).click();
  await page.getByText(/Izin kamera ditolak/).waitFor();
  await page.evaluate(() => {
    window.__evidenceMock.gpsMode = "timeout";
  });
  await page
    .getByRole("button", { name: "Ukur lokasi lagi", exact: true })
    .click();
  await page.getByText(/Pengukuran lokasi melewati batas waktu/).waitFor();
  results.push(
    "Permission kamera ditolak dan GPS timeout memiliki pesan spesifik",
  );
  await page
    .getByRole("button", { name: "Gunakan bukti pendukung", exact: true })
    .click();
  await page
    .getByLabel("Alasan menggunakan bukti pendukung")
    .fill("Kamera ditolak dalam uji MOCK, bukan laporan lapangan.");
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page.waitForTimeout(200);
  equal(page.__evidenceQa.requests.at(-1).p.evidence_mode, "supporting");
  results.push(
    "Jalur pendukung memakai backend/form yang sama dan menyertakan alasan",
  );
  await page.screenshot({
    path: artifact("supporting-desktop.mock.png"),
    fullPage: true,
  });
  page.__evidenceQa.browserResults = results;
  return {
    verification:
      "MOCK only; session " +
      page.__qaSession +
      "; no Cloud writes or physical camera/GPS",
    passed: results,
  };
};
