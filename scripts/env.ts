import { createClient } from "@supabase/supabase-js";
export function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    secret =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    password = process.env.DEMO_PASSWORD;
  if (!url || url.includes("YOUR_PROJECT") || !publishable || !secret)
    throw new Error(
      "Isi URL, publishable key, dan kunci server di .env.local. Nilai tidak ditampilkan.",
    );
  if (process.env.DEMO_MODE !== "true")
    throw new Error(
      "Skrip demo hanya untuk proyek Data simulasi (DEMO_MODE=true).",
    );
  if (!password || password.length < 12)
    throw new Error(
      "Isi DEMO_PASSWORD pilihan sendiri, minimal 12 karakter, di .env.local.",
    );
  return {
    url,
    publishable,
    secret,
    password,
    admin: createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}
export const accounts = {
  reporter: "pelapor.a@demo.invalid",
  reporter2: "pelapor.2@demo.invalid",
  coordinator: "koordinator.a@demo.invalid",
  worker: "petugas.a@demo.invalid",
  coordinatorB: "koordinator.b@demo.invalid",
  workerB: "petugas.b@demo.invalid",
  reporterB: "pelapor.b@demo.invalid",
  admin: "admin@demo.invalid",
};
export const regionIds = {
  a: "10000000-0000-4000-8000-000000000001",
  b: "10000000-0000-4000-8000-000000000002",
  c: "10000000-0000-4000-8000-000000000003",
};
