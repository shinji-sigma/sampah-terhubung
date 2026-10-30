# Kemajuan dan handoff

## Checkpoint autofill demo login presentasi — 30 Oktober 2026

Persetujuan eksplisit pengguna: tombol autofill "Admin Demo" (`admin@demo.invalid`) dan "User Demo" (`pelapor.a@demo.invalid`) untuk presentasi kompetisi. Fitur ini berpagar ganda pada server (`DEMO_MODE=true` dan `DEMO_LOGIN_ENABLED=true`), dilindungi origin checker dan pembatas payload body, serta hanya mengisi isian input tanpa auto-submit atau bypass autentikasi. Kredensial dibaca dari konfigurasi server (`DEMO_PASSWORD`), tidak di-commit atau dicetak ke log.

Verifikasi yang dilakukan:
- Unit & contract test `tests/demo-login.test.ts` (100% pass): verifikasi matriks gate (mode/enabled toggles), proteksi origin (403), role allowlist (422), fallback password absen (503), dan header `private, no-store`.
- Playwright headless browser check `scripts/demo-login-browser.mjs` pada viewport desktop 1440×900 dan mobile 360×900: autofill kedua tombol terverifikasi mengisi input form, tidak ada permintaan HTTP `/api/auth` sebelum klik tombol submit manual, dan tidak ada overflow horizontal. Screenshot dan log tersimpan di `output/demo-login/`.
- Seluruh 71 tes lokal lulus, `eslint` 0 error, `tsc` lulus tanpa error, dan `npm run build` sukses.
- Tidak ada database reset atau reseed dijalankan. Belum dilakukan git push atau deploy Vercel sesuai instruksi.



Baseline bersih `541a2ad`; perbaikan utama `9d67c3a`, kode akhir `0f9d055` menutup heading tiga fallback terakhir. Reviewer dan Security benar-benar berjalan paralel, kemudian membaca diff dan menguji ulang snapshot yang sama. Perbaikan mencakup izin jadwal SQL NULL, waktu bukti/nonfinite, notifikasi petugas nonaktif, proyeksi jadwal privat, cache error, sesi habis, heading dan recovery API. Migrasi tambahan `202610100003_audit_controls.sql` belum diterapkan ke Cloud; 001/002 dan data lama dipertahankan.

Lint/typecheck/build produksi, 31/31 tes lokal, 41/41 probe SQL independen dan 13 pemeriksaan HTTP lulus. Bukti browser dan skor/batas terbaru: `docs/audit/RINGKASAN_AUDIT.md`, `REVIEW_KODE_UI_UX.md`, `SECURITY_REVIEW.md`, `output/audit/`. Catatan lama berikut adalah riwayat, bukan hasil audit saat ini.

Backend Cloud masih kosong menurut boolean. Preview produksi audit berada pada port 3004; port 3000 tidak disentuh. Penerimaan P0/P1 dengan layanan nyata, demo dua laptop, email, foto/izin Cloud dan restore belum selesai. Langkah berikut tetap konfigurasi proyek pengujian sintetis sesuai `docs/SUPABASE_CLOUD.md`, clone kedua `D:\WebDemo`, tanpa Docker. Tidak ada push/deploy, mutasi Cloud, atau perubahan PRD/riset/logo sumber/Personal AI.

## Checkpoint hero dan navbar terpilih — 9 Oktober 2026

Revisi di atas baseline `268136b` memakai navbar horizontal, hero publik/pelapor, ilustrasi ImageGen mandiri, kalender lime dan palet petrol–gading–sage–lime–violet. Menu operasional dipertahankan. Detail dan batas: `docs/KEPUTUSAN_VISUAL_HERO.md`, `design-qa.md`, dan `output/hero-design`. Checkpoint visual lama di bawah merupakan riwayat; ketentuan penghapusan hero sudah digantikan oleh pilihan pengguna terbaru.

Lint, typecheck, build dan 26 tes lokal lulus. Browser produksi dan fixture peran terisolasi diperiksa pada desktop/ponsel; pengujian Cloud belum dapat dijalankan karena boolean konfigurasi masih kosong. Petunjuk `D:\WebDemo` tanpa Docker tetap berlaku. Tidak ada push/publikasi; PRD, riset dan Personal AI tetap dipertahankan.

## Checkpoint revisi desain — 9 Oktober 2026

Revisi atas baseline `8f1d1ff` selesai pada aplikasi yang sama: beranda wilayah/jadwal, logo asli SHINFRAME, daftar penanganan dengan referensi berbeda, jadwal berbentuk baris, pemilih wilayah, kegiatan dan tampilan peran. Backend/API/RLS dan dependency dipertahankan. Lint/typecheck/build dan **26 tes lokal** lulus; bukti sebelum/sesudah desktop 1440×1000 dan ponsel 360×800 tersedia pada [REVISI_DESAIN.md](docs/REVISI_DESAIN.md). Jadwal pertama terlihat di layar awal ponsel; tidak ada overflow pada view yang diperiksa. Fixture tetap terisolasi dan HTTP 404 pada produksi.

**Supabase Cloud belum teruji.** Pemeriksaan boolean terbaru masih menunjukkan URL/key/password demo belum tersedia. Langkah pemilik dan handoff Cloud di bawah tetap berlaku, termasuk clone laptop kedua `D:\WebDemo` tanpa Docker. Tidak ada push, publikasi, atau perubahan pada PRD/riset/Personal AI. Catatan 8 Oktober berikut mempertahankan hasil checkpoint sebelumnya.

