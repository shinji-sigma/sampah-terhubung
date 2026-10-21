# Pengujian Langgam dan persiapan rilis — 13 Oktober 2026

Pengembangan/pengujian dilakukan di `LAPTOP-6OQ8DJT5`, `D:\WebDemo`, branch `codex/report-evidence-auth`, memakai ponytail. Tidak ada deployment, migrasi Cloud, seed/reset, perubahan PRD/riset/Personal AI, atau pembelian dalam pekerjaan ini. Bukti di `output/qa-report-evidence/20261013/` tidak memuat kredensial.

## Tiga keadaan yang berbeda

| Bagian            | Keadaan yang diperiksa                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Kode lokal        | Basis `b8a8253` ditambah perbaikan kaitan foto penyelesaian dan tes dalam commit yang memuat dokumen ini. Build produksi lokal pada `http://localhost:3001`.                                           |
| URL online stabil | `https://sampah-terhubung-langgamramadhan9-3266.vercel.app/`, kode `28dadddaaa8245466fab78aedca56ca99b3d844c`, deployment `dpl_ATqNF5bbjh14TNQsiWcmZFvcvgbD`. Masih form laporan lama.                 |
| Database aktif    | Supabase simulasi **sampah-terhubung-demo**, ref **jrozalhfgmzpxvpvzgcf**, skema 001–004. Kolom `reports.evidence_mode` dan `photos.source` belum ada, kode error **42703**. **005 belum diterapkan.** |

Kandidat hosting yang sudah ada sebelum perbaikan ini adalah `https://sampah-terhubung-1jfmkx0pj-langgamramadhan9-3266.vercel.app/` (`dpl_5N3hJNbB7jxiagHiXoHnw2kgfQcc`, Ready). Kandidat ini belum memuat perbaikan foto dalam commit sekarang dan tidak dianggap rilis akhir. Pemeriksaan hosting baca-saja memastikan proyek `sampah-terhubung`, `prj_wvSxAQAkl0gh6prrhg7R8Uk9xg5L`, scope `langgamramadhan9-3266`, Node 24.x, dan integrasi Git tidak aktif; push branch tidak otomatis menjadi deployment pada konfigurasi yang diperiksa.

## Alur nyata pada versi online 004

Akun **Langgam · Pelapor** tetap login di Chrome laptop utama. Satu laporan dibuat lewat UI dengan penanda `Uji Langgam 13 Okt 2026 · SIMULASI QA`; foto adalah JPEG sintetis 640×480 dan lokasi adalah pin ilustrasi yang dipilih manual, **bukan kamera/GPS fisik**.

1. Laporan `e0af48aa-14c3-400f-adea-51eb488b481a` tersimpan pending, foto `db3cfba3-7cb3-4214-bca6-03fb722481d4` milik Langgam tertaut dengan benar; koordinat tersimpan.
2. Koordinator A memverifikasi melalui HTTPS API dengan sesi akun demo independen. Insiden `ade00a13-9b26-432c-874f-00299635e99d` dibuat.
3. Koordinator menugaskan petugas A; pengulangan request key menghasilkan satu tugas `82b8833f-16e8-45c3-96ff-39db6edd22d7`.
4. Petugas menerima: dua permintaan bersamaan menghasilkan **200 dan 409**, lalu status working.
5. Petugas mengunggah foto JPEG nyata ke bucket privat: `69b99bf3-108c-4432-b30e-ae5285590441`. Bukti pengangkutan tanpa tujuan ditolak **422** tanpa mengubah status; setelah tujuan simulasi diisi menjadi awaiting_review.
6. Koordinator meninjau dan menutup. Browser Langgam dimuat ulang dan menampilkan **Selesai terverifikasi** serta riwayat enam tahap. Pembaruan antar-sesi terjadi setelah refresh; bukan bukti realtime atau tiga perangkat fisik.

Pelapor dan hasil akhirnya diuji lewat browser. Tahap koordinator/petugas pada pengujian ini dijalankan melalui API sungguhan, bukan klik semua form peran. Data sintetis dipertahankan untuk pemeriksaan; laporan retry terpisah `e03e6152-d2d2-43fd-90dd-835efc2302d1` ditolak dengan alasan QA setelah tes, tidak dihapus. Skrip `scripts/verify-active-demo.ts` hanya untuk satu laporan pending dengan penanda tersebut: **jangan dijalankan ulang pada laporan yang sudah diproses**.

## Pembatasan akses dan retry pada Cloud sungguhan

**12 kelompok lulus** dalam `active-cloud-api.json`:

