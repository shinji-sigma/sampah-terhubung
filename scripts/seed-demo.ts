import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
import { env, accounts, regionIds } from "./env";
import { jakartaDate } from "../src/lib/rules";
const { admin, password } = env();
const root = "output/private";
await mkdir(root, { recursive: true });
const manifestFile = root + "/seed-state.json";
let state: { ids: Record<string, string>; complete: boolean };
try {
  state = JSON.parse(await readFile(manifestFile, "utf8"));
} catch {
  state = { ids: {}, complete: false };
}
if (state.complete) {
  console.log("Seed telah selesai di laptop ini. Data tidak diubah.");
  process.exit(0);
}
const { data: existing, error: regionError } = await admin
  .from("regions")
  .select("id")
  .limit(1);
if (regionError)
  throw new Error(
    "Migrasi belum tersedia atau koneksi basis data gagal. Jalankan migrasi di SQL Editor dahulu.",
  );
if (existing?.length && !Object.keys(state.ids).length)
  throw new Error(
    "Backend sudah memiliki wilayah. Seed tidak dijalankan untuk mencegah perubahan data yang ada. Gunakan akun yang sudah tersedia.",
  );
async function persist() {
  await writeFile(manifestFile, JSON.stringify(state, null, 2));
}
async function id(name: string) {
  if (!state.ids[name]) {
    state.ids[name] = randomUUID();
    await persist();
  }
  return state.ids[name];
}
async function insert(
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
  conflict = "id",
) {
  const { error } = await admin
    .from(table)
    .upsert(rows, { onConflict: conflict });
  if (error)
    throw new Error(
      "Seed tabel " +
        table +
        " belum berhasil (" +
        error.code +
        "). Tidak ada secret yang ditampilkan.",
    );
}
const users: Record<string, string> = {};
const {
  data: { users: available },
  error: userError,
} = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (userError) throw new Error("Kunci server belum dapat mengakses Auth.");
for (const [role, email] of Object.entries(accounts)) {
  const existing = available.find((u) => u.email === email);
  if (existing) users[role] = existing.id;
  else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name:
          role === "admin"
            ? "Admin simulasi"
            : role === "coordinator"
              ? "Koordinator A"
              : role === "worker"
                ? "Petugas A"
                : role === "coordinatorB"
                  ? "Koordinator B"
                  : role === "workerB"
                    ? "Petugas B"
                    : role === "reporterB"
                      ? "Pelapor B"
                      : role === "reporter2"
                        ? "Pelapor kedua"
                        : "Pelapor A",
      },
    });
    if (error || !data.user)
      throw new Error(
        "Pembuatan akun demo belum berhasil. Periksa pengaturan Auth.",
      );
    users[role] = data.user.id;
  }
}
await insert(
  "profiles",
  Object.entries(users).map(([role, id]) => ({
    id,
    display_name:
      role === "admin"
        ? "Admin simulasi"
        : role === "coordinator"
          ? "Koordinator A"
          : role === "worker"
            ? "Petugas A"
            : role === "coordinatorB"
              ? "Koordinator B"
              : role === "workerB"
                ? "Petugas B"
                : role === "reporterB"
                  ? "Pelapor B"
                  : role === "reporter2"
                    ? "Pelapor kedua"
                    : "Pelapor A",
    is_admin: role === "admin",
  })),
);
const now = Date.now(),
  at = (days: number) => new Date(now + days * 86400000).toISOString();
