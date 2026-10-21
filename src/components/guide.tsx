"use client";

import { useState } from "react";
import { BookOpen, Award, Users, FileText, ShieldCheck } from "lucide-react";
import { Card } from "./primitives";

const SUS_QUESTIONS = [
  {
    no: 1,
    q: "Saya rasa saya ingin sering menggunakan aplikasi Sampah Terhubung ini.",
    type: "positive",
  },
  {
    no: 2,
    q: "Saya mendapati aplikasi ini rumit secara tidak perlu.",
    type: "negative",
  },
  {
    no: 3,
    q: "Saya rasa aplikasi ini mudah untuk digunakan.",
    type: "positive",
  },
  {
    no: 4,
    q: "Saya rasa saya membutuhkan bantuan orang teknis untuk menggunakan sistem ini.",
    type: "negative",
  },
  {
    no: 5,
    q: "Saya melihat fungsi-fungsi dalam sistem ini terintegrasi dengan baik.",
    type: "positive",
  },
  {
    no: 6,
    q: "Saya merasa ada terlalu banyak ketidakkonsistenan pada sistem ini.",
    type: "negative",
  },
  {
    no: 7,
    q: "Saya memperkirakan sebagian besar orang akan belajar menggunakan sistem ini dengan sangat cepat.",
    type: "positive",
  },
  {
    no: 8,
    q: "Saya mendapati sistem ini sangat merepotkan untuk digunakan.",
    type: "negative",
  },
  {
    no: 9,
    q: "Saya merasa sangat percaya diri saat menggunakan aplikasi ini.",
    type: "positive",
  },
  {
    no: 10,
    q: "Saya harus mempelajari banyak hal sebelum dapat mulai menggunakan sistem ini.",
    type: "negative",
  },
];

