# Demo online dari laptop kedua

URL demo: https://sampah-terhubung-langgamramadhan9-3266.vercel.app

Semua perintah persiapan, build, tes, push dan deployment dijalankan dari `D:\WebDemo`. Repository privat: https://github.com/shinji-sigma/sampah-terhubung. Histori memuat perbaikan audit `0f9d055` dan laporan `7461875`. Personal AI, PRD, riset dan checkout laptop utama tidak diubah.

## Backend dan hosting

- Vercel project `sampah-terhubung`, scope `langgamramadhan9-3266`, paket **Hobby**. URL produksi stabil publik; URL deployment/preview tetap memakai Vercel Authentication. Tidak ada domain/paket berbayar dibeli.
- Supabase organisasi **Sampah Terhubung Demo**, **Free**, project `sampah-terhubung-demo`, ref `jrozalhfgmzpxvpvzgcf`, Nano, Mumbai. Hanya data simulasi. Docker tidak diperlukan.
- Migrasi 001–003 berhasil diterapkan melalui SQL Editor, kemudian **004** memperbaiki kode konflik bisnis menjadi `PT409`. Semua migrasi lama dan data dipertahankan. SQL Editor tidak mencatat histori migrasi CLI otomatis; jangan mengulang pembuat tabel 001 pada database ini.
- Delapan akun dan dataset simulasi telah di-seed. Jangan menjalankan seed ulang untuk memakai demo pada perangkat lain.
- `.env.local`, konfigurasi CLI, artefak privat dan output tes dikecualikan dari Git/unggahan kode. Runtime Vercel memakai URL/publishable key, tepat satu server key, `DEMO_MODE=true`, dan origin produksi. `DEMO_PASSWORD` hanya lokal.
- GitHub app Vercel belum dipasang; push GitHub saja belum melakukan redeploy. Gunakan CLI dari laptop kedua.

## Masuk dari kedua laptop dan HP

Buka URL demo yang sama melalui browser. Tidak perlu clone, Node atau Docker untuk mengakses demo online. Pilih Masuk dan gunakan akun berikut; semuanya memakai password pada **DEMO_PASSWORD di `D:\WebDemo\.env.local`**. Baca nilainya sendiri secara privat; jangan mengirim file/kunci/password ke chat atau Git.

| Peran | Email |
| --- | --- |
| Pelapor wilayah A | pelapor.a@demo.invalid |
| Pelapor kedua A | pelapor.2@demo.invalid |
| Koordinator A | koordinator.a@demo.invalid |
| Petugas A | petugas.a@demo.invalid |
| Pelapor B | pelapor.b@demo.invalid |
| Koordinator B | koordinator.b@demo.invalid |
| Petugas B | petugas.b@demo.invalid |
| Admin simulasi | admin@demo.invalid |

Gunakan sesi browser terpisah untuk setiap peran. Pelapor mengirim laporan dengan foto; koordinator memvalidasi dan menugaskan; petugas menerima lalu mengirim bukti; koordinator memeriksa dan menutup. Muat ulang pada sesi/perangkat lain untuk memperoleh data terbaru. Ini berbagi backend Cloud, tanpa push realtime otomatis. `/preview` tetap pratinjau statis dan tidak membuktikan data backend.

## Menjalankan checkout lokal

Node yang diperiksa: 24.21.0; npm 11.19.0. Dari PowerShell:

```powershell
Set-Location D:\WebDemo
npm ci
npm run check:env
npm run build
npm start -- --port 3001
```

Buka http://localhost:3001. Port 3000 milik aplikasi lain dipertahankan. Server lokal hanya mendengarkan pada 127.0.0.1; perangkat lain menggunakan URL HTTPS online.

Untuk clone baru di `D:\WebDemo`, clone repository privat menggunakan akses GitHub sendiri; jangan menimpa perubahan lokal. `.env.local` tidak ikut clone. Salin `.env.example`, lalu isi konfigurasi secara privat melalui dashboard proyek simulasi yang sama. Jangan seed ulang pada backend yang sudah disiapkan.

## Konfigurasi privat