await insert("regions", [
  {
    id: regionIds.a,
    name: "Kawasan Hijau A · Simulasi",
    coverage:
      "Pagar timur hingga taman bersama. Cakupan ilustrasi, bukan lokasi pilot.",
    owner_label: "Pengelola simulasi A",
    active: true,
    lat: -7.3,
    lng: 112.7,
  },
  {
    id: regionIds.b,
    name: "Kawasan Teduh B · Simulasi",
    coverage:
      "Zona lingkungan B. Cakupan ilustrasi untuk uji akses antarwilayah.",
    owner_label: "Pengelola simulasi B",
    active: true,
    lat: -7.31,
    lng: 112.71,
  },
  {
    id: regionIds.c,
    name: "Kawasan C · Belum terlayani",
    coverage: "Belum ada pengelola atau jadwal yang dikonfirmasi.",
    owner_label: "Belum ditetapkan",
    active: false,
    lat: -7.32,
    lng: 112.72,
  },
]);
await insert(
  "memberships",
  [
    {
      user_id: users.coordinator,
      region_id: regionIds.a,
      role: "coordinator",
      active: true,
    },
    {
      user_id: users.worker,
      region_id: regionIds.a,
      role: "worker",
      active: true,
    },
    {
      user_id: users.coordinatorB,
      region_id: regionIds.b,
      role: "coordinator",
      active: true,
    },
    {
      user_id: users.workerB,
      region_id: regionIds.b,
      role: "worker",
      active: true,
    },
  ],
  "user_id,region_id,role",
);
const point = await id("point"),
  oldIncident = await id("oldIncident"),
  currentIncident = await id("currentIncident"),
  oldTask = await id("oldTask"),
  currentTask = await id("currentTask");
await insert("points", {
  id: point,
  region_id: regionIds.a,
  label: "Titik kumpul timur · Simulasi",
  lat: -7.3002,
  lng: 112.7002,
});
await insert("incidents", [
  {
    id: oldIncident,
    region_id: regionIds.a,
    point_id: point,
    public_label: "Titik kumpul timur · Simulasi",
    status: "closed",
    observed_at: at(-13),
    verified_at: at(-12),
    closed_at: at(-11),
    reviewer_id: users.coordinator,
    created_at: at(-13),
  },
  {
    id: currentIncident,
    region_id: regionIds.a,
    point_id: point,
    public_label: "Titik kumpul timur · Simulasi",
    status: "awaiting_review",
    observed_at: at(-3),
    verified_at: at(-3),
    previous_incident_id: oldIncident,
    previous_closed_at: at(-11),
    created_at: at(-3),
  },
]);
const reportOld = await id("reportOld"),
  report1 = await id("report1"),
  report2 = await id("report2"),
  pending = await id("pending"),
  pendingB = await id("pendingB");
