# Addendum bukti laporan dan pemisahan akun

12 Oktober 2026. Pengembangan di laptop pertama `LAPTOP-6OQ8DJT5`, checkout `D:\WebDemo`, branch `codex/report-evidence-auth`. Deployment hanya dari `Shinji_server`, target `D:\WebDemo\project\lombauin`. PRD, riset, Personal AI, logo sumber, dan laporan audit terdahulu tidak diubah.

## Kebijakan dan perilaku

- **Langsung** merupakan default: sesi sah, wilayah aktif, snapshot perangkat lengkap, minimal satu foto `camera_web`, serta konfirmasi lokasi/patokan kejadian. Kamera video saja, kamera belakang `ideal`, tanpa mikrofon. Pengambilan tidak membuat laporan otomatis tervalidasi.
- **Pendukung** memakai form, upload, RPC dan workflow yang sama: foto, patokan/waktu pengamatan, konfirmasi lokasi, serta alasan wajib. GPS/pin bersifat opsional; tetap perlu pemeriksaan koordinator.
- GPS diminta lewat aksi pengguna: `getCurrentPosition`, `maximumAge:0`, timeout 10 detik dan batas UI 20 detik. Tidak melacak di background. Angka accuracy ditampilkan; tidak ada radius/geofence atau threshold tebakan. Pin kejadian terpisah dari snapshot; menghapus/menggeser pin tidak mengganti snapshot. Kesesuaian wilayah perlu pemeriksaan pengelola.
- Kamera berhenti setelah capture, tutup, pindah tampilan, background, atau unmount. Prompt tanpa jawaban berakhir dalam 20 detik; stream yang datang terlambat dihentikan. Foto dapat diambil ulang/digunakan/dihapus; object URL dilepas. Maksimal tiga foto, 5 MB berkas sumber; helper kompresi dan unggahan satu per satu dipertahankan.
- Server tetap decode/resize/JPEG/strip EXIF, bucket privat, proxy berizin dan ownership/RLS. Metadata sumber merupakan klaim klien, **bukan bukti forensik atau jaminan kehadiran**. Pemeriksaan koordinator tetap diperlukan.
- Login dan daftar masing-masing satu form dalam navigasi view yang ada. Login menerima password akun yang sudah sah tanpa aturan minimum pendaftaran baru. Signup memerlukan nama dan 12 karakter, tanpa pemilih peran. Autocomplete `username`, `current-password`, `new-password`; heading tujuan mendapat fokus.
- Signup tanpa sesi hanya menampilkan instruksi konfirmasi; tidak membangun workspace. Callback menerima token hash dengan jenis `signup/email`, atau kode PKCE yang diverifikasi Supabase; tujuan tetap path internal tetap. Tidak menerima URL return bebas. Konfirmasi tidak dimatikan.
- CTA laporan menyimpan tujuan internal laporan/wilayah. Pada 401, draf teks/foto dan ID unggahan bertahan **di memori halaman** saat akun yang sama masuk kembali. Akun berbeda/logout membuang draf dan URL foto. Reload/tutup tab membuang draf. Mengganti wilayah meminta konfirmasi pembuangan draf. Wilayah C tetap nonaktif.

## Kontrak dan migrasi

Migrasi `supabase/migrations/202610120005_report_evidence.sql` satu kali, setelah 001–004. Tidak mengulang seed/migrasi pembuat tabel. Kolom baru nullable agar data lama tetap terbaca tanpa backfill palsu.

| Entitas | Kolom baru                                                    | Makna/validasi                                                                                                    |
| ------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| reports | evidence_mode, supporting_reason, location_confirmed          | direct/supporting; alasan minimal tiga karakter untuk supporting; konfirmasi true untuk laporan baru              |
| reports | device_lat, device_lng, device_accuracy_m, device_measured_at | semua kosong atau lengkap; lintang ±90/bujur ±180, accuracy finite ≥0, waktu finite/rentang; direct wajib lengkap |
| photos  | source, captured_at                                           | camera_web/upload; camera_web wajib waktu capture yang sah; lama null                                             |

`reports.lat/lng` tetap pin kejadian; patokan wajib. `reports.created_at` adalah penerimaan server; `photos.created_at` waktu unggah server. Waktu pengukuran/capture klien bisa keliru. HTTP memvalidasi JSON/ISO/angka; SQL juga memvalidasi snapshot, foto kamera yang belum terpasang dan milik aktor, serta constraint rentang. Kegagalan constraint mengembalikan seluruh transaksi.

Gateway lama 004 disimpan sebagai `command_legacy_004` dengan execute dicabut dari PUBLIC/anon/authenticated/service_role. Gateway baru memanggilnya sebagai owner sehingga transisi, audit, PT409 dan ownership tetap berlaku. Advisory lock aktor+request key diambil sebelum pemeriksaan receipt/foto; replay receipt tidak mengharuskan foto masih unattached. Metadata tidak mengubah status workflow.

