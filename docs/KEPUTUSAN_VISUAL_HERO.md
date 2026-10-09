# Keputusan visual hero — 9 Oktober 2026

Addendum ini menerapkan pilihan terbaru pengguna pada aplikasi yang ada, di atas baseline `268136b`. Sumber visual: `D:\Project\Lomba_UIN\desain\eksplorasi-2026-10-09\gabungan-hero.png` dan `KONSEP_GABUNGAN_HERO.md`. Keputusan ini menggantikan ketentuan visual lama tentang penghapusan hero, sidebar warga, dan palet hijau lama. PRD, riset, proposal, daftar pustaka dan dokumen desain sumber tetap dipertahankan; addendum ini menjadi bahan penyelarasan dokumen formal oleh pemilik.

## Komposisi dan identitas

Navbar putih horizontal menggunakan logo asli SHINFRAME, nama Sampah Terhubung, empat menu warga, serta akun/pemberitahuan mengikuti keadaan aplikasi. Logo tetap rasio 3:1: 180 px desktop dan 140 px ponsel. Salinan `public/brand/shinframe.png` ikut repository dan memiliki hash yang sama dengan sumber pengguna. Favicon tetap dipertahankan.

Menu ponsel dibuka melalui tombol **Buka navigasi**; Escape menutup dan mengembalikan fokus. Untuk koordinator/petugas, desktop memisahkan identitas/akun dan menu ke dua baris agar semua menu operasional tetap tersedia. Tidak ada menu peran yang dihapus.

Hero hanya muncul pada beranda publik/pelapor. Judul dan paragraf memakai teks HTML sesuai prompt. **Lihat jadwal wilayah** membuka jadwal, atau pemilihan wilayah bila belum tersedia. Keterangan akun berubah menjadi **Anda sudah masuk untuk melapor.** pada sesi pelapor. Jadwal, formulir, kegiatan dan ruang kerja langsung menampilkan kebutuhan masing-masing.

Desktop yang diukur memiliki hero sekitar 327 px. Di 360×800, hero sekitar 222 px, ilustrasi disembunyikan, dan nama wilayah serta tanggal/jam pertama terlihat. Nama wilayah boleh membungkus tanpa dipotong. Kalender pertama memakai lime dan tanggal besar; jadwal berikutnya menjadi baris lebih tenang. Sumber jadwal ada pada kolom pendukung desktop dan disclosure keyboard. Waktu publik insiden tetap diberi label **Validasi**; referensi dua insiden tetap berbeda.

## Token dan makna

Makna berikut adalah keputusan identitas proyek, bukan klaim psikologi warna universal.

| Token | Warna | Penggunaan dan makna |
| --- | --- | --- |
| Petrol | `#193C38` | Judul/identitas; tanggung jawab dan kepedulian lingkungan |
| Jade | `#235E52` | Aksi/tautan; tindakan nyata |
| Gading | `#F7F5EF` | Latar dominan; kehangatan dan keterbukaan |
| Sage | `#DDECE7` | Informasi pendukung; keseimbangan dan lingkungan terawat |
| Lime | `#D5E675` | Tanggal dan CTA terpilih; energi partisipasi, dengan teks petrol |
| Violet | `#6758B5` | Aksen navigasi; keterhubungan digital dan kolaborasi |
| Teks utama | `#172C29` | Isi utama |
| Teks pendukung | `#4E625C` | Metadata/keterangan |
| Putih | `#FFFFFF` | Navbar dan permukaan informasi |

Token terpusat pada `src/app/globals.css`; alias lama jade menjaga konsistensi halaman operasional. Amber, merah, hijau, dan biru status tetap berlabel sesuai makna sebelumnya. Tidak ada tulisan putih pada lime. Font sistem dipertahankan: isi 16 px, metadata 14 px, hero 52 px desktop dan sekitar 30–32 px ponsel, judul bagian utama 24–28 px. Judul informasi pendukung lebih kecil sesuai hierarki.

## Aset ilustrasi

Ilustrasi mandiri dibuat melalui ImageGen bawaan dengan mockup terpilih sebagai referensi. Adegan editorial memperlihatkan warga dengan ponsel, petugas menangani sampah, dan koordinator dengan tablet. Caption **Ilustrasi koordinasi lingkungan** membedakannya dari bukti lapangan. Tidak ada logo, teks UI, mitra atau statistik nyata di dalam aset.

