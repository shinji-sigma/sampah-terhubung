# Demo online dari laptop kedua

Semua perintah dijalankan dari `D:\WebDemo`. Checkout dibuat dari salinan lokal yang bersih pada `7461875`; histori memuat perbaikan `0f9d055`. Folder sumber tidak diubah. Repository baru **privat**: https://github.com/shinji-sigma/sampah-terhubung. Tidak ada `.env.local` dalam Git.

## Status persiapan

- Node 24.21.0, npm 11.19.0; `npm ci` berhasil dan registry audit melaporkan 0 vulnerability saat instalasi.
- Baseline 31 tes/lint/build lulus; penyesuaian foto menambah tes retry parsial, total 32 tes lokal.
- Preview lokal memakai `http://localhost:3001/preview`; port 3000 milik aplikasi lain dipertahankan.
- GitHub melalui Git Credential Manager dapat melakukan push. Repository privat dibuat dan histori audit dipush ke `main`.
- CLI Vercel berhasil login; scope `langgamramadhan9-3266` terverifikasi sebagai OWNER pada paket Hobby aktif. Deployment dilakukan langsung dari checkout laptop kedua. Integrasi GitHub Vercel belum dipasang; push GitHub berikutnya perlu diikuti deployment CLI.
- `.env.local` dibuat dari template tanpa menyalin secret laptop utama. URL/key/password masih kosong menurut pemeriksaan boolean. Cloud/migrasi/seed/integrasi nyata belum dijalankan.

## Konfigurasi privat yang diperlukan

Pada proyek Supabase **baru, kosong, khusus simulasi** dan paket gratis:

1. Jalankan SQL Editor dalam urutan `202610080001_core.sql`, `202610080002_notifications.sql`, `202610100003_audit_controls.sql`. Tiga file tersedia di `supabase/migrations/`. Pada proyek yang telah memakai 001/002, jangan mengulang pembuat tabel; hanya terapkan tambahan yang belum ada setelah memeriksa target/backup.
2. Isi `D:\WebDemo\.env.local` dengan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, **tepat satu** `SUPABASE_SECRET_KEY` atau `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_PASSWORD` minimal 12 karakter, `DEMO_MODE=true`, `APP_ORIGIN=http://localhost:3001`. Secret tidak dikirim ke chat, Git atau screenshot.
3. Atur Auth Site URL/Redirect URLs untuk origin aplikasi sebenarnya. Untuk lokal izinkan `http://localhost:3001/**`. Setelah URL online stabil tersedia, tambahkan origin HTTPS tersebut; Site URL diarahkan ke demo online.
4. Konfirmasi target memang khusus simulasi, baru jalankan `npm run check:env`, `npm run demo:seed` **sekali**, rebuild/restart lokal, lalu `npm run test:integration`. Pemeriksaan integration memakai akun/foto sintetis dan melakukan cleanup ID yang dibuatnya. Jika cleanup gagal, periksa hasil privat sebelum mengulang.

Jangan melakukan seed ulang dari laptop pertama atau HP. Keduanya membuka URL HTTPS yang sama, sehingga Auth/data/foto memakai satu backend Cloud. Docker tidak diperlukan.

## Hosting Vercel

Gunakan akun Hobby yang tersedia untuk demo pribadi nonkomersial. Jangan memilih Pro, trial berbayar, domain atau add-on berbayar. Framework **Next.js**, root directory `./`, Node **24.x**, install `npm ci`, build `npm run build`, output default. `.vercelignore` mengecualikan seluruh file `.env*` dan output pengujian dari unggahan kode; `.vercel/` diabaikan Git.

Deployment CLI dari `D:\WebDemo` menggunakan `npm exec --yes --package=vercel@63.1.2 -- vercel deploy --prod --skip-domain --yes --project sampah-terhubung --scope langgamramadhan9-3266`. Periksa deployment lalu gunakan `vercel promote <URL>` dengan scope yang sama. Login CLI tetap privat; jangan memakai token pada argument command.

