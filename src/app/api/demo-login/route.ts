import { NextResponse } from "next/server";
import { checkOrigin, failure, HttpError, privateHeaders } from "@/lib/http";
import { readLimited } from "@/lib/body";

const accounts: Record<string, string> = {
  admin: "admin@demo.invalid",
  user: "pelapor.a@demo.invalid",
};
export async function GET() {
  const enabled =
    process.env.DEMO_MODE === "true" &&
    process.env.DEMO_LOGIN_ENABLED === "true";
  return NextResponse.json(
    {
      enabled,
      available: enabled && Boolean(process.env.DEMO_PASSWORD),
    },
    { headers: privateHeaders },
  );
}

export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const enabled =
      process.env.DEMO_MODE === "true" &&
      process.env.DEMO_LOGIN_ENABLED === "true";
    if (!enabled) throw new HttpError("Demo login tidak aktif.", 404);
    if (!process.env.DEMO_PASSWORD)
      throw new HttpError(
        "Kredensial demo belum dikonfigurasi di server.",
        503,
      );
    const body: unknown = JSON.parse(
      new TextDecoder().decode(await readLimited(req, 5000)),
    );
    if (
      !body ||
      typeof body !== "object" ||
      !("role" in body) ||
      typeof body.role !== "string" ||
      !Object.hasOwn(accounts, body.role)
    )
      throw new HttpError("Peran demo tidak valid.", 422);
    return NextResponse.json(
      {
        email: accounts[body.role],
        password: process.env.DEMO_PASSWORD,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    return failure(error);
  }
}
