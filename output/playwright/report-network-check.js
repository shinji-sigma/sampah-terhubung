async (page) => {
  await page.route("**/api/commands", (route) => route.abort("failed"));
  await page.getByLabel("Kategori *").selectOption("Penumpukan");
  await page
    .getByRole("textbox", { name: "Lokasi atau patokan" })
    .fill("Pagar timur untuk uji UI");
  await page
    .getByRole("textbox", { name: "Apa yang Anda lihat?" })
    .fill("Laporan MOCK; isian harus tetap tersedia saat jaringan gagal.");
  await page
    .locator("input[type=file]")
    .setInputFiles("output/playwright/desktop-preview.png");
  await page
    .getByRole("button", { name: "Kirim laporan", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Koneksi terputus" })
    .waitFor();
  if (
    (await page
      .getByRole("textbox", { name: "Lokasi atau patokan" })
      .inputValue()) !== "Pagar timur untuk uji UI"
  )
    throw new Error("Isian hilang");
  const size = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  if (size.content > size.viewport) throw new Error("Gulir horizontal");
  await page.screenshot({
    path: "output/playwright/mobile-report-network.png",
    fullPage: true,
  });
  return {
    scenario:
      "UI MOCK: jaringan gagal, tidak ada pesan sukses dan isian dipertahankan",
    result: "Lulus",
    ...size,
  };
};