- Enam sesi Auth/HTTP independen sah; origin asing **403**, sesi akun uji yang logout **401**. Ini tidak menguji menunggu expiry token alamiah.
- Laporan pending/fotonya tidak terbaca lewat RLS, proxy foto **404**, atau download Storage oleh pelapor lain, koordinator B, petugas A yang belum ditugaskan, dan petugas B. Tanpa sesi proxy **401**; bucket evidence privat/no-store.
- Penulisan tabel langsung ditolak. Pelapor, petugas, dan koordinator wilayah B tidak dapat memvalidasi; penugasan ke petugas B ditolak **403**.
- Penerimaan hanya untuk petugas yang ditugaskan; penutupan hanya koordinator A. Percobaan pelapor/petugas/koordinator B ditolak **403**.
- Dua `report.create` bersamaan dengan request key sama, dilanjutkan retry, menghasilkan **satu ID/baris**. Payload berbeda dengan key sama ditolak **409**. Respons dianggap hilang oleh klien penguji; tidak memutus jaringan fisik.
- Wilayah C nonaktif ditolak **422**, foto milik Langgam yang dipalsukan pada akun lain ditolak API **403** / RPC langsung **42501**, tanpa baris laporan terlarang.

## Kegagalan yang ditemukan dan perbaikan lokal

Pada browser online, status dan riwayat selesai terlihat tetapi foto petugas tidak muncul di kartu pelapor. Akses foto sendiri sah: Langgam membuka endpoint foto petugas dan gambar termuat 640×480. Penyebab: UI mencari hubungan foto → tugas → insiden, sementara RLS menyembunyikan rincian tugas dari pelapor.

Perbaikan API lokal membaca foto dan insiden dengan sesi pengguna terlebih dahulu. Hanya ID tugas dari foto yang sudah lolos RLS dipakai untuk membaca pasangan ID tugas/insiden di server. Respons menambahkan `photos[].incident_id` hanya untuk insiden yang terlihat di wilayah workspace. Tidak mengirim worker_id, alasan, atau rincian tugas tambahan; tidak mengubah kebijakan RLS. Tampilan Laporan saya dan detail beranda menggunakan kaitan minimal ini.

- **Dua tes unit baru** memeriksa kaitan foto tanpa rincian privat, tanpa menambah foto atau mengaitkan insiden tersembunyi.
- **Dua pemeriksaan baca Cloud** dalam `photo-context.cloud.json`: pelapor demo mendapat foto petugas tetapi nol baris tugas; kaitan baru benar dengan query nyata, tanpa mutasi. Ini menguji query dan helper, **bukan seluruh HTTP route baru**, yang masih menunggu 005.
- **Empat regresi browser MOCK**: kartu pelapor menampilkan foto sebelum/sesudah meskipun tasks kosong; foto insiden lain tidak tampil; emulasi 390px tidak overflow; detail beranda menampilkan bukti sesudah. Screenshot desktop/ponsel bertanda `.mock.png`.
- Hambatan upload Chrome teratasi setelah pengguna mengaktifkan akses file URL ekstensi sendiri. Kegagalan fixture background diperbaiki dengan menyimulasikan `document.hidden` beserta visibilityState; skrip regresi ponsel diperbaiki untuk membuka menu navigasi. Keduanya perbaikan harness, bukan klaim bug produksi.

## Pengujian kegagalan lokal / emulasi

`chrome-recovery.mock.json`: **11 kelompok lulus**, memakai backend, kamera canvas dan geolocation sintetis. Capture/retake/use melepas track; snapshot perangkat terpisah dari pin; accuracy rendah ditampilkan; jalur pendukung menyertakan alasan. Izin kamera ditolak, kamera sibuk/tidak tersedia, GPS ditolak/timeout, network abort dan 401 memiliki jalur pemulihan. Retry mempertahankan teks, ID foto dan request key; login akun sama memulihkan draf dalam memori; background menghentikan stream tanpa membuang foto terpilih. Ini bukan izin OS nyata, gangguan seluler, atau expiry alamiah.

**42/42 tes lokal**, lint, typecheck, dan build produksi lulus setelah perbaikan. Tes SQL memakai PGlite dengan Auth/Storage tiruan. Tidak ada dependensi baru. Hasil lama 40 tes bertambah dua tes konteks foto. Integrasi penuh kode baru berhenti di preflight **42703** sebelum Auth/Storage/mutasi karena 005 belum tersedia; tidak dinyatakan lulus.

## Migrasi 005, kompatibilitas dan pemulihan

Target yang telah disebutkan sebelum tindakan: **sampah-terhubung-demo / jrozalhfgmzpxvpvzgcf**, khusus simulasi. File `supabase/migrations/202610120005_report_evidence.sql` tidak diubah dalam perbaikan ini.

