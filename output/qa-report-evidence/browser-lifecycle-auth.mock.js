async (page) => {
  const equal = (actual, expected) => {
    if (actual !== expected)
      throw Error("MOCK assertion: " + actual + " !== " + expected);
  };
  const results = [];
  const artifact = (name) =>
    "output/qa-report-evidence/" + page.__qaSession + "-" + name;
  await page.evaluate(() => {
    window.__evidenceMock.cameraMode = "pending";
  });
  await page.getByRole("button", { name: "Ambil foto", exact: true }).click();
  await page.getByText(/Menunggu izin kamera/).waitFor();
  await page.getByText(/Izin kamera belum selesai/).waitFor({ timeout: 25000 });
  const before = await page.evaluate(() => window.__evidenceMock.stopped);
  await page.evaluate(() =>
    window.__resolveCameraMock({
      getTracks: () => [{ stop: () => window.__evidenceMock.stopped++ }],
    }),
  );
  await page.waitForTimeout(100);
  equal(await page.evaluate(() => window.__evidenceMock.stopped), before + 1);
  results.push(
    "Prompt kamera tanpa jawaban berakhir dalam 20 detik; stream yang datang terlambat dihentikan",
  );
  await page.evaluate(() => {
    window.__evidenceMock.cameraMode = "ok";
  });
  await page.getByRole("button", { name: "Ambil foto", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("video")?.videoWidth > 0,
  );
  const beforeNavigation = await page.evaluate(
    () => window.__evidenceMock.stopped,
  );
  await page.getByRole("button", { name: "Beranda", exact: true }).click();
  await page.waitForTimeout(100);
  equal(
    await page.evaluate(() => window.__evidenceMock.stopped),
    beforeNavigation + 1,
  );
  await page.getByRole("button", { name: "Buat laporan", exact: true }).click();
  equal(
    await page.getByLabel("Lokasi atau patokan").inputValue(),
    "Patokan sintetis · MOCK",
  );
  results.push("Navigasi menghentikan kamera dan draf tetap tersedia");
  await page.evaluate(() => {
    window.__revokedEvidence = [];
    window.__oldEvidenceUrl = document.querySelector(".evidence-photo img").src;
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url) => {
      window.__revokedEvidence.push(url);
      revoke(url);
    };
  });
  page.__evidenceQa.commandMode = "401";
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Masuk ke lingkungan Anda" })
    .waitFor();
  await page.getByLabel("Email").fill("other@example.invalid");
  await page.getByLabel("Password").fill("legacy");
  await page
    .locator("main")
    .getByRole("button", { name: "Masuk", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Sampaikan yang Anda temukan" })
    .waitFor();
  equal(await page.getByLabel("Lokasi atau patokan").inputValue(), "");
  equal(await page.getByRole("img", { name: "Foto laporan 1" }).count(), 0);
  equal(
    await page.evaluate(() =>
      window.__revokedEvidence.includes(window.__oldEvidenceUrl),
    ),
    true,
  );
  results.push(
    "Akun berbeda membuang draf dan melepaskan object URL foto akun sebelumnya",
  );
  await page
    .getByRole("button", { name: "Keluar dari akun Pelapor MOCK" })
    .click();
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.getByRole("button", { name: "Daftar", exact: true }).click();
  equal(await page.locator("main form").count(), 1);
  equal(
    await page.getByLabel("Password").getAttribute("autocomplete"),
    "new-password",
  );
  await page.getByLabel("Nama tampilan").fill("Pelapor sintetis");
  await page.getByLabel("Email").fill("synthetic@example.invalid");
  await page.getByLabel("Password").fill("synthetic-password-123");
  await page
    .getByRole("button", { name: "Daftar sebagai pelapor", exact: true })
    .click();
  await page.getByText(/Periksa email untuk konfirmasi akun · MOCK/).waitFor();
  equal(
    await page
      .getByRole("button", { name: "Keluar dari akun Pelapor MOCK" })
      .count(),
    0,
  );
  results.push(
    "Daftar satu form/new-password; respons tanpa sesi meminta konfirmasi dan tidak membangun workspace",
  );
  await page.getByLabel("Password").fill("");
  await page.screenshot({
    path: artifact("signup-desktop.mock.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({
    path: artifact("signup-phone.mock.png"),
    fullPage: true,
  });
  equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  page.__evidenceQa.browserResults.push(...results);
  return { verification: "MOCK only; no email sent", passed: results };
};