Isi Environment Variables di dashboard Vercel secara privat untuk environment demo:

| Variabel | Isi |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek simulasi yang sama |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key proyek tersebut |
| `SUPABASE_SECRET_KEY` | Server secret; jangan memakai awalan NEXT_PUBLIC |
| `SUPABASE_SERVICE_ROLE_KEY` | Alternatif legacy; kosongkan bila secret key sudah diisi |
| `DEMO_MODE` | `true` |
| `APP_ORIGIN` | Origin HTTPS stabil **persis**, tanpa path atau slash akhir |

`DEMO_PASSWORD` hanya diperlukan untuk seed/integration lokal; jangan menaruhnya di environment runtime hosting. `ALLOW_UI_FIXTURES` tidak diisi pada hosting. URL/publishable menjadi konfigurasi browser; perubahan variabel `NEXT_PUBLIC_*` memerlukan redeploy/build baru.

Jika URL awal berubah, jangan menghapus validasi Origin. Perbarui `APP_ORIGIN` dan redirect Auth untuk domain stabil, kemudian redeploy. API mutasi dari deployment preview lain memang ditolak jika Origin-nya tidak sesuai.

## Foto dan batas host

Vercel membatasi body/response Functions pada 4,5 MB. Form mengirim foto satu per satu; foto di atas 3,5 MiB diperkecil menjadi JPEG maksimal 1920px sebelum dikirim. Berkas asli tetap maksimal 5 MiB dan maksimal tiga foto. Browser yang tidak mendukung persiapan foto besar akan meminta berkas lebih kecil. Server tetap memvalidasi/decode ulang, membuang EXIF dan menyimpan pada bucket privat; browser bukan pengganti validasi server.

ID foto yang sudah berhasil diunggah disimpan selama retry parsial agar tidak diunggah ulang. Objek yang berhasil tersimpan tetapi belum tertaut akibat pembatalan/lost response tetap memerlukan kebijakan retensi; demo ini belum memiliki pembersihan otomatis. Pengujian kompresi asli di browser/HP dan batas hosting tetap harus dicatat sesudah backend tersedia, bukan disimpulkan dari unit test.

## Pengujian setelah deploy

1. Periksa `/preview` 200, `/ui-test` 404, label Data simulasi, desktop/ponsel serta error console. Preview statis tidak membuktikan backend.
2. Login akun pelapor, unggah foto nyata sintetis dan kirim laporan. Catat nomor laporan, periksa foto hanya dapat dibaca pihak berhak.
3. Login koordinator pada perangkat lain: laporan yang sama muncul setelah muat ulang; validasi, tugaskan petugas. Petugas menerima tugas, mengirim bukti/waktu/tindakan/tujuan pengangkutan; koordinator memeriksa dan menutup. Pelapor melihat perkembangan yang sama.
4. Coba ID foto/data wilayah lain dengan akun yang tidak berhak; pastikan server/database menolak. Jalankan integration script dengan `APP_ORIGIN` origin HTTPS itu dari laptop kedua.
5. Uji laptop pertama, kedua dan HP pada URL yang sama. Klaim antarperangkat hanya setelah hasil benar-benar teramati; respons MOCK, viewport emulasi dan SQL terisolasi tidak cukup.

Email signup/konfirmasi, peta pada jaringan HP, upload besar, konkurensi, logout/expiry, backup foto+database/restore dan perangkat fisik tetap dicatat sebagai belum teruji sampai benar-benar diperiksa.

Sumber resmi: [Vercel Functions limits](https://vercel.com/docs/functions/limitations), [Hobby plan](https://vercel.com/docs/plans/hobby), [API keys Supabase](https://supabase.com/docs/guides/api/api-keys), [redirect URL Auth](https://supabase.com/docs/guides/auth/redirect-urls).