Workspace foto memilih kolom baru secara eksplisit, tanpa path/size. Metadata laporan/foto tetap dilindungi RLS; proyeksi publik dan CSV ringkasan insiden tidak diberi koordinat perangkat/foto. Label lama: **Sumber bukti tidak dicatat**. Seed proyek baru tetap menghasilkan metadata lama/null dengan jujur; tidak dijalankan pada proyek demo ini.

## Bukti verifikasi

| Pemeriksaan                                              | Hasil dan batas                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit/PostgreSQL terisolasi                               | 40 tes lulus; termasuk direct/supporting, metadata invalid/nonfinite, foto pihak lain, gateway privat, RLS, wilayah aktif, replay, workflow P0/P1, upgrade data lama dan rollback tanpa kehilangan data                                                                                                           |
| Lint/typecheck/build                                     | Lulus; pemeriksaan akhir dicatat di output QA                                                                                                                                                                                                                                                                     |
| Chrome desktop                                           | UI memakai backend/kamera/GPS **MOCK**: login tunggal/kembali ke laporan, capture/retake/use, track stop, accuracy rendah, retry/edit foto tanpa upload duplikat, pin terpisah, 401/draf, denied/timeout, supporting; lifecycle prompt 20 detik/late stream, navigasi, akun berbeda/URL revoke, signup tanpa sesi |
| Edge desktop                                             | Jalur inti yang sama dengan backend/kamera/GPS **MOCK**; bukan uji sensor fisik                                                                                                                                                                                                                                   |
| Viewport 375×812 dan 812×375                             | Tidak overflow; draf tetap ada saat rotasi viewport. Reduced motion diperiksa pada UI sintetis; bukan HP Android/iOS                                                                                                                                                                                              |
| Supabase Cloud Auth nyata                                | Login/logout akun simulasi yang sudah ada lulus melalui API lokal; sesi logout ditolak 401, Origin asing ditolak 403. Tidak mengirim email signup                                                                                                                                                                 |
| Integrasi baru Cloud                                     | **Belum berjalan**: preflight gagal 42703 karena kolom migrasi 005 belum ada. Skrip berhenti sebelum login/unggahan/mutasi integrasi; tidak seed ulang                                                                                                                                                            |
| Chrome/Edge sensor asli, Android Chrome/iOS Safari fisik | **Belum diverifikasi**                                                                                                                                                                                                                                                                                            |

Bukti sanitasi: `output/qa-report-evidence/`. Berkas `.mock.js/.mock.json/.mock.png` hanya uji sintetis; tidak diimpor produksi. HTTP 401/422 pada console uji adalah skenario kegagalan yang disengaja. `.env`, cookie, token dan sesi autentikasi tidak disimpan dalam bukti. `/ui-test` tetap 404 pada build produksi.

## Persiapan server dan rilis

Repository privat: `https://github.com/shinji-sigma/sampah-terhubung`. Proyek hosting yang sudah ada: `sampah-terhubung`, scope `langgamramadhan9-3266`, project ID `prj_wvSxAQAkl0gh6prrhg7R8Uk9xg5L`; bukan proyek/paket baru. Vercel belum memiliki integrasi Git aktif saat diperiksa, jadi push branch tidak dianggap deployment.

URL stabil saat persiapan: https://sampah-terhubung-langgamramadhan9-3266.vercel.app/ . Masih versi aplikasi `28dadddaaa8245466fab78aedca56ca99b3d844c`, deployment `dpl_ATqNF5bbjh14TNQsiWcmZFvcvgbD`, URL rollback `https://sampah-terhubung-5htn8x0lz-langgamramadhan9-3266.vercel.app`. Jangan menghapus deployment ini.

Status server terakhir: host Shinji_server, akses tulis/baca dan HTTPS GitHub/npm terverifikasi. Direktori target sudah dibuat dan kosong. Sesi GitHub privat/Vercel serta konfigurasi Supabase belum tersedia pada server; pengguna perlu menyediakannya secara privat sebelum clone, migrasi dan deployment. Tidak ada secret dikirim lewat koordinasi chat.

Setelah akses tersedia, jalankan **dari server**, satu langkah per pemeriksaan:

