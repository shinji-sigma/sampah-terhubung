import { NextResponse } from "next/server";
import { z } from "zod";
import { configured, userClient } from "@/lib/supabase";
import { failure, privateHeaders } from "@/lib/http";
export async function GET(req: Request) {
  try {
    if (!configured())
      return NextResponse.json(
        { error: "Backend belum dikonfigurasi.", setup: true },
        { status: 503, headers: privateHeaders },
      );
    const db = await userClient();
    const raw = new URL(req.url).searchParams.get("region");
    const region = raw ? z.uuid().parse(raw) : null;
    const { data, error } = await db.rpc("public_region_data", { r: region });
    if (error) throw error;
    return NextResponse.json(data, { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