- Runtime: `public/illustrations/coordination.webp`, 1000×447, **89.304 byte (87,2 KiB)**.
- Arsip asli: `output/imagegen/hero-coordination.png`, 1875×839. Prompt dan asal tersedia pada `output/imagegen/hero-coordination.provenance.json`.
- Encoding menggunakan Sharp, WebP quality 85, tanpa crop atau komposit ulang.
- `getImageProps` Next.js membentuk srcset; dimensi gambar stabil. Source picture hanya cocok pada lebar ≥901 px. Ponsel tanpa source yang cocok tidak meminta gambar desktop.
- Respons optimizer yang diamati pada slot desktop (`w=640`, `q=75`) tercatat **32.092 byte (31,3 KiB)** melalui event jaringan browser. Ukuran ini bergantung pada ukuran slot, density, format dan cache; bukan ukuran universal semua perangkat.
- Mockup penuh tidak masuk aset runtime. Semua aset runtime tersimpan di aplikasi dan ikut clone laptop kedua.

## Motion

Kelompok teks dan tombol masuk dengan opacity/translateY 8 px selama 240 ms. Ilustrasi 300 ms dengan jeda 40 ms. Ponsel memakai 200 ms untuk kelompok teks. Tidak ada library animasi tambahan, gerak berulang, animasi tinggi hero atau scroll reveal jadwal.

Pilihan entrance dibekukan selama mount dan dicatat pada dashboard; perubahan data/wilayah serta kembali ke beranda tidak mengulang entrance. `prefers-reduced-motion: reduce` langsung memakai opacity 1, tanpa animasi/transform. Konten SSR tetap terbaca saat JavaScript dinonaktifkan; kontrol aplikasi yang memerlukan JavaScript tetap memerlukan pemuatan skrip.

Pembungkus loading pada tingkat halaman dihapus setelah screenshot tanpa JavaScript menunjukkan fallback streaming menutupi isi. Halaman kini dirender langsung oleh server; indikator pemuatan informasi wilayah, peta dan submit tetap tersedia. Bukti gagal dan sesudah perbaikan disimpan terpisah pada laporan QA.

## Bukti dan batas

Screenshot sebelum/sesudah ada pada `output/hero-design/before` dan `after`: desktop 1440×1024, ponsel 360×800 dan 390×844. Perbandingan gabungan/fokus serta hasil penilaian tersedia pada `design-qa.md`. Antarmuka koordinator, petugas, pelapor, formulir dan kegiatan berisi diuji lewat fixture berlabel MOCK pada dev harness, tanpa penyimpanan backend.

Lint, typecheck, build dan 26 tes lokal lulus. Pengujian produksi mencakup keyboard, reduced motion, isi tanpa JavaScript, serta simulasi latency 150 ms, downlink 200 KiB/detik, uplink 100 KiB/detik, CPU 4× dan cache browser dinonaktifkan. Setelah skrip siap, navigasi tetap berfungsi; klik sangat dini sebelum hidrasi belum menunjukkan perubahan halaman. Angka 783 ms hanya waktu sampai kontrol terlihat menurut otomasi, **bukan** waktu sampai siap interaksi, LCP atau bukti NF07. Tidak ada klaim 60 fps atau pengujian HP fisik.

Total file JS produksi pada `.next/static/chunks`: 813.697 → 816.490 byte mentah, gzip per file dijumlahkan 247.687 → 248.449 byte (**+762 byte gzip**). CSS: 29.759 → 37.466 byte, gzip 6.837 → 8.123 byte (**+1.286 byte gzip**). Ini seluruh chunks build, bukan payload satu route atau jumlah transfer jaringan. Gambar dihitung terpisah. JSON dan skrip pengukuran tersimpan di `output/hero-design`.

API, autentikasi, RLS, privasi, aturan operasional, dependency dan fixture guard tidak diubah. Produksi `/ui-test` tetap 404; API tanpa konfigurasi 503. Pemeriksaan `.env.local` hanya melalui boolean: konfigurasi Cloud belum terisi. Auth, database, foto privat, isolasi wilayah dengan backend sungguhan dan sinkronisasi laptop kedua **belum diuji**. Panduan `docs/SUPABASE_CLOUD.md` tetap berlaku untuk `D:\WebDemo`, tanpa Docker. Tidak ada push atau publikasi.