1. Verifikasi hostname, repository, target dan SHA yang dikirim koordinator. Buat `D:\WebDemo\project\lombauin` hanya bila belum ada. Clone repo privat ke sana atau fetch jika repo sudah ada. Jangan reset/clean atau menimpa perubahan lokal; checkout branch rilis dan cocokkan SHA. Tetapkan direktori kerja tersebut untuk seluruh perintah rilis.
2. Isi/copy konfigurasi secara privat di `.env.local`, mengikuti `.env.example`: URL Supabase proyek simulasi yang sama, publishable key, **tepat satu** `SUPABASE_SECRET_KEY` atau `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_MODE=true`, `DEMO_PASSWORD` akun demo yang sudah ada. Untuk server lokal port 3001, `APP_ORIGIN=http://localhost:3001`. Jangan kirim nilai lewat chat, commit env, atau menaruh secret dalam argumen CLI.
3. Login GitHub/Vercel/Supabase secara interaktif bila sesi server belum ada. Link hanya proyek/scope yang tercatat. Env hosting memakai URL stabil untuk APP_ORIGIN; DEMO_PASSWORD hanya untuk pengujian lokal, tidak perlu di hosting. Verifikasi nama/keberadaan variabel tanpa mencetak nilainya. Gunakan exact redirect lokal/produksi `/auth/confirm`, tanpa wildcard baru atau perubahan confirm-email.
4. `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Tidak membutuhkan Docker. Tinjau upload inputs dan `.vercelignore`; env/private state/output tidak boleh terunggah.
5. Stage build produksi dengan CLI yang sudah diverifikasi, `npm exec --yes --package=vercel@63.1.2 -- vercel deploy --prod --skip-domain --scope langgamramadhan9-3266`. Belum mengubah domain stabil. Catat candidate ID/URL/SHA dan cek build/env/halaman publik sebelum perubahan database.
6. Terapkan **hanya 005** pada Supabase simulasi yang ref-nya diverifikasi `jrozalhfgmzpxvpvzgcf`. Tidak seed ulang. SQL harus dijalankan atomik dan dicatat. Perubahan gateway mewajibkan metadata baru, sehingga form versi lama akan meminta muat ulang selama jendela rilis. Siapkan rollback terlebih dahulu.
7. Jalankan server lokal versi kandidat pada 3001 dan `npm run test:integration`: Auth/Storage/RLS/dua jalur/workflow multi-sesi sungguhan, menggunakan foto/GPS sintetis yang diberi label. Skrip membersihkan hanya ID milik run ini. Jangan menganggap API lokal membuktikan candidate hosting; lakukan smoke candidate juga. APP_ORIGIN candidate tetap produksi: browser dari hostname candidate tidak boleh diizinkan lewat pelemahan Origin. Pemeriksaan API candidate dapat memakai klien HTTP dengan Origin produksi yang sah, dengan cookie privat di memori; catat ini sebagai smoke HTTP, bukan UI produksi lintas domain. Gunakan akses deployment resmi bila terproteksi.
8. Bila semua checks lulus, `vercel promote <candidate-ID/URL>` dari server (CLI versi/scope sama). Uji **URL stabil**: login, foto/GPS HTTPS, laporan direct/supporting, pemeriksaan koordinator, penugasan, bukti petugas, penutupan dan refresh pelapor dari sesi kedua. Catat hasil nyata terpisah dari UI MOCK.
9. Bila gagal setelah 005, rollback gateway dengan `supabase/rollback/005_restore_gateway.sql` dan kembalikan deployment lama melalui `vercel rollback <URL-lama>` dari server. Kolom/foto/laporan tidak dihapus; kebijakan bukti baru sementara dinonaktifkan. Jangan mengulang 005 setelah rollback tanpa meninjau nama fungsi/kolom yang masih ada. Rollback hanya diuji di PostgreSQL terisolasi, belum di Cloud/hosting.

## Uji pengguna pada HP setelah rilis

Gunakan wilayah A/B dan akun demo sah, HTTPS URL stabil. Ambil sampah/patokan lingkungan tanpa wajah/identitas; pilih lokasi perangkat lalu periksa pin/patokan, capture/retake/use dan kirim. Pastikan layar koordinator pada perangkat lain menampilkan foto/sumber/accuracy/waktu perangkat dan server, lalu lanjutkan alur petugas/penutupan. Pelapor refresh untuk melihat hasil. Ulangi dengan supporting dan alasan ketika izin sensor ditolak. Periksa background/return/rotate/network loss/session expiry. Android Chrome dan iOS Safari perlu hasil tersendiri, bukan klaim dari viewport desktop. Signup/email nyata membutuhkan alamat milik pengguna serta persetujuan pengiriman terpisah; belum dilakukan.

## Rujukan primer

- [W3C Geolocation](https://www.w3.org/TR/geolocation/) — snapshot/accuracy, cache dan timeout.
- [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) — izin, secure context, prompt yang bisa tidak dijawab; kamera dapat berupa sumber virtual.
- [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow) — exchange kode memerlukan verifier sesi asal.
- [Vercel staged production promotion](https://vercel.com/docs/deployments/promoting-a-deployment) — stage lalu promote build yang sama; preview promotion dapat membangun ulang.

Tidak ada pembelian, layanan email baru, geofence tebakan, tracking background, AI deteksi penipuan atau janji GPS/foto menjamin keaslian. Batas utama rilis sekarang adalah autentikasi/konfigurasi privat server dan migrasi 005 yang belum diterapkan.
