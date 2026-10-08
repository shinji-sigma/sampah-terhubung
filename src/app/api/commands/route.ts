import { NextResponse } from "next/server";
import { userClient } from "@/lib/supabase";
import { validateCommand } from "@/lib/validation";
import { checkOrigin, failure, HttpError, privateHeaders } from "@/lib/http";
import { readLimited } from "@/lib/body";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const raw = new TextDecoder().decode(await readLimited(req, 30000));
    const { p, request_key } = validateCommand(JSON.parse(raw));
    const db = await userClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new HttpError("Silakan masuk.", 401);
    const { data, error } = await db.rpc("command", { p, request_key });
    if (error)
      throw new HttpError(
        ["42501", "40001", "22023", "P0001"].includes(error.code)
          ? error.message
          : "Isian tidak sah atau hubungan data sudah berubah.",
        error.code === "42501" ? 403 : error.code === "40001" ? 409 : 422,
      );
    return NextResponse.json(data, { headers: privateHeaders });
  } catch (error) {
    return failure(error);
  }
}
