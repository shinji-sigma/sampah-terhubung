import { NextResponse } from "next/server";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function checkOrigin(req: Request) {
  if (
    req.headers.get("origin") !==
    (process.env.APP_ORIGIN || "http://localhost:3000")
  )
    throw new HttpError("Asal permintaan tidak diizinkan.", 403);
}
export function failure(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: "Periksa isian yang ditandai.",
        fields: Object.fromEntries(
          error.issues.map((i) => [i.path.at(-1), i.message]),
        ),
      },
      { status: 422 },
    );
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  return NextResponse.json(
    { error: "Layanan belum tersedia. Periksa koneksi lalu coba lagi." },
    { status: 503 },
  );
}
export const privateHeaders = { "Cache-Control": "private, no-store" };
