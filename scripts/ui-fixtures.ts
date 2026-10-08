// Test-only fixture generation. Not imported by production pages or API handlers.
import { writeFile, mkdir } from "node:fs/promises";
import { regionIds } from "./env";
const region = {
  id: regionIds.a,
  name: "Kawasan Uji A · MOCK",
  coverage: "Cakupan pengujian UI terisolasi",
  active: true,
  owner_label: "Pengelola MOCK",
  lat: -7.3,
  lng: 112.7,
  recurrence_count: 2,
  recurrence_days: 30,
  version: 1,
};
const actor = "20000000-0000-4000-8000-000000000003",
  reporter = "20000000-0000-4000-8000-000000000001",
  worker = "20000000-0000-4000-8000-000000000004";
const report = {
  id: "60000000-0000-4000-8000-000000000001",
  region_id: region.id,
  reporter_id: reporter,
  landmark: "Patokan uji UI",
  description: "Laporan MOCK untuk menguji kolom dan jaringan.",
  category: "Penumpukan",
  observed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  status: "pending",
  version: 1,
  incident_id: null,
  hidden: false,
};
const incident = {
  id: "70000000-0000-4000-8000-000000000001",
  region_id: region.id,
  point_id: "80000000-0000-4000-8000-000000000001",
  status: "working",
  public_label: "Titik uji MOCK",
  version: 1,
  verified_at: new Date().toISOString(),
  observed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};
const task = {
  id: "90000000-0000-4000-8000-000000000001",
  region_id: region.id,
  incident_id: incident.id,
  worker_id: worker,
  status: "accepted",
  due_at: new Date().toISOString(),
  version: 1,
  blocker: null,
};
const publicData = {
  regions: [region],
  schedules: [],
  exceptions: [],
  runs: [],
  incidents: [incident],
  events: [],
};
const event = {
  id: "b0000000-0000-4000-8000-000000000001",
  region_id: region.id,
  title: "Kerja bakti taman · MOCK",
  location: "Taman bersama · lokasi MOCK",
  starts_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  capacity: 15,
  participants: 0,
  pic: "Koordinator MOCK",
  duties: "Pengumpulan dan dokumentasi",
  equipment: "Sarung tangan dan karung",
  transporter: "Pengangkut MOCK",
  pickup_at: new Date(Date.now() + 7 * 86400000 + 7200000).toISOString(),
  destination: "TPS simulasi · MOCK",
  transport_confirmed: true,
  status: "published",
  version: 1,
};
const common = {
  regions: [region],
  profiles: [
    { id: actor, display_name: "Koordinator MOCK", is_admin: false },
    { id: reporter, display_name: "Pelapor MOCK", is_admin: false },
    { id: worker, display_name: "Petugas MOCK", is_admin: false },
  ],
  points: [
    {
      id: incident.point_id,
      region_id: region.id,
      label: "Titik uji MOCK",
      lat: -7.3,
      lng: 112.7,
    },
  ],
  reports: [report],
  incidents: [incident],
  tasks: [task],
  feedback: [],
  schedules: [],
  exceptions: [],
  runs: [],
  preventions: [],
  events: [],
  registrations: [],
  photos: [],
  history: [],
  notifications: [],
};
await mkdir("output/playwright", { recursive: true });
for (const [role, profileId, roleName] of [
  ["coordinator", actor, "coordinator"],
  ["worker", worker, "worker"],
  ["reporter", reporter, null],
] as const) {
  const workspace = {
    ...common,
    events: [event],
    profile: common.profiles.find((p) => p.id === profileId),
    memberships: roleName
      ? [
          {
            user_id: profileId,
            region_id: region.id,
            role: roleName,
            active: true,
          },
          {
            user_id: worker,
            region_id: region.id,
            role: "worker",
            active: true,
          },
        ]
      : [],
  };
  const code = `async (page) => { const publicData=${JSON.stringify({ ...publicData, events: [event] })}; const workspace=${JSON.stringify(workspace)}; await page.unroute('**/api/**'); await page.route('**/api/**', async route => { const path=new URL(route.request().url()).pathname; if(path==='/api/public')return route.fulfill({json:publicData}); if(path==='/api/workspace')return route.fulfill({json:workspace}); if(path==='/api/commands')return route.fulfill({status:422,json:{error:'Periksa isian yang ditandai. MOCK — tidak tersimpan.',fields:{description:'Jelaskan kondisi lebih lengkap.',public_label:'Patokan publik wajib diisi.',action_taken:'Jelaskan tindakan lebih lengkap.'}}}); if(path==='/api/photos')return route.fulfill({json:{ids:['a0000000-0000-4000-8000-000000000001']}}); return route.fulfill({status:503,json:{error:'Endpoint tidak disimulasikan.'}}); }); await page.goto('http://localhost:3002/ui-test'); }`;
  await writeFile("output/playwright/mock-" + role + ".js", code);
}
