import { NextResponse } from "next/server";
import { z } from "zod";
import { configured, userClient } from "@/lib/supabase";

const apiHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
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
              id: "inc-demo-01",
              public_label: "Penumpukan limbah sayur dan kardus basah pasca pasar",
              status: "pending",
              status_label: "Menunggu validasi koordinator",
              verified_at: "2026-10-19T02:30:00.000Z",
              verified_at_wib: "19 Okt 2026, 09.30 WIB",
              progress: 20,
            },
            {
              id: "inc-demo-02",
              public_label: "Pembersihan saluran drainase tersumbat kantong plastik",
              status: "working",
              status_label: "Sedang ditangani petugas",
              verified_at: "2026-10-18T04:15:00.000Z",
              verified_at_wib: "18 Okt 2026, 11.15 WIB",
              progress: 65,
            },
            {
              id: "inc-demo-03",
              public_label: "TPS liar sudut Jalan Kenanga",
              status: "closed",
              status_label: "Selesai terverifikasi",
              verified_at: "2026-10-16T01:00:00.000Z",
              verified_at_wib: "16 Okt 2026, 08.00 WIB",
              progress: 100,
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

    const incidents = (data?.incidents || []).map((i: {
      id: string;
      public_label: string;
      status: string;
      verified_at: string;
    }) => ({
      id: i.id,
      public_label: i.public_label,
      status: i.status,
      verified_at: i.verified_at,
    }));

    return NextResponse.json(
      {
        status: "success",
        total: incidents.length,
        region: region || "all",
        data: incidents,
        timestamp: new Date().toISOString(),
      },
      { headers: apiHeaders },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal memuat feed insiden publik.",
      },
      { status: 400, headers: apiHeaders },
    );
  }
}
