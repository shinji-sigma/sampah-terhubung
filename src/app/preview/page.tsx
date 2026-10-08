import Dashboard from "@/components/dashboard";
import type { PublicData } from "@/lib/types";
import { jakartaDate } from "@/lib/rules";
export const dynamic = "force-dynamic";
export default function Preview() {
  const now = new Date();
  const today = jakartaDate(now),
    future = jakartaDate(new Date(now.getTime() + 7 * 86400000));
  const data: PublicData = {
    regions: [
      {
        id: "10000000-0000-4000-8000-000000000001",
        name: "Kawasan Hijau A · Simulasi",
        coverage:
          "Zona permukiman A, pagar timur hingga taman bersama (cakupan ilustrasi).",
        active: true,
        owner_label: "Pengelola simulasi A",
        lat: -7.3,
        lng: 112.7,
        recurrence_count: 2,
        recurrence_days: 30,
        version: 1,
      },
    ],
    schedules: [
      {
        id: "30000000-0000-4000-8000-000000000001",
        region_id: "10000000-0000-4000-8000-000000000001",
        service: "Pengangkutan lingkungan → TPS",
        zone: "Zona A · titik kumpul timur",
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        start_time: "07:00",
        end_time: "09:00",
        source: "Pengelola simulasi A",
        confirmed_at: new Date().toISOString(),
        valid_from: today,
        valid_until: future,
        version: 1,
        updated_at: new Date().toISOString(),
      },
    ],
    exceptions: [],
    runs: [],
    incidents: [
      {
        id: "40000000-0000-4000-8000-000000000001",
        public_label: "Titik kumpul sisi timur · Simulasi",
        status: "awaiting_review",
        verified_at: new Date().toISOString(),
      },
      {
        id: "40000000-0000-4000-8000-000000000002",
        public_label: "Taman bersama · Simulasi",
        status: "closed",
        verified_at: new Date().toISOString(),
      },
    ],
    events: [],
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
