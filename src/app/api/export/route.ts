import { z } from "zod";
import { userClient } from "@/lib/supabase";
import { csv } from "@/lib/rules";
import { labels } from "@/lib/types";
import { failure, HttpError, privateHeaders } from "@/lib/http";
export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    const region = z.uuid().parse(q.get("region"));
    const from = z.iso.date().parse(q.get("from"));
    const until = z.iso.date().parse(q.get("until"));
    if (from > until) throw new HttpError("Periode tidak sah.", 422);
    const db = await userClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new HttpError("Silakan masuk.", 401);
    const { data: allowed } = await db.rpc("has_role", {
      r: region,
      wanted: "coordinator",
    });
    if (!allowed)
      throw new HttpError("Ekspor dibatasi wilayah koordinator.", 403);
    const { data, error, count } = await db
      .from("incidents")
      .select("id,public_label,status,verified_at,closed_at", {
        count: "exact",
      })
      .eq("region_id", region)
      .gte("verified_at", from + "T00:00:00+07:00")
      .lt(
        "verified_at",
        new Date(
          Date.parse(until + "T00:00:00+07:00") + 86400000,
        ).toISOString(),
      )
      .order("verified_at")
      .limit(1000);
    if (error) throw error;
    if ((count ?? 0) > 1000)
      throw new HttpError(
        "Persempit periode ekspor hingga maksimal 1000 insiden.",
        422,
      );
    const rows: unknown[][] = [
      [
        "Lingkungan",
        process.env.DEMO_MODE !== "false"
          ? "Data simulasi"
          : "Data operasional",
      ],
      ["Periode WIB", from, until],
      [
        "Definisi",
        "Satu baris = satu insiden tervalidasi dalam periode, bukan jumlah laporan. Identitas dan kontak tidak disertakan.",
      ],
      [
        "ID insiden",
        "Patokan publik",
        "Status",
        "Validasi",
        "Pemeriksaan selesai",
      ],
      ...(data ?? []).map((i) => [
        i.id,
        i.public_label,
        labels[i.status] || i.status,
        i.verified_at,
        i.closed_at,
      ]),
    ];
    return new Response(csv(rows), {
      headers: {
        ...privateHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="ringkasan-wilayah.csv"',
      },
    });
  } catch (error) {
    return failure(error);
  }
}