await insert("reports", [
  {
    id: reportOld,
    region_id: regionIds.a,
    reporter_id: users.reporter,
    incident_id: oldIncident,
    category: "Penumpukan",
    landmark: "Titik timur simulasi",
    description: "Kantong sampah simulasi dari kejadian sebelumnya.",
    observed_at: at(-13),
    created_at: at(-13),
    status: "validated",
  },
  {
    id: report1,
    region_id: regionIds.a,
    reporter_id: users.reporter,
    incident_id: currentIncident,
    category: "Penumpukan",
    landmark: "Titik timur simulasi",
    description: "Kejadian baru setelah penanganan sebelumnya, data simulasi.",
    observed_at: at(-3),
    created_at: at(-3),
    status: "validated",
  },
  {
    id: report2,
    region_id: regionIds.a,
    reporter_id: users.reporter2,
    incident_id: currentIncident,
    category: "Tempat sampah penuh",
    landmark: "Titik timur simulasi",
    description: "Laporan pendukung untuk satu kejadian yang sama, simulasi.",
    observed_at: at(-3),
    created_at: at(-3),
    status: "validated",
  },
  {
    id: pending,
    region_id: regionIds.a,
    reporter_id: users.reporter,
    category: "Sampah berserakan",
    landmark: "Dekat taman bersama · Simulasi",
    description:
      "Sampah ringan di sisi taman, menunggu validasi, data simulasi.",
    observed_at: at(-0.1),
    status: "pending",
  },
  {
    id: pendingB,
    region_id: regionIds.b,
    reporter_id: users.reporterB,
    category: "Penumpukan",
    landmark: "Lokasi privat wilayah B · Simulasi",
    description:
      "Laporan wilayah B hanya boleh dibaca pelapor B dan koordinator B.",
    observed_at: at(-0.1),
    status: "pending",
  },
]);
await insert("tasks", [
  {
    id: oldTask,
    region_id: regionIds.a,
    incident_id: oldIncident,
    worker_id: users.worker,
    status: "verified",
    due_at: at(-12),
    accepted_at: at(-12),
    action_taken: "Pengangkutan simulasi selesai diperiksa.",
    performed_at: at(-11),
    moved: true,
    destination: "TPS simulasi A",
    created_at: at(-12),
  },
  {
    id: await id("rejectedTask"),
    region_id: regionIds.a,
    incident_id: currentIncident,
    worker_id: users.worker,
    status: "rejected",
    due_at: at(-2),
    reason: "Armada simulasi belum tersedia.",
    created_at: at(-3),
  },
  {
    id: currentTask,
    region_id: regionIds.a,
    incident_id: currentIncident,
    worker_id: users.worker,
    status: "submitted",
    due_at: at(-1),
    accepted_at: at(-2),
    blocker: "Akses awal terhalang; dicatat sebagai kendala simulasi.",
    action_taken: "Sampah simulasi dikumpulkan dan diangkut.",
    performed_at: at(-0.05),
    moved: true,
    destination: "TPS simulasi A",
    created_at: at(-2),
  },
]);
async function photo(
  name: string,
  owner: string,
  link: Record<string, string>,
  label: string,
) {
  const photoId = await id(name),
    path = owner + "/" + photoId + ".jpg";
  const svg = Buffer.from(
    `<svg width="640" height="420" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="420" fill="#eaf4ed"/><path d="M0 280 Q320 230 640 285 V420 H0Z" fill="#c9dece"/><rect x="230" y="110" width="180" height="170" rx="20" fill="#166534"/><path d="M250 135h140M260 175h120M280 220h80" stroke="#fff" stroke-width="7"/><text x="320" y="335" fill="#0f172a" text-anchor="middle" font-family="sans-serif" font-size="24">DATA SIMULASI</text><text x="320" y="375" fill="#475569" text-anchor="middle" font-family="sans-serif" font-size="18">${label}</text></svg>`,
  );
  const bytes = await sharp(svg).jpeg({ quality: 85 }).toBuffer();
  const { error } = await admin.storage
    .from("evidence")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
  if (error)
    throw new Error(
      "Seed foto gagal. Periksa bucket evidence dan kunci server.",
    );
  await insert("photos", {
    id: photoId,
    owner_id: owner,
    path,
    size: bytes.length,
    mime: "image/jpeg",
    ...link,
  });
}
for (const [index, reportId] of [
  reportOld,
  report1,
  report2,
  pending,
  pendingB,
].entries())
  await photo(
    "before" + index,
    index === 2
      ? users.reporter2
      : index === 4
        ? users.reporterB
        : users.reporter,
    { report_id: reportId },
    "Ilustrasi sebelum penanganan",
  );
await photo(
  "afterOld",
  users.worker,
  { task_id: oldTask },
  "Ilustrasi sesudah penanganan",
);
await photo(
  "afterCurrent",
  users.worker,
  { task_id: currentTask },
  "Ilustrasi bukti untuk pemeriksaan",
);
const schedule = await id("schedule"),
  day = new Date().getUTCDay();