## Checkpoint implementasi sebelumnya

Checkpoint 8 Oktober 2026. Implementasi dilakukan hanya di `D:\Project\Lomba_UIN\web`, branch lokal `codex/sampah-terhubung-local`. PRD, riset dan desain sumber dipertahankan; Personal AI tidak diubah. Belum ada remote, push atau deployment.

## Status

Kode P0 dan P1, migrasi RLS/RPC, seed Data simulasi dua wilayah aktif + satu belum terlayani, formulir/status, foto privat, jadwal, moderasi/pemberitahuan, pencegahan/kegiatan, ringkasan/CSV, dokumentasi dan skrip uji Cloud sudah disiapkan. Lint/typecheck/build dan 24 tes lokal lulus. Preview dan beberapa alur UI dengan mock diuji pada desktop/360 px. Detail: docs/HASIL_UJI.md dan docs/FITUR_PRD.md.

**Penerimaan akhir P0/P1 belum selesai.** `.env.local` sudah disiapkan dari template dengan APP_ORIGIN port 3001, tetapi URL dan semua key/password masih kosong atau placeholder. Auth, database, upload foto dan izin akses belum diverifikasi dengan Supabase Cloud sungguhan. Mock hanya tersedia pada dev harness terpisah; `/ui-test` HTTP 404 pada produksi. Runtime produksi lokal aktif di `http://localhost:3001`; `/preview` hanya contoh statis tanpa akun/penyimpanan.

## Langkah pemilik yang diperlukan sekarang

1. Buat atau pilih proyek Supabase Cloud khusus simulasi melalui dashboard. Pemilik sendiri memilih plan dan menyimpan password database; tidak perlu mengirim nilai credential dalam chat.
2. Jalankan migrasi `202610080001_core.sql`, lalu `202610080002_notifications.sql` satu kali pada proyek kosong.
3. Isi template `.env.local` yang sudah disiapkan: URL/publishable key/kunci server/DEMO_PASSWORD secara privat; DEMO_MODE=true, APP_ORIGIN=http://localhost:3001 untuk laptop pengembangan. Tambahkan redirect http://localhost:3001/** dan http://localhost:3000/** bila laptop kedua memakai 3000. Jangan menimpa konfigurasi yang sudah Anda isi dengan template lagi.
4. Beri tahu di chat bahwa konfigurasi sudah diisi; cukup status, jangan nilai. Lanjutkan dengan `check:env`, seed, restart/build, lalu integrasi Cloud dan browser nyata.

Petunjuk lengkap dan tabel setiap variabel: docs/SUPABASE_CLOUD.md. Kedua laptop memakai proyek Cloud yang sama. Docker tidak diperlukan. Laptop kedua memakai clone di `D:\WebDemo`, `npm ci`, konfigurasi privat lokal, `npm run build`, `npm start`; jangan seed ulang.

## Urutan untuk melanjutkan implementasi

1. Periksa keberadaan konfigurasi lewat skrip boolean. Jangan membaca/menampilkan `.env.local` ke output tool. Pastikan proyek itu simulasi sebelum seed.
2. Jalankan seed sekali. Manifest privat memungkinkan melanjutkan kegagalan parsial; jangan reset backend atau menimpa data operasional. Skrip menolak proyek berisi data tanpa manifest miliknya.
3. Restart aplikasi dengan APP_ORIGIN yang sama dengan alamat browser. Uji integrasi pada terminal kedua; hasil tanpa secret di output/private/cloud-integration.json. Tinjau pembersihan ID hasil uji jika gagal.
4. Uji browser Cloud: pelapor A laporan+foto → koordinator A validasi/duplikat → petugas A terima/kendala/bukti → koordinator perbaikan/verifikasi → pelapor tanggapan. Uji B tidak bisa membaca data/foto/CSV A melalui endpoint langsung. Uji dua tab penerimaan tugas dan kursi terakhir kegiatan.
5. Uji jadwal normal/perubahan satu tanggal/aktual, titik berulang yang membedakan reopen, pencegahan/evaluasi, kegiatan draf/transport/daftar/batal/bukti, moderasi dan pemberitahuan. Uji signup publik dan konfirmasi email pada alamat uji milik pemilik.
6. Jalankan aplikasi di laptop kedua D:\WebDemo dengan backend yang sama; buktikan data perubahan terlihat setelah refresh. Ukur waktu muat dan uji jaringan peta gagal. Catat hasil sebenarnya pada HASIL_UJI.md.
7. Latihan pemulihan basis data dan foto di proyek terpisah sebelum pilot; jangan menyatakan NF08 selesai sebelum latihan. Publikasi online tetap deliverable berikutnya yang memerlukan instruksi pemilik.

## Batas dan proses lokal

P2 tidak diterapkan. Batas data 1.000 baris, editor kegiatan sederhana dan kompresi foto pada server dijelaskan di FITUR_PRD.md. Belum ada rate limiting operasional, realtime atau hosting online. Jangan menyebut versi ini layanan publik yang siap pilot.

Server produksi lokal dimulai melalui `npm start -- --port 3001`, hanya pada 127.0.0.1. Port 3000 sudah dimiliki proses lain dan tidak dihentikan. Bila server berhenti setelah sesi Codex, jalankan perintah tersebut lagi dari folder web. Setelah mengisi konfigurasi, hentikan **server proyek ini** dan build/restart untuk memuat env; jangan menghentikan proses aplikasi lain.
