# PRD — pemantapan menjelang pengumpulan UINIC

Tanggal: 21 Oktober 2026. Acuan: guidebook resmi lokal dan 11 masukan dosen dari pengguna.

## Sasaran
Membuktikan alur, interoperabilitas, aksesibilitas, dan kelengkapan submission; bukan sekadar mengganti kosmetik. Pertahankan perubahan lokal yang belum di-commit dan jangan menghapus data Cloud.

## Urutan
1. Audit kode dan jalankan test/lint/typecheck/build sebagai baseline.
2. Perbaiki gap terukur, mulai dari loading Beranda yang memakai kelas utility tanpa stylesheet utility.
3. Uji browser produksi lokal pada 390 piksel dan rute langsung; cek header/API tanpa membocorkan data privat.
4. Review independen terhadap 11 poin dosen, lalu catat gap yang tersisa.
5. Deployment hanya dari source terverifikasi; jangan mengklaim versi online berubah sebelum verifikasi.

## Penerimaan perbaikan loading
- Loading mempunyai indikator teks untuk pembaca layar dan status aria-busy.
- Placeholder memakai CSS yang benar-benar tersedia, bukan kelas Tailwind tanpa Tailwind.
- Lebar 390 piksel tidak overflow, animasi mengikuti reduced-motion.
- Tidak menampilkan pesan kosong sebelum permintaan data selesai.

## Bukti dan batas
Baseline saat ini: 46 tes lulus, lint/typecheck/build lulus. Cloud .env lokal belum mempunyai URL valid menurut check:env; jangan menafsirkan build sebagai bukti koneksi Cloud. SUS harus berdasarkan responden nyata, tidak dibuat-buat. Repository lokal belum memiliki remote; publikasi dan sinkronisasi laptop kedua perlu diverifikasi terpisah.