await insert("schedules", [
  {
    id: schedule,
    region_id: regionIds.a,
    service: "Lingkungan → TPS",
    zone: "Titik kumpul timur",
    weekdays: [day, (day + 2) % 7, (day + 4) % 7, (day + 6) % 7],
    start_time: "07:00",
    end_time: "09:00",
    valid_from: jakartaDate(new Date(now - 14 * 86400000)),
    valid_until: jakartaDate(new Date(now + 90 * 86400000)),
    source: "Konfirmasi pengelola simulasi A",
    confirmed_at: at(-4),
    worker_id: users.worker,
  },
  {
    id: await id("scheduleB"),
    region_id: regionIds.b,
    service: "Rencana gerobak lingkungan B",
    zone: "Zona B",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    start_time: "08:00",
    end_time: "10:00",
    valid_from: jakartaDate(),
    valid_until: jakartaDate(new Date(now + 90 * 86400000)),
    source: "Menunggu konfirmasi pengelola B",
    confirmed_at: null,
  },
]);
await insert("schedule_exceptions", {
  id: await id("exception"),
  schedule_id: schedule,
  region_id: regionIds.a,
  date: jakartaDate(new Date(now + 2 * 86400000)),
  cancelled: false,
  start_time: "10:00",
  end_time: "12:00",
  reason: "Perubahan jam satu tanggal, data simulasi.",
});
await insert("schedule_runs", {
  id: await id("run"),
  schedule_id: schedule,
  region_id: regionIds.a,
  date: jakartaDate(new Date(now - 86400000)),
  actual_at: at(-1),
  note: "Pengangkutan simulasi dicatat terlaksana.",
  actor_id: users.worker,
});
await insert("preventions", {
  id: await id("prevention"),
  region_id: regionIds.a,
  point_id: point,
  hypothesis: "Kemungkinan waktu buang tidak selaras jadwal. Perlu konfirmasi.",
  basis: "Dua kejadian berbeda dalam riwayat simulasi.",
  action: "Tinjau jadwal dan informasi titik kumpul bersama pengelola.",
  pic: "Koordinator simulasi A",
  evaluate_on: jakartaDate(new Date(now + 7 * 86400000)),
});
await insert("events", [
  {
    id: await id("event"),
    region_id: regionIds.a,
    point_id: point,
    incident_id: currentIncident,
    title: "Rawat taman bersama · Simulasi",
    location: "Taman kawasan A · Simulasi",
    starts_at: at(5),
    capacity: 2,
    pic: "Koordinator simulasi A",
    duties: "Pengumpulan dan dokumentasi; pemilahan sesuai arahan pengelola.",
    equipment: "Sarung tangan, penjepit, kantong sampah.",
    transporter: "Petugas simulasi A",
    pickup_at: at(5.1),
    destination: "TPS simulasi A",
    transport_confirmed: true,
    status: "published",
  },
  {
    id: await id("draftEvent"),
    region_id: regionIds.a,
    point_id: point,
    title: "Rencana kegiatan lanjutan · Simulasi",
    location: "Titik timur · Simulasi",
    starts_at: at(9),
    capacity: 15,
    pic: "Koordinator simulasi A",
    duties: "Pengumpulan sampah umum.",
    equipment: "Sarung tangan dan kantong.",
    transporter: "",
    destination: "",
    transport_confirmed: false,
    status: "draft",
  },
]);
await insert("notifications", {
  id: await id("notice"),
  user_id: users.coordinator,
  region_id: regionIds.a,
  message:
    "Bukti insiden simulasi menunggu pemeriksaan. Dua laporan mendukung satu kejadian.",
  entity_id: currentIncident,
});
for (const [entity, action, note, days] of [
  [
    oldIncident,
    "Selesai terverifikasi",
    "Bukti simulasi diperiksa oleh koordinator.",
    -11,
  ],
  [
    currentIncident,
    "Terverifikasi",
    "Dua laporan ditautkan ke satu kejadian.",
    -3,
  ],
  [currentIncident, "Tugas ditolak", "Armada belum tersedia, simulasi.", -2.5],
  [currentIncident, "Dikerjakan", "Penugasan ulang diterima petugas.", -2],
  [
    currentIncident,
    "Kendala",
    "Akses awal terhalang; riwayat tetap disimpan.",
    -1.5,
  ],
  [
    currentIncident,
    "Menunggu verifikasi",
    "Bukti baru diterima, belum ditutup.",
    -0.05,
  ],
] as [string, string, string, number][]) {
  const historyId = await id("history-" + action); // UUID tracked locally; history uses generated bigint.
  const { data: exists } = await admin
    .from("history")
    .select("id")
    .eq("entity_id", entity)
    .eq("action", action)
    .eq("note", note)
    .limit(1);
  if (!exists?.length) {
    const { error } = await admin.from("history").insert({
      region_id: regionIds.a,
      entity_type: "incident",
      entity_id: entity,
      actor_id:
        action === "Selesai terverifikasi" || action === "Terverifikasi"
          ? users.coordinator
          : users.worker,
      action,
      note,
      created_at: at(days),
    });
    if (error) throw new Error("Seed riwayat gagal.");
  }
  void historyId;
}
state.complete = true;
await persist();
console.log(
  "Seed Cloud selesai: dua wilayah aktif + satu belum terlayani, delapan akun, foto privat, duplikat, titik berulang, jadwal, dan kegiatan.",
);
console.log(
  "Password hanya dibaca dari DEMO_PASSWORD; tidak ditampilkan. Akun tercantum di README.",
);