- Satu transaksi menambah dua kolom foto dan tujuh kolom laporan nullable. Data lama mempertahankan NULL/sumber tidak dicatat; tidak dibuat seolah-olah berasal dari kamera/GPS.
- Gateway audited 004 dipertahankan sebagai fungsi privat; operasi selain report.create tetap memakai aturan lama. Report baru memerlukan mode/konfirmasi, snapshot lengkap pada direct, foto camera_web milik sendiri, atau alasan supporting. Constraint membatasi koordinat, tanggal, nilai nonfinite, dan kelengkapan snapshot.
- Receipt lama tetap dapat diretry sebelum aturan metadata baru diperiksa. **Form online lama yang membuat laporan baru akan ditolak setelah 005**; migrasi perlu dikoordinasikan dengan kandidat kode baru yang siap dipromosikan.
- Rollback `supabase/rollback/005_restore_gateway.sql` mengembalikan gateway 004 dan mempertahankan laporan/foto/kolom. Kebijakan bukti baru sementara tidak berlaku. PGlite membuktikan kompatibilitas baris lama, validasi, receipt/RLS dan rollback; belum ada rollback/restore Cloud yang dilakukan.
- Jangan mengulang 001–004, seed, atau menjalankan ulang 005 setelah rollback tanpa meninjau fungsi/kolom yang tetap ada. Siapkan backup privat sebelum tindakan Cloud; jangan menyatakan backup tersedia tanpa bukti.

SHA256 005: `7e88fba2a81a8480382c6d5b7ecd0e4bf39111d2f86611c976fa7a7f88d6bd81`.
SHA256 rollback: `04984eb412a7d01b05631f300e7e7b951c82908492054ae641f46aa824d536c0`.

## Rilis yang menunggu konfirmasi

Repository privat **shinji-sigma/sampah-terhubung**, branch **codex/report-evidence-auth**; pilih SHA commit pengujian ini, bukan kandidat lama. Target deployment **SHINJI_SERVER**, **D:\WebDemo\project\lombauin**, proyek Vercel **sampah-terhubung** / scope **langgamramadhan9-3266**. Semua pengembangan dan pengujian utama tetap pada laptop pertama.

Setelah pengguna mengonfirmasi repository, target dan tindakan rilis:

1. Server fetch/pull commit yang ditentukan dengan pemeriksaan perubahan lokal terlebih dahulu; jangan reset/menimpa env. Verifikasi SHA dan konfigurasi privat tanpa menampilkan nilai. Password demo server sebelumnya tidak cocok; pakai konfigurasi akun yang telah terbukti di laptop utama melalui transfer privat, tanpa reset/seed.
2. Dari server, stage kandidat untuk commit baru tanpa mengubah URL stabil; catat ID/URL/SHA Ready. Periksa variabel runtime dan target sebelum mutasi. Kandidat yang ada sebelum perbaikan ini tidak cukup.
3. Sesudah kandidat siap, backup dan terapkan **hanya 005**, atomik pada ref yang ditentukan. Verifikasi kolom/fungsi, receipt lama dan data; catat hasil aktual.
4. Di **laptop utama**, jalankan `npm run test:integration` terhadap build lokal terbaru/Cloud, termasuk direct/supporting, Auth, Storage, RLS dan alur peran. Jalankan smoke API kandidat dengan Origin produksi yang sah tanpa melemahkan guard. Jika gagal, lakukan pemulihan yang telah disetujui; jangan promote.
5. Setelah integrasi lulus, **server** promote kandidat yang sama ke URL stabil; ulangi browser nyata pada URL stabil. Simpan bukti dan batas tes, jangan mengklaim HP fisik dari emulasi. Tidak membeli layanan/domain.

## Batas yang masih terbuka

005 dan integrasi HTTP baru belum diverifikasi di Cloud, perbaikan foto belum online, kandidat rilis baru belum dibuat, signup/konfirmasi email nyata, expiry alamiah, kamera/GPS Android/iOS fisik, koneksi seluler, tiga perangkat bersamaan dan backup/restore Cloud belum diuji. Refresh antar-sesi sudah dibuktikan; realtime tidak diimplementasikan. Draf tidak bertahan setelah reload/tutup tab; orphan upload akibat pembatalan belum dibersihkan otomatis.

Bukti utama: `active-cloud-api.json`, `cloud-schema-before.json`, `photo-context.cloud.json`, `chrome-recovery.mock.json`, `langgam-report-pending.cloud.jpg`, `langgam-report-closed.cloud.jpg`, `langgam-worker-photo-access.cloud.jpg`, dan `reporter-result-{desktop,phone}.mock.png`.
