async (page) => {
  const equal = (actual, expected) => {
    if (actual !== expected)
      throw Error(`MOCK recovery: ${actual} !== ${expected}`);
  };
  const results = [];
  const uploads = page.__evidenceQa.uploads.length;
  const key = page.__evidenceQa.requests.at(-1).request_key;
  await page.route("**/api/commands", (route) =>
    route.abort("internetdisconnected"),
  );
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Koneksi terputus" })
    .waitFor();
  equal(
    await page.getByLabel("Lokasi atau patokan").inputValue(),
    "Patokan sintetis · MOCK",
  );
  equal(page.__evidenceQa.uploads.length, uploads);
  await page.unroute("**/api/commands");
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Isian tetap tersedia" })
    .waitFor();
  equal(page.__evidenceQa.uploads.length, uploads);
  equal(page.__evidenceQa.requests.at(-1).request_key, key);
  results.push(
    "Network abort → retry preserves draft, photo IDs and request key (MOCK)",
  );
  await page.evaluate(() => {
    window.__evidenceMock.gpsMode = "denied";
  });
  await page
    .getByRole("button", { name: "Ukur lokasi lagi", exact: true })
    .click();
  await page.getByText(/Izin lokasi ditolak/).waitFor();
  results.push(
    "Denied GPS permission has a specific supporting-path message (MOCK)",
  );
  await page.evaluate(() => {
    window.__savedGetUserMedia = navigator.mediaDevices.getUserMedia;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        throw new DOMException("Synthetic busy", "NotReadableError");
      },
    });
  });
  await page.getByRole("button", { name: "Ambil foto", exact: true }).click();
  await page.getByText(/sedang dipakai aplikasi lain/).waitFor();
  await page.evaluate(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: undefined,
    });
  });
  await page.getByRole("button", { name: "Ambil foto", exact: true }).click();
  await page.getByText(/Kamera web tidak tersedia/).waitFor();
  results.push("Busy and unavailable cameras offer supporting evidence (MOCK)");
  await page.evaluate(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: window.__savedGetUserMedia,
    });
    window.__evidenceMock.cameraMode = "ok";
  });
  await page.getByRole("button", { name: "Ambil foto", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector("video")?.videoWidth > 0,
  );
  const before = await page.evaluate(() => window.__evidenceMock.stopped);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  equal(await page.evaluate(() => window.__evidenceMock.stopped), before + 1);
  await page.evaluate(() => {
    delete document.visibilityState;
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  equal(await page.getByRole("img", { name: "Foto laporan 1" }).count(), 1);
  results.push(
    "Synthetic background transition stops camera without discarding selected photo (MOCK)",
  );
  page.__evidenceQa.browserResults.push(...results);
  return {
    scope:
      "MOCK only; no real network outage, physical sensors or Cloud mutations",
    passed: results,
  };
};
