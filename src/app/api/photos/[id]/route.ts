import { z } from "zod";
import { userClient, storageAdmin } from "@/lib/supabase";
import { failure, HttpError, privateHeaders } from "@/lib/http";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = z.uuid().parse((await params).id);
    const db = await userClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new HttpError("Silakan masuk.", 401);
    const { data, error } = await db
      .from("photos")
      .select("path")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) throw new HttpError("Foto tidak tersedia.", 404);
    const { data: blob, error: downloadError } = await storageAdmin()
      .storage.from("evidence")
      .download(data.path);
    if (downloadError || !blob)
      throw new HttpError("Foto belum dapat dimuat.", 503);
    return new Response(await blob.arrayBuffer(), {
      headers: {
        ...privateHeaders,
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
