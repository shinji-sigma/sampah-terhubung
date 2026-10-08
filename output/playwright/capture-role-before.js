async (page) => {
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 360, 800],
  ]) {
    await page.setViewportSize({ width, height })
    const role = await page.locator(".welcome-line").innerText()
    const view = role.includes("Koordinator")
      ? "coordinator"
      : role.includes("Petugas")
        ? "worker"
        : "report"
    if (view === "report")
      await page
        .getByRole("button", { name: "Buat laporan", exact: true })
        .click()
    else {
      const button = page.getByRole("button", {
        name: "Ruang kerja",
        exact: true,
      })
      if (!(await button.isVisible()))
        await page
          .getByRole("button", { name: "Buka navigasi", exact: true })
          .click()
      await button.click()
    }
    await page.screenshot({
      path: `output/playwright/design-revision/before/${name}-${view}.png`,
    })
    if (name === "desktop") {
      const home = page.getByRole("button", { name: "Beranda", exact: true })
      await home.click()
    }
  }
}
