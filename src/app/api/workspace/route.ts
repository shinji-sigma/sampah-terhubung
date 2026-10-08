import { NextResponse } from "next/server";
import { z } from "zod";
import { userClient } from "@/lib/supabase";
import { failure, HttpError, privateHeaders } from "@/lib/http";
export async function GET(req: Request) {
  try {
    const db = await userClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new HttpError("Silakan masuk.", 401);
    const region = z.uuid().parse(new URL(req.url).searchParams.get("region"));
    const lists = [
      ["profiles", "profiles"],
      ["memberships", "memberships"],
      ["regions", "regions"],
      ["points", "points"],
      ["reports", "reports"],
      ["incidents", "incidents"],
      ["tasks", "tasks"],
      ["feedback", "feedback"],
      ["schedules", "schedules"],
      ["exceptions", "schedule_exceptions"],
      ["runs", "schedule_runs"],
      ["preventions", "preventions"],
      ["events", "events"],
      ["registrations", "registrations"],
      ["photos", "photos"],
      ["history", "history"],
      ["notifications", "notifications"],
    ];
    const data = await Promise.all(
      lists.map(async ([key, table]) => {
        let query = db
          .from(table)
          .select(
            table === "photos" ? "id,owner_id,report_id,task_id,event_id" : "*",
            { count: "exact" },
          );
        if (
          ![
            "profiles",
            "memberships",
            "regions",
            "registrations",
            "photos",
            "notifications",
          ].includes(table)
        )
          query = query.eq("region_id", region);
        if (table === "notifications")
          query = query
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
        if (table === "history")
          query = query.order("created_at", { ascending: false });
        const { data, error, count } = await query.limit(1000);
        if (error) throw error;
        if ((count ?? 0) > 1000)
          throw new HttpError(
            "Data terlalu banyak untuk cakupan demo ini. Ringkasan tidak ditampilkan agar jumlah tidak terpotong.",
            422,
          );
        return [key, data];
      }),
    );
    const result = Object.fromEntries(data);
    result.profile = result.profiles.find(
      (p: { id: string }) => p.id === user.id,
    );
    if (!result.profile) throw new HttpError("Profil belum tersedia.", 503);
    return NextResponse.json(result, { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
