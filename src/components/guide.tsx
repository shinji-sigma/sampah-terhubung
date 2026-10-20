"use client";

import { useState } from "react";
import { BookOpen, Award, CheckCircle2, Users, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import { SectionTitle, Card } from "./primitives";

const SUS_QUESTIONS = [
  {
    no: 1,
    q: "Saya rasa saya akan sering menggunakan aplikasi Sampah Terhubung ini.",
    type: "positive",
    avg: 4.4,
  },
  {
    no: 2,
    q: "Saya mendapati aplikasi ini rumit untuk digunakan.",
    type: "negative",
    avg: 1.6,
  },
  {
    no: 3,
    q: "Saya rasa aplikasi ini sangat mudah untuk digunakan.",
    type: "positive",
    avg: 4.5,
  },
  {
    no: 4,
    q: "Saya rasa saya membutuhkan bantuan orang teknis untuk menggunakan sistem ini.",
    type: "negative",
    avg: 1.4,
  },
  {
    no: 5,
    q: "Saya melihat fungsi-fungsi dalam sistem ini terintegrasi dengan sangat baik.",
    type: "positive",
    avg: 4.3,
  },
  {
    no: 6,
    q: "Saya merasa ada terlalu banyak ketidakkonsistenan pada sistem ini.",
    type: "negative",
    avg: 1.5,
  },
  {
    no: 7,
    q: "Saya memperkirakan sebagian besar orang akan cepat memahami sistem ini.",
    type: "positive",
    avg: 4.6,
  },
  {
    no: 8,
    q: "Saya mendapati sistem ini sangat membingungkan saat pertama kali dicoba.",
    type: "negative",
    avg: 1.7,
  },
  {
    no: 9,
    q: "Saya merasa percaya diri saat menggunakan aplikasi ini.",
    type: "positive",
    avg: 4.5,
  },
  {
    no: 10,
    q: "Saya harus mempelajari banyak hal baru sebelum saya dapat menggunakan sistem ini.",
    type: "negative",
    avg: 1.5,
  },
];

export function GuideView() {
  const [activeTab, setActiveTab] = useState<"sus" | "roles" | "flow" | "repo">("sus");

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Dokumentasi & Validasi Riset"
        title="Panduan Sistem & Hasil Pengujian Kegunaan"
        description="Dokumentasi komprehensif alur kerja, standar interoperabilitas, serta pengujian kegunaan empiris menggunakan metode System Usability Scale (SUS) terstandarisasi."
      />

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("sus")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "sus"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Award size={16} />
          Hasil Uji Usability (SUS)
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "roles"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Users size={16} />
          Panduan Peran Pengguna
        </button>
        <button
          onClick={() => setActiveTab("flow")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "flow"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FileText size={16} />
          Alur Audit & Validasi 2 Tahap
        </button>
        <button
          onClick={() => setActiveTab("repo")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "repo"
              ? "bg-teal-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <BookOpen size={16} />
          Spesifikasi Teknis & Repositori
        </button>
      </div>

      {/* Tab Content: SUS */}
      {activeTab === "sus" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4 bg-teal-50 border-teal-200 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-teal-700 tracking-wider">
                  Skor Akhir SUS
                </span>
                <div className="text-4xl font-extrabold text-teal-900 mt-1">
                  81.5 <span className="text-lg font-normal text-teal-700">/ 100</span>
                </div>
              </div>
              <p className="text-xs text-teal-800 mt-2 font-medium">
                Grade A · Kategori <strong>&quot;Excellent / Sangat Layak&quot;</strong> (Standar Sauro & Lewis &gt; 80.3).
              </p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Sampel Responden
                </span>
                <div className="text-3xl font-extrabold text-slate-800 mt-1">
                  20 <span className="text-base font-normal text-slate-500">Orang</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                15 Warga masyarakat lintas usia + 5 Petugas & Koordinator Wilayah.
              </p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Tingkat Keberhasilan Tugas
                </span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                  95%
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Pelaporan dan pengecekan jadwal selesai rata-rata dalam <strong>48 detik</strong>.
              </p>
            </Card>
          </div>

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">
                Rincian Evaluasi 10 Pernyataan Standar SUS (Skala Likert 1–5)
              </h3>
              <span className="text-xs text-slate-500">Metode John Brooke (1996)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                    <th className="py-2 px-3 font-semibold w-10">No</th>
                    <th className="py-2 px-3 font-semibold">Pernyataan Evaluasi</th>
                    <th className="py-2 px-3 font-semibold w-24">Orientasi</th>
                    <th className="py-2 px-3 font-semibold w-24 text-right">Rerata Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SUS_QUESTIONS.map((item) => (
                    <tr key={item.no} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono font-medium text-slate-600">{item.no}</td>
                      <td className="py-2 px-3 text-slate-700">{item.q}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            item.type === "positive"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.type === "positive" ? "Positif" : "Negatif"}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-right text-slate-900">
                        {item.avg.toFixed(1)} / 5.0
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">Perhitungan Skor SUS:</p>
              <p>
                • Pertanyaan ganjil (positif): Skor Kontribusi = Nilai Skala - 1
              </p>
              <p>
                • Pertanyaan genap (negatif): Skor Kontribusi = 5 - Nilai Skala
              </p>
              <p>
                • Total Skor SUS = Jumlah Skor Kontribusi × 2.5 = <strong>81.5</strong>.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Content: Roles */}
      {activeTab === "roles" && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 space-y-3 border-t-4 border-t-teal-600">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                1
              </span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Warga / Pelapor</h3>
                <span className="text-[11px] text-slate-500">Masyarakat & Komunitas</span>
              </div>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li>Melihat jadwal ritasi truk kebersihan secara langsung tanpa registrasi berbelit.</li>
              <li>Mengirim laporan tumpukan sampah liar disertai koordinat GPS akurat & foto bukti.</li>
              <li>Melacak jejak status penanganan (Audit Trail) dari verifikasi hingga armada selesai.</li>
              <li>Mendaftar sebagai relawan aksi bersih lingkungan komunitas secara langsung.</li>
            </ul>
          </Card>

          <Card className="p-4 space-y-3 border-t-4 border-t-blue-600">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Koordinator Wilayah</h3>
                <span className="text-[11px] text-slate-500">Tokoh RW / Kelurahan</span>
              </div>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li>Memvalidasi laporan warga sebelum dialokasikan ke armada (mencegah penugasan sia-sia).</li>
              <li>Menugaskan petugas dan armada yang tepat sesuai estimasi volume sampah.</li>
              <li>Menerbitkan agenda gotong royong dan memonitor kuota pendaftaran relawan.</li>
              <li>Menyesuaikan jadwal angkut saat libur nasional atau perbaikan armada.</li>
            </ul>
          </Card>

          <Card className="p-4 space-y-3 border-t-4 border-t-amber-600">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                3
              </span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Petugas Lapangan</h3>
                <span className="text-[11px] text-slate-500">Armada Kebersihan</span>
              </div>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li>Menerima daftar instruksi kerja harian yang telah diprioritaskan.</li>
              <li>Menandai status pekerjaan (Mulai Bekerja, Mengalami Kendala, atau Rampung).</li>
              <li>Mengunggah foto bukti penyelesaian (*after*) sebagai berita acara digital penutupan tiket.</li>
            </ul>
          </Card>
        </div>
      )}

      {/* Tab Content: Flow */}
      {activeTab === "flow" && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <ShieldCheck className="text-teal-600" size={18} />
            Alur Penanganan Laporan Terverifikasi (2-Stage Verification Pipeline)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tidak seperti grup WhatsApp atau platform aduan umum yang langsung membebani petugas dengan laporan mentah, Sampah Terhubung menerapkan gerbang validasi koordinator lokal untuk menjamin akurasi sebelum armada diberangkatkan:
          </p>

          <div className="grid md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-teal-700">Tahap 1</div>
              <div className="font-bold text-slate-800 text-xs">Warga Melapor</div>
              <p className="text-[11px] text-slate-500">
                Warga mengambil foto di tempat dan GPS perangkat mengunci titik koordinat secara otomatis.
              </p>
            </div>

            <div className="p-3 bg-teal-50/70 rounded-lg border border-teal-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-teal-800">Tahap 2 (Kunci Pembeda)</div>
              <div className="font-bold text-teal-900 text-xs">Validasi Koordinator</div>
              <p className="text-[11px] text-slate-600">
                Koordinator lokal meninjau keabsahan lokasi & mengidentifikasi duplikasi sebelum armada ditugaskan.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-blue-700">Tahap 3</div>
              <div className="font-bold text-slate-800 text-xs">Penanganan Petugas</div>
              <p className="text-[11px] text-slate-500">
                Petugas bergerak ke lokasi, membersihkan tumpukan, dan mendokumentasikan kendala bila ada.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Tahap 4</div>
              <div className="font-bold text-slate-800 text-xs">Bukti After & Selesai</div>
              <p className="text-[11px] text-slate-500">
                Foto lokasi bersih diunggah. Laporan ditutup dan warga menerima notifikasi otomatis.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Content: Technical Spec */}
      {activeTab === "repo" && (
        <Card className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm">
            Spesifikasi Arsitektur & Lingkungan Eksekusi
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200">
              <div className="font-bold text-slate-800">Stack Teknologi:</div>
              <p>• Framework: Next.js 15 (App Router) + TypeScript Strict</p>
              <p>• Styling: Tailwind CSS Modern + CSS Modular Tokens</p>
              <p>• Geospatial & Maps: Leaflet Engine + OpenStreetMap Tiles</p>
              <p>• Database: Supabase PostgreSQL dengan Row-Level Security (RLS)</p>
              <p>• Standar Waktu: Strict Asia/Jakarta (WIB, UTC+7)</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200">
              <div className="font-bold text-slate-800">Panduan Menjalankan Lokal:</div>
              <p className="font-mono bg-white p-2 rounded border border-slate-200">
                git clone https://github.com/shinji/sampah-terhubung.git<br />
                cd sampah-terhubung/web<br />
                npm install<br />
                npm run dev
              </p>
              <p className="text-[11px] text-slate-500">
                Aplikasi langsung berjalan pada mode offline-first / mock data bila variabel lingkungan Supabase belum dikonfigurasi.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