| Variabel | Isi |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | URL proyek simulasi |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Publishable key proyek tersebut |
| SUPABASE_SECRET_KEY | Server secret, atau alternatif legacy di bawah; tepat satu |
| SUPABASE_SERVICE_ROLE_KEY | Alternatif legacy; jangan isi keduanya |
| DEMO_MODE | true |
| APP_ORIGIN | http://localhost:3001 untuk lokal; origin HTTPS stabil untuk hosting |
| DEMO_PASSWORD | Password akun seed/integration, minimal 12 karakter, hanya lokal |

Konfigurasi laptop kedua dan hosting sudah tersedia. Auth Site URL sudah diarahkan ke demo HTTPS. Redirect konfirmasi email yang telah tersimpan dan terverifikasi pada dashboard adalah `http://localhost:3001/auth/confirm` dan `https://sampah-terhubung-langgamramadhan9-3266.vercel.app/auth/confirm`. Kedua URL didaftarkan persis tanpa wildcard. Login akun demo yang sudah dikonfirmasi tidak bergantung pada pengiriman email baru.

Untuk backend baru kosong, jalankan keempat SQL di `supabase/migrations` menurut nama, isi env, lalu `npm run demo:seed` sekali. Seed memakai Auth/Storage sungguhan dan `defaultToNull:false` agar insert bulk mempertahankan default database.

## Pengujian

```powershell
Set-Location D:\WebDemo
npm test
npm run lint
npm run typecheck
npm run test:integration
```

32 tes lokal, lint, typecheck dan build lulus. Tes PostgreSQL lokal memakai PGlite dengan Auth/Storage tiruan; hasil itu terpisah dari verifikasi Cloud.

14 pemeriksaan integrasi nyata lulus pada Cloud dengan server lokal, lalu lulus kembali pada URL produksi HTTPS (commit kode 28daddd; deployment dpl_ATqNF5bbjh14TNQsiWcmZFvcvgbD, Ready). Pemeriksaan ini mencakup Auth/sesi HTTP, upload JPEG dan penolakan SVG, bucket privat, idempotensi laporan, RLS/izin foto antarwilayah, dua laporan untuk satu insiden, penolakan/penugasan ulang, konkurensi penerimaan, bukti/penutupan, kejadian baru, jadwal aktual, P1 pencegahan/kegiatan, kapasitas pendaftaran, CSV, serta satu alur lengkap melalui HTTP dengan tiga sesi. Pemeriksaan konflik HTTP mengharuskan 409 dan pesan yang dapat ditindaklanjuti; setelah logout workspace harus 401. Cleanup hanya ID uji yang dibuat dan tidak melaporkan kegagalan.

Hasil privat tersedia di `output/private/cloud-integration.json`. Jangan commit artefak privat. Hasil sanitasi dapat disimpan di `output/deployment`; tidak memuat token, password atau data pribadi.

Pengujian server produksi memakai origin HTTPS tanpa mengubah env lokal:

```powershell
$env:APP_ORIGIN = 'https://sampah-terhubung-langgamramadhan9-3266.vercel.app'
npm run test:integration
Remove-Item Env:APP_ORIGIN
```

## Memperbarui deployment

Dari `D:\WebDemo`, pastikan Git bersih, commit terbaru dipush dan pemeriksaan lulus. Konfigurasi runtime dapat dikirim secara privat dengan `npm run deploy:env`; helper dikunci pada proyek/team demo ini dan mengirim nilai melalui stdin, tanpa menampilkan secret.

```powershell
npm exec --yes --package=vercel@63.1.2 -- vercel deploy --prod --skip-domain --yes --project sampah-terhubung --scope langgamramadhan9-3266
npm exec --yes --package=vercel@63.1.2 -- vercel inspect <URL-deployment> --scope langgamramadhan9-3266
npm exec --yes --package=vercel@63.1.2 -- vercel promote <URL-deployment> --scope langgamramadhan9-3266
```

Framework Next.js 16.4.0, Node 24.x, install `npm ci`, build `npm run build`. Jangan memakai token pada argumen CLI. Variabel NEXT_PUBLIC memerlukan build/redeploy baru. Jangan menghapus pemeriksaan Origin untuk membuat URL preview lain dapat melakukan mutasi.

