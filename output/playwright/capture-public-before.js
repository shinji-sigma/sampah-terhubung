async (page) => {
  await page.unroute("**/api/**")
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 360, 800],
  ]) {
    await page.setViewportSize({ width, height })
    await page.goto("http://localhost:3001/preview")
    await page.getByRole("heading", { level: 1 }).waitFor()
    await page.screenshot({
      path: `output/playwright/design-revision/before/${name}-home.png`,
    })
    for (const [view, label] of [
      ["schedule", "Jadwal angkut"],
      ["events-empty", "Kegiatan"],
    ]) {
      const button = page.getByRole("button", { name: label, exact: true })
      if (!(await button.isVisible()))
        await page
          .getByRole("button", { name: "Buka navigasi", exact: true })
          .click()
      await button.click()
      await page.screenshot({
        path: `output/playwright/design-revision/before/${name}-${view}.png`,
      })
    }
    await page
      .getByRole("button", {
        name: "WILAYAH SAYA Kawasan Hijau A · Simulasi",
        exact: true,
      })
      .click()
    await page
      .getByRole("heading", { name: "Temukan lingkungan Anda" })
      .waitFor()
    await page.screenshot({
      path: `output/playwright/design-revision/before/${name}-region.png`,
    })
  }
}
