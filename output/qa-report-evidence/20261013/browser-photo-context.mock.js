async (page) => {
  const equal = (actual, expected) => {
    if (actual !== expected) throw Error(`${actual} != ${expected}`);
  };
  const at = "2026-10-13T02:31:00Z";
  const region = {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Wilayah A · MOCK",
    coverage: "Simulasi UI",
    active: true,
    owner_label: "MOCK",
    lat: -7.3,
    lng: 112.7,
    recurrence_count: 2,
    recurrence_days: 30,
    version: 1,
  };
  const incident = {
    id: "40000000-0000-4000-8000-000000000001",
    region_id: region.id,
    point_id: "point",
    status: "closed",
    public_label: "Bukti sesudah · MOCK",
    verified_at: at,
    observed_at: at,
    closed_at: at,
    version: 1,
    hidden: false,
    created_at: at,
  };
  const publicData = {
    regions: [region],
    schedules: [],
    exceptions: [],
    runs: [],
    incidents: [incident],
    events: [],
  };
  const profile = {
    id: "reporter",
    display_name: "Pelapor MOCK",
    is_admin: false,
  };
  const report = {
    id: "report",
    reporter_id: profile.id,
    region_id: region.id,
    incident_id: incident.id,
    landmark: "Bukti sesudah · MOCK",
    description: "Foto sintetis untuk memeriksa tampilan hasil penanganan.",
    status: "validated",
    category: "Penumpukan",
    created_at: at,
    observed_at: at,
    evidence_mode: null,
    version: 1,
  };
  const photo = {
    source: "upload",
    captured_at: null,
    created_at: at,
    owner_id: "synthetic",
    event_id: null,
    report_id: null,
    task_id: null,
  };
  const workspace = {
    ...publicData,
    profile,
    profiles: [profile],
    memberships: [],
    points: [],
    reports: [report],
    tasks: [],
    feedback: [],
    preventions: [],
    registrations: [],
    history: [],
    notifications: [],
    photos: [
      { ...photo, id: "before", report_id: report.id, incident_id: null },
      {
        ...photo,
        id: "after",
        task_id: "private-task",
        incident_id: incident.id,
      },
      {
        ...photo,
        id: "foreign",
        task_id: "foreign-task",
        incident_id: "foreign-incident",
      },
    ],
  };
  await page.unroute("**/api/**");
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/public") return route.fulfill({ json: publicData });
    if (path === "/api/workspace") return route.fulfill({ json: workspace });
    if (path.startsWith("/api/photos/"))
      return route.fulfill({
        path: "D:/WebDemo/output/qa-report-evidence/20261013/foto-sintetis.jpg",
        contentType: "image/jpeg",
      });
    return route.fulfill({ status: 503, json: { error: "MOCK only" } });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://localhost:3001");
  await page
    .getByRole("button", { name: "Keluar dari akun Pelapor MOCK" })
    .waitFor();
  await page.getByRole("button", { name: "Laporan saya", exact: true }).click();
  await page.getByRole("heading", { name: report.landmark }).waitFor();
  equal(await page.locator('a[href="/api/photos/before"]').count(), 1);
  equal(await page.locator('a[href="/api/photos/after"]').count(), 1);
  equal(await page.locator('a[href="/api/photos/foreign"]').count(), 0);
  equal(await page.locator(".task-record").count(), 0);
  await page.screenshot({
    path: "output/qa-report-evidence/20261013/reporter-result-desktop.mock.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  equal(await page.locator('a[href="/api/photos/after"]').count(), 1);
  equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: "output/qa-report-evidence/20261013/reporter-result-phone.mock.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Buka navigasi", exact: true })
    .click();
  await page.getByRole("button", { name: "Beranda", exact: true }).click();
  await page.locator(".incident-detail").first().locator("summary").click();
  equal(await page.locator('a[href="/api/photos/before"]').count(), 1);
  equal(await page.locator('a[href="/api/photos/after"]').count(), 1);
  equal(await page.locator('a[href="/api/photos/foreign"]').count(), 0);
  return {
    scope: "Local browser MOCK backend; no real sensor/Cloud writes",
    passed: [
      "Reporter sees before/after photos with no task records",
      "Foreign incident photo omitted",
      "390px emulation has no horizontal overflow",
      "Home incident detail also displays permitted completion photo",
    ],
  };
};
