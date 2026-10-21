import { NextResponse } from "next/server";
import { z } from "zod";
import { configured, userClient } from "@/lib/supabase";
import { MOCK_DATA, envelope, type EndpointName } from "./contracts";

export const apiHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  // userClient may use session cookies; never share/cache its response or errors.
  "Cache-Control": "private, no-store",
};
export function preflight() {
  return new Response(null, { status: 204, headers: apiHeaders });
}
const weekdayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
interface PublicRow {
  id: string;
  service: string; zone: string; weekdays: number[]; start_time: string; end_time: string;
  valid_from: string; valid_until: string; source: string; confirmed_at: string | null;
  public_label: string; status: string; verified_at: string | null;
  title: string; location: string; starts_at: string; capacity: number; participants?: number;
  transport_confirmed: boolean; equipment: string;
}
// Explicit public allowlists: do not spread rows that may contain personnel/contact fields.
function project(name: EndpointName, row: PublicRow) {
  if (name === "incidents") return { id: row.id, public_label: row.public_label, status: row.status, verified_at: row.verified_at };
  if (name === "schedules") return {
    id: row.id, service: row.service, zone: row.zone, weekdays: row.weekdays,
    weekdays_label: row.weekdays.map(w => weekdayNames[w] ?? String(w)),
    start_time: row.start_time, end_time: row.end_time, status: row.confirmed_at ? "confirmed" : "tentative",
    valid_from: row.valid_from, valid_until: row.valid_until, source: row.source,
  };
  const isPast = new Date(row.starts_at).getTime() <= Date.now();
  const participants = row.participants ?? 0;
  return {
    id: row.id, title: row.title, location: row.location, starts_at: row.starts_at,
    capacity: row.capacity, participants, status: isPast && row.status === "published" ? "completed" : row.status,
    is_open: !isPast && row.status === "published" && participants < row.capacity,
    transport_confirmed: row.transport_confirmed, equipment: row.equipment,
  };
}

export async function publicGet(req: Request, name: EndpointName) {
  const raw = new URL(req.url).searchParams.get("region");
  const parsed = raw === null ? null : z.string().uuid().safeParse(raw);
  if (parsed && !parsed.success) return NextResponse.json({ status: "error", message: "Parameter region harus berupa UUID valid." }, { status: 400, headers: apiHeaders });
  const region = parsed?.success ? parsed.data : null;
  if (!configured()) {
    // Fixtures have no real region membership: a real region filter must not return them.
    const data = region ? [] : MOCK_DATA[name];
    return NextResponse.json(envelope(name, data, region, "mock_interop"), { headers: apiHeaders });
  }
  try {
    const db = await userClient();
    const readRegion = async (r: string | null) => {
      const { data, error } = await db.rpc("public_region_data", { r });
      if (error) throw error;
      return data;
    };
    let rows: PublicRow[];
    if (region) rows = (await readRegion(region))?.[name] ?? [];
    else {
      // SQL public_region_data uses region_id=r, not an optional filter.
      const index = await readRegion(null);
      const ids = [...new Set<string>((index?.regions ?? []).map((r: { id: string }) => r.id))];
      rows = [];
      for (const id of ids) rows.push(...((await readRegion(id))?.[name] ?? []));
    }
    const data = rows.map(row => project(name, row));
    return NextResponse.json(envelope(name, data, region, "database"), { headers: apiHeaders });
  } catch {
    return NextResponse.json({ status: "error", message: "Layanan data sementara tidak tersedia." }, { status: 503, headers: apiHeaders });
  }
}