## Perbaikan Cloud dan batas pengujian

PostgREST 14 mengulang custom SQLSTATE `40001` sampai timeout. Migrasi 004 hanya mengganti exception konflik aplikasi dengan `PT409`, tanpa mengubah aturan peran/transisi. API Next.js memetakan PT409 ke HTTP 409. Pemeriksaan Cloud membuktikan dua penerimaan bersamaan menghasilkan satu 200 dan satu 409. Tidak ditemukan backend authenticator aktif lebih dari satu menit setelah perbaikan. [Dokumentasi Supabase](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).

Waktu database sekitar 0,8 detik lebih maju dari laptop saat diuji. Fixture kejadian setelah penutupan memakai timestamp penutupan server sebagai acuan; aturan validasi aplikasi tetap berlaku. Atur jam perangkat otomatis sebelum demo.

Foto dikirim satu per satu; foto di atas 3,5 MiB diperkecil browser menjadi JPEG maksimal 1920px untuk body Functions Vercel maksimal 4,5 MB. Berkas asli maksimal 5 MiB, tiga foto. Server tetap decode ulang, menghapus EXIF, dan menyimpan di bucket privat. [Batas Functions](https://vercel.com/docs/functions/limitations).

Belum terverifikasi: kedua laptop dan HP fisik secara bersamaan; kamera/GPS/jaringan seluler; signup/konfirmasi email; expiry sesi; backup dan restore. Pengujian beberapa sesi HTTP dan viewport 390px bukan bukti pengujian perangkat fisik. Foto yang terunggah namun belum tertaut akibat pembatalan masih memerlukan kebijakan retensi; pembersihan orphan otomatis belum tersedia. Demo memakai muat ulang, bukan sinkronisasi realtime.

## Bukti akhir deployment 12 Oktober 2026

- URL produksi tanpa sesi Vercel dapat dibuka. Delapan pemeriksaan HTTP lulus: beranda/preview 200, fixture ui-test 404, public API 200, workspace tanpa login 401, ketiga API mutasi dengan Origin asing 403; API memakai no-store.
- Alur browser produksi juga selesai dengan akun pelapor, koordinator dan petugas: laporan `62CEC511`, insiden `BDFC-FEC2D036`, validasi, penugasan, penerimaan, bukti lalu penutupan. Sesi pelapor yang dibuka kembali melihat Selesai terverifikasi dan riwayat yang sama. Artefak UI ini dipertahankan sebagai contoh simulasi; artefak integration script dibersihkan.
- Input PNG sintetis 3.770.477 byte dikirim melalui form browser, diubah menjadi JPEG dan tersimpan 843.055 byte di bucket privat. Foto bukti petugas juga berhasil dikirim melalui UI. Ini membuktikan satu kasus foto besar di browser desktop, bukan seluruh tipe foto/kamera HP.
- Thumbnail laporan termuat (naturalWidth 1120). Console browser tidak mencatat warning/error. Viewport 390x844 memiliki content width 375 tanpa overflow horizontal; ini emulasi.
- Koneksi Chrome beberapa kali terputus; pengujian aplikasi diselesaikan menggunakan browser aplikasi Codex. Allowlist redirect konfirmasi email kemudian selesai: dashboard menampilkan Total URLs: 2 dan Successfully added 2 URLs. Site URL dan login akun demo sudah terverifikasi; signup tetap batas pengujian.
- Bukti sanitasi: `output/deployment/cloud-local-results.json`, `cloud-production-results.json`, `http-results.json`, `browser-photo-results.json`, `browser-workflow-results.json`, serta `online-report-closed-mobile.png`. File privat tetap berada di output/private dan diabaikan Git.

Callback produksi tanpa token menghasilkan HTTP 307 ke confirmation_failed=1 dan tidak membuat cookie sesi. Ini menguji penolakan callback kosong, bukan pengiriman/penerimaan atau keberhasilan konfirmasi email. Bukti konfigurasi: output/deployment/auth-configuration-results.json dan auth-redirects-configured.png.