export function GuideView() {
  const [activeTab, setActiveTab] = useState<"sus" | "roles" | "flow" | "repo">("sus");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Panduan Sistem & Rencana Evaluasi Kegunaan</h1>
        <p className="text-sm text-slate-600">Dokumentasi prototipe dan persiapan SUS, bukan laporan hasil riset. Data demo bukan bukti layanan pemerintah aktif atau integrasi DLH. Jangan masukkan data pribadi sungguhan dalam simulasi.</p>
      </header>

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
          Instrumen & Rencana SUS
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
          Rencana Alur Validasi
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
                  Belum diukur
                </div>
              </div>
              <p className="text-xs text-teal-800 mt-2 font-medium">
                Belum ada hasil pengujian yang dapat dilaporkan.
              </p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Sampel Responden
                </span>
                <div className="text-3xl font-extrabold text-slate-800 mt-1">
                  Belum ada data responden
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Jumlah dan profil responden akan dicatat saat pengumpulan data.
              </p>
            </Card>

            <Card className="p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Tingkat Keberhasilan Tugas
                </span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                  Belum diukur
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Keberhasilan tugas dan durasi belum diukur; keduanya bukan skor SUS.
              </p>
            </Card>
          </div>

          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">
                Instrumen SUS: 10 Pernyataan — Adaptasi Bahasa Indonesia
              </h3>
              <span className="text-xs text-slate-500">Metode John Brooke (1996)</span>
            </div>

            <p className="text-sm text-slate-600">Adaptasi SUS dari Brooke (1996); tim belum memvalidasi terjemahan ini. Tinjau kesetaraan makna dan keterpahaman sebelum studi. Pilih satu jawaban per butir: 1 = Sangat tidak setuju; 2 = Tidak setuju; 3 = Netral; 4 = Setuju; 5 = Sangat setuju. Ini instrumen persiapan, bukan formulir penyimpanan jawaban.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                    <th className="py-2 px-3 font-semibold w-10">No</th>
                    <th className="py-2 px-3 font-semibold">Pernyataan Evaluasi</th>
                    <th className="py-2 px-3 font-semibold w-24">Orientasi</th>
                    <th className="py-2 px-3 font-semibold w-24 text-right">Status data</th>
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
                        Belum diukur
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
                • Skor SUS per responden = Jumlah Skor Kontribusi × 2.5 (rentang 0–100).
              </p>
              <p>Skor SUS bukan persentase keberhasilan. Hitung skor tiap responden lengkap, kemudian rerata dan sebarannya; laporkan jumlah respons dan keterbatasan sampel.</p>
            </div>
          </Card>
          <Card className="p-4 space-y-3 text-sm text-slate-600">
            <h2 className="font-semibold">Rencana pengumpulan data — belum dilaksanakan</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Tetapkan kriteria rekrutmen warga, koordinator, petugas dan target sampel sebelum sesi; catat metode rekrutmen dan keterbatasan keterwakilan.</li>
              <li>Minta persetujuan sukarela dan gunakan ID anonim. Catat tanggal, perangkat, versi aplikasi dan mode demo/backend.</li>
              <li>Siapkan tugas seragam untuk peran sejenis, misalnya mencari jadwal dan mencoba laporan contoh. Setelah penggunaan, peserta mengisi 10 butir secara mandiri tanpa diarahkan.</li>
              <li>Validasi jawaban 1–5. Tandai respons tidak lengkap, keluarkan dari agregat SUS dan laporkan jumlah serta alasan pengecualian. Jangan mengisi jawaban kosong dengan angka rekaan. Simpan data anonim dan catatan perhitungan.</li>
              <li>Ukur keberhasilan dan durasi tugas secara terpisah dengan definisi sukses, awal/akhir waktu, dan aturan bantuan yang ditetapkan sebelum sesi. Laporkan jumlah percobaan, kegagalan dan durasi sesuai data.</li>
            </ol>
            <p>Rujukan: Brooke, J. (1996), “SUS: A quick and dirty usability scale”, dalam Usability Evaluation in Industry.</p>
          </Card>
        </div>
      )}

      {/* Tab Content: Roles */}
      {activeTab === "roles" && (
        <div className="grid md:grid-cols-3 gap-4">
          <p className="md:col-span-3 text-sm text-slate-600">Peran berikut adalah skenario prototipe, bukan penugasan nyata. Fitur tulis memerlukan akun, izin dan backend. Mode demo tidak membuktikan penyimpanan server; kemampuan pengelolaan berikut perlu diverifikasi pada lingkungan yang digunakan.</p>
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
              <li>Menjelajah jadwal yang tersedia; data demo bukan jadwal armada aktif.</li>
              <li>Mencoba laporan contoh; periksa lokasi pada peta karena ketelitian GPS tidak dijamin.</li>
              <li>Melihat status yang ditampilkan; status demo bukan bukti pekerjaan lapangan.</li>
              <li>Pendaftaran mengikuti status layanan pada halaman kegiatan, bukan janji kontak koordinator.</li>
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
            Rencana alur, bukan bukti audit
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Rancangan berikut bukan hasil audit independen atau bukti pengiriman armada. Implementasi dan izin tiap langkah perlu diuji pada lingkungan yang digunakan.
          </p>

          <div className="grid md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-teal-700">Tahap 1</div>
              <div className="font-bold text-slate-800 text-xs">Warga Melapor</div>
              <p className="text-[11px] text-slate-500">
                Warga menyiapkan bukti dan memeriksa lokasi; izin serta ketelitian perangkat dapat berbeda.
              </p>
            </div>

            <div className="p-3 bg-teal-50/70 rounded-lg border border-teal-200 space-y-1">
              <div className="text-[10px] uppercase font-bold text-teal-800">Tahap 2</div>
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
                Penyelesaian memerlukan bukti dan pemeriksaan; perubahan status tidak membuktikan pembersihan atau pemberitahuan kepada warga.
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
              <p>• Framework: Next.js (App Router) + TypeScript; versi tercatat di package.json.</p>
              <p>• Styling: Tailwind CSS Modern + CSS Modular Tokens</p>
              <p>• Geospatial & Maps: Leaflet Engine + OpenStreetMap Tiles</p>
              <p>• Klien Supabase tersedia; konfigurasi backend dan izin diperlukan. Ini bukan bukti audit keamanan RLS.</p>
              <p>• Periksa konfigurasi waktu pada lingkungan yang digunakan.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200">
              <div className="font-bold text-slate-800">Panduan Menjalankan Lokal:</div>
              <p className="font-mono bg-white p-2 rounded border border-slate-200">
                Dari direktori web pada salinan lokal:<br />
                npm install<br />
                npm run dev
              </p>
              <p className="text-[11px] text-slate-500">
                URL repositori publik belum diverifikasi. Gunakan salinan proyek dari pengelola. Mode demo memakai data contoh, bukan jaminan operasi luring atau persistensi server. Jangan bagikan kunci rahasia.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
