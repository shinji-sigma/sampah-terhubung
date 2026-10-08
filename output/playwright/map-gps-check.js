async (page) => {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("http://localhost:3002/ui-test");
  await page
    .getByRole("button", { name: "WILAYAH SAYA Kawasan Uji A · MOCK" })
    .click();
  await page
    .getByText(
      "Peta tidak tersedia. Gunakan daftar wilayah dan patokan manual.",
    )
    .waitFor();
  await page.evaluate(() => {
    Object.defineProperty(navigator.geolocation, "getCurrentPosition", {
      configurable: true,
      value: (_success, failure) =>
        failure({ code: 1, message: "Permission denied — simulated UI test" }),
    });
  });
  await page.getByRole("button", { name: "Gunakan GPS untuk saran" }).click();
  await page
    .getByText(
      "GPS tidak tersedia atau izin ditolak. Pilih wilayah manual; layanan tetap dapat digunakan.",
    )
    .waitFor();
  await page.getByRole("textbox", { name: "Cari wilayah" }).fill("Kawasan");
  await page
    .getByRole("button", {
      name: "Kawasan Uji A · MOCK Cakupan pengujian UI terisolasi Layanan aktif",
    })
    .waitFor();
  await page.screenshot({
    path: "output/playwright/mobile-map-gps-failure.png",
    fullPage: true,
  });
  await page.getByRole("textbox", { name: "Cari wilayah" }).focus();
  await page.keyboard.press("Tab");
  if (
    await page
      .getByRole("button", { name: "Gunakan GPS untuk saran" })
      .evaluate((e) => e !== document.activeElement)
  )
    throw new Error("Urutan keyboard gagal");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { level: 1 }).waitFor();
};
