import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { userClient, storageAdmin } from "@/lib/supabase";
import { validateImage } from "@/lib/uploads";
import { checkOrigin, failure, HttpError, privateHeaders } from "@/lib/http";
import { readLimited } from "@/lib/body";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    if (Number(req.headers.get("content-length")) > 16 * 1024 * 1024)
      throw new HttpError("Unggahan terlalu besar.", 413);
    const db = await userClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new HttpError("Silakan masuk.", 401);
    const form = await new Response(await readLimited(req, 16 * 1024 * 1024), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const files = form.getAll("photos");
    if (
      files.length < 1 ||
      files.length > 3 ||
      files.some((f) => !(f instanceof File))
    )
      throw new HttpError("Gunakan 1–3 foto.", 422);
    const images = await Promise.all(
      (files as File[]).map(async (file) =>
        validateImage(Buffer.from(await file.arrayBuffer()), file.type),
      ),
    );
    const admin = storageAdmin();
    const ids: string[] = [];
    const paths: string[] = [];
    try {
      for (const bytes of images) {
        const id = randomUUID();
        const path = user.id + "/" + id + ".jpg";
        const { error } = await admin.storage
          .from("evidence")
          .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
        if (error) throw error;
        paths.push(path);
        const { error: insertError } = await admin.from("photos").insert({
          id,
          owner_id: user.id,
          path,
          size: bytes.length,
          mime: "image/jpeg",
        });
        if (insertError) throw insertError;
        ids.push(id);
      }
    } catch (error) {
      if (paths.length) await admin.storage.from("evidence").remove(paths);
      if (ids.length) await admin.from("photos").delete().in("id", ids);
      throw error;
    }
    return NextResponse.json({ ids }, { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
