import { NextResponse } from "next/server";
import { z } from "zod";
import { userClient } from "@/lib/supabase";
import { checkOrigin, failure, HttpError, privateHeaders } from "@/lib/http";
import { readLimited } from "@/lib/body";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const p = z
      .object({
        action: z.enum(["login", "signup", "logout"]),
        email: z.email().optional(),
        password: z
          .string()
          .min(12, "Password minimal 12 karakter.")
          .max(128)
          .optional(),
        display_name: z.string().trim().min(3).max(80).optional(),
      })
      .parse(
        JSON.parse(new TextDecoder().decode(await readLimited(req, 5000))),
      );
    const db = await userClient();
    if (p.action === "logout") {
      const { error } = await db.auth.signOut({ scope: "local" });
      if (error)
        throw new HttpError(
          "Belum dapat keluar. Periksa koneksi dan coba lagi.",
          503,
        );
      return NextResponse.json(
        { message: "Anda telah keluar." },
        { headers: privateHeaders },
      );
    }
    if (!p.email || !p.password)
      throw new HttpError("Email dan password wajib diisi.", 422);
    if (p.action === "signup") {
      const { error } = await db.auth.signUp({
        email: p.email,
        password: p.password,
        options: {
          data: { display_name: p.display_name || "Pelapor" },
          emailRedirectTo:
            (process.env.APP_ORIGIN || "http://localhost:3000") +
            "/auth/confirm",
        },
      });
      if (error)
        throw new HttpError(
          "Pendaftaran belum berhasil. Periksa email, password, atau coba lagi nanti.",
          422,
        );
      return NextResponse.json(
        {
          message:
            "Periksa email untuk konfirmasi akun, lalu masuk. Peran awal adalah pelapor.",
        },
        { headers: privateHeaders },
      );
    }
    const { error } = await db.auth.signInWithPassword({
      email: p.email,
      password: p.password,
    });
    if (error)
      throw new HttpError(
        "Email atau password tidak sesuai, atau akun belum dikonfirmasi.",
        401,
      );
    return NextResponse.json(
      { message: "Berhasil masuk." },
      { headers: privateHeaders },
    );
  } catch (error) {
    return failure(error);
  }
}
