# Deployment dan pemulihan

Deployment online belum dilakukan. Runtime lokal dan demo dua laptop memakai Node.js + Supabase Cloud; Docker tidak diperlukan.

## Menjalankan build lokal

Ikuti SUPABASE_CLOUD.md untuk migrasi dan `.env.local`. Di folder aplikasi jalankan `npm ci`, `npm run check:env`, `npm run build`, lalu `npm start`. Gunakan alamat localhost sesuai APP_ORIGIN; jalankan skrip seed hanya pada laptop persiapan dan proyek simulasi kosong. Laptop kedua menggunakan proyek yang sama dan cukup login.

## Checklist deployment server berikutnya

1. Tentukan host Node yang mendukung Next.js dan Sharp, serta domain HTTPS. Ini memerlukan instruksi publikasi/akun dari pemilik; belum ada layanan yang dibuat.
2. Pasang lockfile dengan `npm ci`. Simpan nilai konfigurasi pada pengelola secret host, bukan Git. URL/publishable key bersifat publik; secret key hanya untuk proses server. DEMO_MODE tetap true untuk demo.
3. Set APP_ORIGIN ke origin HTTPS sebenarnya. Isi Site URL dan Redirect URLs Supabase untuk domain tersebut; gunakan alamat callback `/auth/confirm` bila memakai template token_hash. Atur SMTP dan template konfirmasi untuk pendaftaran pengguna umum, lalu uji email konfirmasi nyata. Jangan menganggap akun seed terkonfirmasi membuktikan pengiriman email.
4. Jalankan lint/typecheck/test/build, lalu jalankan server Next.js. Sajikan lewat HTTPS dan proxy sesuai panduan host. Pastikan limit request proxy menerima maksimal 3 foto 5 MB plus multipart; server tetap membatasi 16 MB total. Jangan mencache `/api/workspace`, foto privat, sesi atau respons pengguna.
5. Pastikan `/ui-test` 404 pada build produksi. Jalankan integrasi Cloud pada backend simulasi dahulu. Lakukan skenario browser per peran, endpoint langsung, serta demo dua laptop sebelum mengubah label status menjadi siap demo.
6. Siapkan backup dan lakukan latihan restore di proyek terpisah sebelum pilot. Untuk layanan umum, tinjau pembatasan laju unggahan/login, retensi foto tak terpakai, monitoring dan kebijakan pengelola. Ini belum menjadi layanan publik yang dikeraskan.

## Backup

Backup database Supabase tidak menyertakan isi berkas Storage; kedua bagian harus dicadangkan. Periksa ketersediaan backup pada plan proyek yang Anda pilih, bukan menganggap semua proyek memiliki fitur yang sama. [Dokumentasi backup resmi](https://supabase.com/docs/guides/platform/backups).

1. Tentukan waktu jeda penulisan; catat waktu, versi commit dan migrasi terakhir. Jangan backup ketika petugas masih mengunggah foto sehingga data dan berkas tidak sinkron.
2. Ambil backup basis data melalui opsi yang tersedia di dashboard. Bila tidak tersedia, gunakan logical backup PostgreSQL sesuai panduan resmi dengan `pg_dump` pada komputer administrasi. Simpan password koneksi melalui pengelola credential/PGPASSFILE yang privat, bukan argumen terminal. Sertakan skema aplikasi, Auth dan kebijakan/trigger khusus; CSV ringkasan bukan backup.
3. Salin seluruh objek bucket privat `evidence` melalui Storage API atau alat S3 yang dikonfigurasi privat. Pertahankan path lengkap, ukuran dan SHA-256 setiap berkas. Cadangkan metadata `photos` bersama database. Jangan mempublikasikan bucket untuk mempermudah backup.
4. Simpan arsip terenkripsi di lokasi privat terpisah dari laptop demo. Simpan konfigurasi URL redirect, SMTP dan bucket tanpa menyalin secret ke catatan publik. Atur retensi dan siapa yang dapat memulihkan bersama pengelola.

## Latihan pemulihan (belum dijalankan)

1. Gunakan proyek kosong khusus latihan yang dibuat dengan persetujuan pemilik. Jangan melakukan restore ke backend demo yang sedang dipakai.
2. Ikuti [restore backup dashboard](https://supabase.com/docs/guides/platform/migrating-within-supabase/dashboard-restore) atau [backup/restore logical resmi](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) sesuai jenis arsip. Tinjau diagnostik restore; jangan mengabaikan error tanpa mengetahui objek yang gagal. Jangan menjalankan migrasi pembuat tabel lagi di atas skema yang sudah dipulihkan.
3. Pulihkan objek foto ke path yang sama pada bucket privat `evidence`, serta konfigurasi limit JPEG 5 MB dan kebijakan baca. Bandingkan daftar path/ukuran/hash dengan manifest backup; metadata Storage saja tidak memulihkan foto.
4. Pulihkan pengaturan Auth/redirect/SMTP secara terpisah. Gunakan URL dan key proyek latihan di `.env.local` latihan; restart/rebuild aplikasi. Akun/UUID harus sesuai hubungan profiles, memberships, reports dan history; jangan sekadar membuat ulang akun dengan UUID berbeda.
5. Bandingkan jumlah baris dan hubungan: laporan–insiden, tugas–petugas, foto–entitas, history, jadwal/pengecualian/aktual, serta registrasi kegiatan. Buka minimal satu bukti asli sesudah restore dan cocokkan hash.
6. Uji login tiap peran, baca lintas wilayah yang harus ditolak, endpoint foto tanpa sesi, dan satu alur laporan sampai verifikasi. Simpan hasil/waktu/commit secara privat. NF08 baru dapat dinyatakan lulus setelah basis data **dan foto** berhasil dipulihkan dan aksesnya diuji.

Panduan ini menyiapkan langkah operasional, tetapi bukan bukti bahwa backup/restore atau deployment sudah berhasil. Tidak ada perubahan akun Cloud, pembelian, atau publikasi yang dilakukan dalam implementasi ini.
