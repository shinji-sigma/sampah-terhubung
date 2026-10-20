import { NextResponse } from "next/server";
import { z } from "zod";
import { configured, userClient } from "@/lib/supabase";

const apiHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: apiHeaders });
}

export async function GET(req: Request) {
  try {
    if (!configured()) {
      return NextResponse.json(
        {
          status: "success",
          source: "mock_interop",
          message: "Mode pratinjau interoperabilitas (Backend offline/unconfigured)",
          data: [
            {
              id: "sch-pilot-01",
              service: "Pengangkutan Organik & Daur Ulang",
              zone: "Kawasan Permukiman RW 04",
              weekdays: [1, 3, 5],
              weekdays_label: ["Senin", "Rabu", "Jumat"],
              start_time: "07:00",
              end_time: "09:30",
              status: "confirmed",
              valid_from: "2026-10-01",
              valid_until: "2026-12-31",
              source: "Dinas Lingkungan Hidup / SIMPAN Daerah",
            },
            {
              id: "sch-pilot-02",
              service: "Pengangkutan Anorganik & Residu",
              zone: "Kawasan Komersial & Sentra Kuliner",
              weekdays: [2, 4, 6],
              weekdays_label: ["Selasa", "Kamis", "Sabtu"],
              start_time: "08:00",
              end_time: "10:30",
              status: "confirmed",
              valid_from: "2026-10-01",
              valid_until: "2026-12-31",
              source: "Koordinator Wilayah Swadaya",
            },
          ],
        },
        { headers: apiHeaders },
      );
    }

    const db = await userClient();
    const raw = new URL(req.url).searchParams.get("region");
    const region = raw ? z.string().uuid().parse(raw) : null;
    const { data, error } = await db.rpc("public_region_data", { r: region });
    if (error) throw error;

    const weekdayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    const formatted = (data?.schedules || []).map((s: {
      id: string;
      service: string;
      zone: string;
      weekdays: number[];
      start_time: string;
      end_time: string;
      valid_from: string;
      valid_until: string;
      source: string;
      confirmed_at: string | null;
    }) => ({
      id: s.id,
      service: s.service,
      zone: s.zone,
      weekdays: s.weekdays,
      weekdays_label: s.weekdays.map((w: number) => weekdayNames[w] || String(w)),
      start_time: s.start_time,
      end_time: s.end_time,
      status: s.confirmed_at ? "confirmed" : "tentative",
      valid_from: s.valid_from,
      valid_until: s.valid_until,
      source: s.source,
    }));

    return NextResponse.json(
      {
        status: "success",
        total: formatted.length,
        region: region || "all",
        data: formatted,
        timestamp: new Date().toISOString(),
      },
      { headers: apiHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal memuat jadwal terbuka.",
      },
      { status: 400, headers: apiHeaders },
    );
  }
}
