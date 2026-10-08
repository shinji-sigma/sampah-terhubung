async (page) => {
  const timings = [];
  await page.setViewportSize({ width: 360, height: 800 });
  for (let i = 0; i < 5; i++) {
    const started = Date.now();
    await page.goto("http://localhost:3001/preview");
    await page.getByRole("heading", { level: 1 }).waitFor();
    timings.push({
      iteration: i + 1,
      visibleHeadingMs: Date.now() - started,
      ...(await page.evaluate(() => {
        const n = performance.getEntriesByType("navigation")[0];
        return {
          domContentLoadedMs: Math.round(n.domContentLoadedEventEnd),
          responseEndMs: Math.round(n.responseEnd),
        };
      })),
    });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw new Error("Horizontal overflow");
  }
  await page.screenshot({ path: "output/playwright/mobile-preview.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "output/playwright/desktop-preview.png" });
  const hidden = await page.request.get("http://localhost:3001/ui-test");
  if (hidden.status() !== 404)
    throw new Error("UI test route leaked into production");
  const publicApi = await page.request.get("http://localhost:3001/api/public");
  if (publicApi.status() !== 503)
    throw new Error("Missing backend was not reported");
  const forged = await page.request.post("http://localhost:3001/api/commands", {
    headers: { Origin: "https://example.invalid" },
    data: { op: "report.create" },
  });
  if (forged.status() !== 403) throw new Error("Forged origin allowed");
  const icon = await page.request.get("http://localhost:3001/icon.svg");
  if (icon.status() !== 200) throw new Error("Favicon missing");
  return {
    backendConfigured: false,
    productionUiTestStatus: hidden.status(),
    missingBackendStatus: publicApi.status(),
    crossOriginStatus: forged.status(),
    viewport: "360x800 + 1440x1000",
    localWarmPreviewTimings: timings,
  };
};
