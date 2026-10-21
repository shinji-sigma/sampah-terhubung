export type EndpointName = "schedules" | "incidents" | "events";
export const MOCK_DATA = {
  schedules: [{
    id: "sch-pilot-01", service: "Pengangkutan Organik & Daur Ulang", zone: "Kawasan Permukiman RW 04",
    weekdays: [1, 3, 5], weekdays_label: ["Senin", "Rabu", "Jumat"], start_time: "07:00", end_time: "09:30",
    status: "confirmed", valid_from: "2026-10-01", valid_until: "2026-12-31", source: "Contoh simulasi, bukan data instansi",
  }],
  incidents: [{
    id: "inc-demo-02", public_label: "Pembersihan saluran drainase tersumbat kantong plastik", status: "working", verified_at: "2026-10-18T04:15:00.000Z",
  }],
  events: [{
    id: "ev-demo-01", title: "Aksi Bersih Sungai & Pemilahan Plastik Bersama", location: "Bantaran Sungai RW 03", starts_at: "2026-10-25T00:30:00.000Z",
    capacity: 20, participants: 14, status: "published", is_open: true, transport_confirmed: true, equipment: "Sarung tangan karet, karung goni, penjepit sampah",
  }],
};

export function envelope(name: EndpointName, data: unknown[], region: string | null, source: "mock_interop" | "database", timestamp = new Date().toISOString()) {
  return { status: "success", source, total: data.length, region: region ?? "all", data, timestamp };
}
