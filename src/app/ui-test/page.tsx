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
      <p className="notice bad">
        UJI ANTARMUKA TERISOLASI — respons backend dimock oleh alat pengujian.
        Tidak ada sesi atau penyimpanan Supabase. Halaman ini tidak tersedia
        pada build produksi.
      </p>
      <Dashboard configured demo initialNow={new Date().toISOString()} />
    </>
  );
}
