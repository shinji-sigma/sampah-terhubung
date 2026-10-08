import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { userClient } from "@/lib/supabase";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (hash && ["signup", "email"].includes(type || "")) {
    const db = await userClient();
    const { error } = await db.auth.verifyOtp({
      token_hash: hash,
      type: type as EmailOtpType,
    });
    if (!error) return NextResponse.redirect(new URL("/?confirmed=1", req.url));
  }
  return NextResponse.redirect(new URL("/?confirmation_failed=1", req.url));
}
