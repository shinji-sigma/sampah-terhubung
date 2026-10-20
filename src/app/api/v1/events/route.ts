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
          data: [
            {
              id: "ev-demo-01",
              title: "Aksi Bersih Sungai & Pemilahan Plastik Bersama",
              location: "Bantaran Sungai RW 03",
              starts_at: "2026-10-25T00:30:00.000Z",
              starts_at_wib: "25 Okt 2026, 07.30 WIB",
              capacity: 20,
              participants: 14,
              pic: "Koordinator Lingkungan RW 03",
              status: "published",
              is_open: true,
              transport_confirmed: true,
              equipment: "Sarung tangan karet, karung goni, penjepit sampah",
            },
            {
              id: "ev-demo-02",
              title: "Workshop Pengolahan Kompos Takakura",
              location: "Balai RW 04",
              starts_at: "2026-11-02T02:00:00.000Z",
              starts_at_wib: "02 Nov 2026, 09.00 WIB",
              capacity: 15,
              participants: 8,
              pic: "Kader Lingkungan Mandiri",
              status: "published",
              is_open: true,
              transport_confirmed: true,
              equipment: "Keranjang Takakura, starter bakteri, sekam",
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

    const now = new Date();
    const events = (data?.events || []).map((e: {
      id: string;
      title: string;
      location: string;
      starts_at: string;
      capacity: number;
      participants?: number;
      pic: string;
      status: string;
      transport_confirmed: boolean;
      equipment: string;
      duties: string;
    }) => {
      const isPast = new Date(e.starts_at) <= now;
      return {
        id: e.id,
        title: e.title,
        location: e.location,
        starts_at: e.starts_at,
        capacity: e.capacity,
        participants: e.participants ?? 0,
        pic: e.pic,
        status: isPast ? "completed" : e.status,
        is_open: !isPast && e.status === "published",
        transport_confirmed: e.transport_confirmed,
        equipment: e.equipment,
        duties: e.duties,
      };
    });

    return NextResponse.json(
      {
        status: "success",
        total: events.length,
        region: region || "all",
        data: events,
        timestamp: new Date().toISOString(),
      },
      { headers: apiHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal memuat agenda kegiatan.",
      },
      { status: 400, headers: apiHeaders },
    );
  }
}
