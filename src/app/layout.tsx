import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
export const metadata: Metadata = {
  title: "Sampah Terhubung — Koordinasi lingkungan",
  description:
    "Jadwal, laporan, dan kegiatan lingkungan yang terhubung. Lingkungan demo menggunakan data simulasi.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
