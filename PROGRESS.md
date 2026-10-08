# Kemajuan dan handoff

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
