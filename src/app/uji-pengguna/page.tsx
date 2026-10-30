import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { WhatsAppInvite } from "@/components/sus-form";

import { SUS_RESPONDENT_URL } from "@/lib/sus-destination";

export const metadata: Metadata = {
  title: "Uji pengguna jarak jauh — Sampah Terhubung",
  robots: { index: false, follow: false },
};

export default function UserStudyPage() {
  return (
    <main id="main" style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 20 }}>
      <Link href="/">← Kembali ke aplikasi</Link>
      <header>
        <p className="small-muted">Studi mahasiswa · 10–15 menit · Sukarela</p>
        <h1>Mencoba Sampah Terhubung dari rumah</h1>
        <p className="notice">Tidak ada pengangkutan sampah nyata. Semua tugas berikut adalah simulasi, bukan bukti cakupan layanan di tempat tinggal Anda.</p>
      </header>
      <section className="panel">
        <h2>Cara mengakses fitur</h2>
        <p>Anda dapat langsung mencoba fitur publik tanpa persetujuan awal atau kode peserta. Ini latihan sukarela; Anda boleh berhenti kapan saja. Persetujuan evaluasi ada di Google Forms, dan kode peserta di sana opsional.</p>
        <p>Buka aplikasi dan pilih wilayah aktif <strong>Kawasan Hijau A · Simulasi</strong> melalui Ganti wilayah. Jadwal dan kegiatan dapat dilihat tanpa login. Masuk hanya untuk fitur yang memerlukan akun, seperti mengirim dan melihat laporan sendiri. Daftar dengan akun sendiri jika belum punya; jangan bagikan password atau memakai akun admin bersama.</p>
        <p>Gunakan gambar contoh yang disediakan di bawah, bukan foto pribadi. Jangan kirim GPS perangkat, alamat rumah, atau kejadian sungguhan. Laporan latihan disimpan terpisah dari jawaban Google Forms.</p>
        <Link className="button primary" href="/">Buka aplikasi</Link>
        <WhatsAppInvite />
      </section>
      <section className="panel" id="tugas">
        <h2>1. Periksa jadwal</h2>
        <p>Buka <Link href="/jadwal">Jadwal angkut</Link> tanpa login. Pilih wilayah secara manual melalui Ganti wilayah → <strong>Kawasan Hijau A · Simulasi</strong>, kemudian buka Jadwal. Cari hari dan waktu pengangkutan yang ditampilkan pada menu <strong>Jadwal angkut</strong>. Bila tidak ada jadwal, catat apa yang Anda temukan; jangan mengarang jadwal.</p>
      </section>
      <section className="panel">
        <h2>2. Kirim laporan simulasi</h2>
        <p>Buka <Link href="/laporan/baru">Buat laporan</Link>; masuk dengan akun sendiri bila diminta.</p>
        <ol>
          <li>Pilih Masuk, lalu Daftar jika belum memiliki akun. Gunakan akun sendiri, bukan akun admin bersama.</li>
          <li>Di wilayah Kawasan Hijau A · Simulasi pilih Buat laporan, lalu <strong>Gunakan bukti pendukung</strong>. Jangan pilih kamera langsung atau Lampirkan lokasi perangkat.</li>
          <li><a href="/uji-pengguna/foto-sebelum.jpg" download>Unduh gambar contoh simulasi</a>, lalu unggah sebagai bukti pendukung. Gambar contoh bukan foto kejadian nyata.</li>
          <li>Pada <strong>Lokasi atau patokan</strong>, isi “UJI-PENGGUNA — titik contoh Kawasan Hijau A”. Pada <strong>Apa yang Anda lihat?</strong>, isi “Skenario latihan, bukan kejadian nyata”. Isi <strong>Alasan menggunakan bukti pendukung</strong> dengan “Uji jarak jauh dengan gambar contoh”. Isi waktu pengamatan saat latihan.</li>
          <li>Centang <strong>Saya telah memeriksa lokasi/patokan kejadian</strong>, lalu tekan <strong>Kirim laporan</strong> satu kali. Catat referensi yang muncul pada Laporan saya.</li>
        </ol>
        <p className="notice">Di luar area? Anda tidak perlu berpindah lokasi atau mengirim GPS rumah. Gunakan patokan skenario pada jalur bukti pendukung. Jangan memalsukan koordinat perangkat, memasukkan titik 0,0, atau memilih wilayah virtual yang tidak ada. Wilayah simulasi tidak memperluas layanan nyata.</p>
        <p>Jika formulir tetap meminta lokasi yang tidak dapat Anda berikan, wilayah tidak tersedia, atau pengiriman ditolak, berhenti pada langkah itu. Catat pesan kesalahan dan tandai tugas gagal/perlu bantuan pada evaluasi. Jangan mengulang kirim atau mengganti ke data pribadi agar lolos.</p>
      </section>
      <section className="panel">
        <h2>3. Periksa status</h2>
        <p>Buka <Link href="/laporan">Laporan saya</Link> dengan akun yang digunakan untuk mengirim, cari laporan Anda, lalu periksa status dan riwayatnya. Muat ulang untuk memeriksa perubahan. Penyelenggara menjalankan peran koordinator/petugas simulasi; perubahan status tidak dijamin langsung dan bukan layanan penanganan nyata.</p>
        <p>Laporan terkirim bukan berarti terverifikasi atau selesai ditangani. Anda tidak perlu menunggu sampai selesai untuk mengisi evaluasi. Bila tindak lanjut belum ada, laporkan keadaan tersebut. <a href="/uji-pengguna/foto-sesudah.jpg" download>Gambar hasil simulasi untuk petugas uji</a> bukan bukti lapangan.</p>
      </section>
      <section className="panel">
        <h2>Terakhir, nilai pengalaman Anda</h2>
        <p>Isi evaluasi meskipun login, pengiriman, atau tugas lain gagal. Kegagalan dan kebutuhan bantuan sama pentingnya dengan keberhasilan. Pilih jawaban berdasarkan pengalaman sendiri, bukan jawaban yang diharapkan penyelenggara.</p>
        <Link className="button primary" href={SUS_RESPONDENT_URL}>Isi evaluasi SUS di Google Forms</Link>
      </section>
    </main>
  );
}
