import Dashboard from "@/components/dashboard";
import type { PublicData } from "@/lib/types";
import { jakartaDate } from "@/lib/rules";
export const dynamic = "force-dynamic";

export default function Preview() {
  const now = new Date();
  const today = jakartaDate(now),
    future = jakartaDate(new Date(now.getTime() + 14 * 86400000));
  const data: PublicData = {
    regions: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        name: "Kawasan Sukabirus Asri",
        coverage:
          "Zona permukiman RW 05 hingga TPS Terpadu (Jl. Sukabirus - Dayeuhkolot).",
        active: true,
        owner_label: "Pengelola TPS Terpadu Sukabirus",
        lat: -6.974,
        lng: 107.63,
        recurrence_count: 2,
        recurrence_days: 30,
        version: 1,
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        name: "Kawasan Dayeuhkolot Bersih",
        coverage:
          "Zona permukiman Sukapura hingga tepi aliran Citarum.",
        active: true,
        owner_label: "Paguyuban Bank Sampah Mandiri",
        lat: -6.981,
        lng: 107.625,
        recurrence_count: 3,
        recurrence_days: 30,
        version: 1,
      },
    ],
    schedules: [
      {
        id: "30000000-0000-4000-8000-000000000001",
        region_id: "10000000-0000-4000-8000-000000000001",
        service: "Pengangkutan Lingkungan Rutin → TPS Terpadu",
        zone: "Zona Sukabirus RT 01-05",
        weekdays: [1, 3, 5, 6],
        start_time: "07:00",
        end_time: "09:30",
        source: "Pengelola TPS Terpadu Sukabirus",
        confirmed_at: new Date().toISOString(),
        valid_from: today,
        valid_until: future,
        version: 1,
        updated_at: new Date().toISOString(),
      },
    ],
    exceptions: [],
    runs: [
      {
        id: "run-001",
        schedule_id: "30000000-0000-4000-8000-000000000001",
        date: today,
        actual_at: new Date(now.getTime() - 3600000).toISOString(),
        note: "Armada telah selesai menyisir rute RT 01 sampai RT 05 tepat waktu.",
      },
    ],
    incidents: [
      {
        id: "40000000-0000-4000-8000-000000000001",
        public_label: "Titik Kumpul Utama Jl. Sukabirus No. 42",
        status: "awaiting_review",
        verified_at: new Date().toISOString(),
      },
      {
        id: "40000000-0000-4000-8000-000000000002",
        public_label: "Taman Warga Hijau RW 05",
        status: "closed",
        verified_at: new Date().toISOString(),
      },
      {
        id: "40000000-0000-4000-8000-000000000003",
        public_label: "Sudut Pertigaan Sukapura",
        status: "assigned",
        verified_at: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: "50000000-0000-4000-8000-000000000001",
        region_id: "10000000-0000-4000-8000-000000000001",
        point_id: null,
        incident_id: null,
        title: "Aksi Bersih Bersama & Pilah Sampah Sukabirus",
        location: "Balai Warga RW 05 Sukabirus",
        starts_at: new Date(now.getTime() + 3 * 86400000).toISOString(),
        capacity: 35,
        participants: 12,
        pic: "Bapak Hendra (Koordinator RW 05)",
        duties: "Pemilahan sampah organik rumah tangga dan pembersihan drainase.",
        equipment: "Sarung tangan, karung pilah, dan capit sampah disediakan panitia.",
        transporter: "Armada Pengangkut TPS Sukabirus",
        pickup_at: null,
        destination: "TPS Terpadu Sukabirus",
        transport_confirmed: true,
        transport_status: "confirmed",
        completion_note: null,
        version: 1,
        status: "published",
      },
      {
        id: "50000000-0000-4000-8000-000000000002",
        region_id: "10000000-0000-4000-8000-000000000001",
        point_id: null,
        incident_id: null,
        title: "Sosialisasi Komposter & Bank Sampah Mandiri",
        location: "Taman Lingkungan Sukabirus",
        starts_at: new Date(now.getTime() + 7 * 86400000).toISOString(),
        capacity: 50,
        participants: 28,
        pic: "Ibu Ratna (Penggerak Bank Sampah)",
        duties: "Praktik pembuatan pupuk kompos dari sisa makanan dan penimbangan sampah plastik.",
        equipment: "Buku catatan, botol/plastik bersih dari rumah.",
        transporter: "Bank Sampah Mandiri",
        pickup_at: null,
        destination: "Pusat Daur Ulang",
        transport_confirmed: true,
        transport_status: "confirmed",
        completion_note: null,
        version: 1,
        status: "published",
      },
    ],
  };
  return (
    <Dashboard
      configured={false}
      demo
      previewData={data}
      initialNow={now.toISOString()}
    />
  );
}
