import { notFound } from "next/navigation";
import Dashboard from "@/components/dashboard";
export default function UIHarness() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.ALLOW_UI_FIXTURES !== "true"
  )
    notFound();
  return (
    <>
      <details className="fixture-note">
        <summary>Uji antarmuka · MOCK · tidak tersimpan</summary>
        <p>
          UJI ANTARMUKA TERISOLASI — respons backend dimock oleh alat pengujian.
          Tidak ada sesi atau penyimpanan Supabase. Halaman ini tidak tersedia
          pada build produksi.
        </p>
      </details>
      <Dashboard configured demo initialNow={new Date().toISOString()} />
    </>
  );
}
