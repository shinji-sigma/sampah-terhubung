# Hasil pengujian — 8 Oktober 2026

## Pembaruan revisi desain — 9 Oktober 2026

Lint, typecheck, build produksi dan **26/26 tes lokal** lulus setelah revisi antarmuka. Dua tes baru mencakup referensi insiden yang berbeda dan format tanggal Indonesia. Screenshot sebelum/sesudah tersedia untuk beranda, jadwal, wilayah, kegiatan kosong dan tiga keadaan peran di viewport desktop 1440×1000 / ponsel 360×800; kegiatan berisi memakai fixture tambahan. Hasil dan tautan lengkap: [REVISI_DESAIN.md](REVISI_DESAIN.md).

Browser produksi baru pada preview: 0 error / 0 warning. Tidak ada overflow pada view yang diperiksa. Logo utuh pada lebar 184/150 px; tanggal dan jam terdekat berada di dalam layar awal ponsel (sekitar y=510 px). Keyboard menu Escape, detail sumber dan referensi lengkap berhasil. Metadata beranda minimum 14 px dan tinggi tombol aktif terlihat minimum 44 px. Form peran diperiksa dalam keadaan error kolom, gagal jaringan, loading dan pesan berhasil **MOCK terisolasi**, tanpa penyimpanan backend. `/ui-test` tetap 404, API tanpa konfigurasi 503, favicon 200. Hash dokumen sumber dan logo identik.

Pemeriksaan konfigurasi boolean terbaru: URL/publishable key/server secret/password demo belum tersedia. Auth/database/Storage Cloud dan laptop kedua belum diverifikasi. Catatan di bawah adalah hasil checkpoint 8 Oktober; hasil mock tetap bukan hasil backend nyata.

**Backend Cloud belum terhubung.** `.env.local` disiapkan dari template pada akhir sesi; URL masih placeholder dan semua key/password belum diisi. Tidak ada seed, akun, foto, atau perubahan database Supabase nyata yang dibuat. P0/P1 tidak dinyatakan selesai menurut kriteria penerimaan integrasi.

## Lingkungan dan pemeriksaan teknis

Windows, Node 24.21.0, npm 11.19.0, Next 16.4.0, React 19.3.0. Build produksi dijalankan hanya di `127.0.0.1:3001`; port 3000 milik proses lain tidak diubah. Browser Chrome dijalankan lewat Playwright CLI. Docker tidak dipakai oleh build, runtime atau pengujian yang lulus.

| Pemeriksaan            | Hasil yang dijalankan                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run lint`         | Lulus                                                                                              |
| `npm run typecheck`    | Lulus                                                                                              |
| `npm test`             | 24 lulus, 0 gagal, 0 dilewati                                                                      |
| `npm run build`        | Lulus; setelah perbaikan gate `/ui-test`, build diulang dan lulus                                  |
| `npm audit`            | 0 kerentanan pada graph dependensi setelah pembaruan lint                                          |
| `npm audit --omit=dev` | Diulang pada akhir: 0 kerentanan runtime                                                           |
| `npm run check:env`    | file true; URL, publishable key, server secret, password demo false; tidak mencetak nilai          |
| Git ignore             | `.env.local`, `output/private/cloud-integration.json`, `output/private/seed-state.json` terabaikan |

Tes SQL menjalankan dua migrasi pada PostgreSQL PGlite. Harness mengganti Auth dan Storage dengan tabel/fungsi/role terisolasi; ekstensi pgcrypto tidak dimuat karena UUID tersedia pada harness. Tes tidak menguji layanan Auth/Storage Supabase. Angka 24 mengikuti penghitung Node test runner, termasuk suite induk dan 16 subtest database.

Aturan yang diuji mencakup signup tidak dapat menaikkan peran; tabel tidak dapat ditulis langsung; validasi foto/waktu/koordinat; idempotensi laporan; akses laporan/foto privat dan lintas wilayah; dua laporan satu insiden; status tugas ditawarkan/ditolak/diterima/kendala; versi lama ditolak; bukti/tujuan sebelum pemeriksaan; perbaikan/reopen/kejadian baru; riwayat; pengecualian jadwal dan aktual unik; kegiatan draf/transport/kapasitas/peserta unik; pencegahan berizin; kegiatan selesai tidak menutup insiden; pemberitahuan; moderasi; projection publik; batas body streaming; origin mutasi; CSV formula injection; decode/rekompresi berkas Sharp; schema command server.

Tes PGlite bersifat berurutan; perlombaan permintaan nyata disiapkan pada skrip integrasi Cloud dan **belum dijalankan**.

## Browser yang benar-benar dijalankan

| Skenario                                                           | Hasil dan batas bukti                                                                                                            |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Preview produksi desktop 1440×1000 dan ponsel 360×800              | Tampilan diperiksa visual, label simulasi/pratinjau terlihat, tidak ada overflow horizontal                                      |
| Form laporan + HTTP error 422                                      | Kolom invalid dan pesan terkait tampil, isian dipertahankan; respons mock                                                        |
| Jaringan command dibatalkan setelah foto mock diunggah             | Pesan koneksi terputus, patokan tetap terisi, tidak ada pesan berhasil; respons backend mock                                     |
| Antrean koordinator, validasi                                      | Pesan invalid pada patokan publik di 360 px; backend mock, tidak tersimpan                                                       |
| Ruang petugas                                                      | Tindakan, waktu, tujuan dan input foto dapat ditampilkan di 360 px; belum submit bukti Cloud                                     |
| Tile peta diblokir dan geolocation mengembalikan permission denied | Pesan fallback tampil; pencarian/pilihan manual tetap bekerja. Penolakan GPS disimulasikan pada API browser, bukan izin OS nyata |
| Keyboard pilihan wilayah                                           | Fokus pencarian → tombol GPS → pilihan wilayah, Enter memilih wilayah                                                            |
| Target sentuh ruang petugas                                        | Inspeksi DOM: tidak ada tombol terlihat/aktif dengan tinggi <44 px; lebar halaman 345 px pada viewport 360 px                    |
| Preview produksi console                                           | 0 error, 0 warning pada sesi browser baru                                                                                        |
| `/ui-test` produksi                                                | HTTP 404; ditemukan respons streaming 200 pada pemeriksaan awal dan diperbaiki melalui prerender notFound sebelum streaming      |
| API tanpa konfigurasi                                              | `/api/public` HTTP 503; tidak berpura-pura memiliki backend                                                                      |
| Origin mutasi palsu                                                | `/api/commands` HTTP 403 sebelum akses backend                                                                                   |
| Favicon                                                            | `/icon.svg` HTTP 200                                                                                                             |

Respons 422, pembatalan command dan tile yang sengaja diblokir menghasilkan console error jaringan pada sesi mock; ini bagian skenario kegagalan. Sesi preview produksi baru tidak memakai route mock.

Screenshot: `output/playwright/desktop-preview.png`, `mobile-preview.png`, `mobile-report-network.png`, `mobile-coordinator.png`, `mobile-worker.png`, `mobile-map-gps-failure.png`. Preview berisi contoh statis; screenshot peran berlabel MOCK tidak menunjukkan autentikasi nyata. Skrip pemeriksaan UI tersimpan pada folder yang sama agar dapat diulang; jalankan `scripts/ui-fixtures.ts` untuk membuat fixture dan gunakan dev port 3002 dengan ALLOW_UI_FIXTURES=true.

## Pengukuran NF07 sementara

Lima navigasi preview produksi lokal tanpa throttling, Chrome viewport 360×800, server pada laptop pengembangan yang sama, data contoh kecil, font sistem, tidak ada request backend Cloud. Browser sudah pernah membuka preview; ini bukan cold-start internet. Waktu sampai heading terlihat: **367, 110, 99, 100, 124 ms** (median 110 ms). DOMContentLoaded: 302, 54, 44, 42, 56 ms. Semua di bawah target 3 detik pada kondisi ini saja. Belum ada ukuran CPU/RAM dalam laporan ini, Lighthouse, pengukuran Cloud, jaringan terbatas atau laptop kedua; NF07 belum dianggap terpenuhi untuk kondisi demo akhir.

## Pemeriksaan batas pekerjaan

Hash SHA-256 lima dokumen sumber (PRD, riset, palet, JSON kontras, pustaka) sama dengan sebelum implementasi. Arsip referensi tidak disalin ke repository aplikasi. Personal AI dan proses port 3000 tidak diubah. Tidak ada publikasi atau perubahan akun Cloud.

## Pemeriksaan yang masih diperlukan

1. Konfigurasi proyek Cloud, jalankan migrasi dan seed, lalu `npm run test:integration`: Auth, sesi HTTP, Data API, Storage privat, jadwal, laporan→duplikat→tugas→bukti→verifikasi→kejadian baru, pencegahan dan perlombaan kapasitas.
2. Browser nyata per peran memakai akun Cloud pada laptop pengembangan dan D:\WebDemo; coba foto salah jenis, ID ditebak, logout, pergantian wilayah, percobaan jaringan terputus serta refresh antarlaptop.
3. Signup publik dengan email konfirmasi/SMTP sebenarnya; akun `.invalid` yang dikonfirmasi seed tidak menguji email.
4. Audit keyboard/kontras/screen reader pada seluruh alur, GPS izin OS dan pengukuran kinerja dengan backend/jaringan demo.
5. Backup dan restore basis data **serta foto** pada proyek latihan terpisah (NF08), sesuai DEPLOYMENT_DAN_BACKUP.md.

## Revisi hero dan navbar terpilih — 9 Oktober 2026

Baseline `268136b`, aplikasi yang sama. Addendum terbaru: [KEPUTUSAN_VISUAL_HERO.md](KEPUTUSAN_VISUAL_HERO.md). QA dengan referensi dan render gabungan: [design-qa.md](../design-qa.md), hasil `passed` setelah perbaikan kepadatan dan navbar peran. Ketentuan visual lama yang menghapus hero merupakan riwayat.

| Pemeriksaan terbaru | Hasil dan batas |
| --- | --- |
| Lint / typecheck / build | Lulus |
| Tes lokal | 26/26; SQL/RLS menggunakan PGlite terisolasi, tanpa Supabase Auth/Storage |
| Produksi 1440×1024 / 360×800 / 390×844 | Navbar, hero, wilayah, jadwal dan penanganan diperiksa; tidak ada overflow horizontal |
| Informasi mobile | Hero 222,4 px; tanggal pertama sampai y≈621 dan jam sampai y≈496; nama wilayah utuh |
| Keyboard | Enter membuka CTA/sumber dan memilih kawasan; Escape menutup menu serta mengembalikan fokus |
| Scope hero | Publik/pelapor; tidak di ruang kerja, jadwal, formulir atau kegiatan; kembali/ubah wilayah tidak mengulang entrance |
| Peran dan kegiatan berisi | Koordinator, petugas, pelapor/form laporan dan kegiatan memakai MOCK dev harness; bukan sesi/penyimpanan nyata |
| Reduced motion / JavaScript gagal | Animation none, opacity 1; teks dan jadwal SSR tetap terlihat saat skrip dinonaktifkan. Kontrol JS memerlukan skrip |
| Simulasi produksi | 150 ms latency, 200/100 KiB per detik down/up, CPU 4×, cache disabled. Navigasi setelah hidrasi berfungsi; klik terlalu dini belum bereaksi |
| Ilustrasi | WebP 89.304 byte; respons optimizer desktop diamati 32.092 byte. Reload 360 px: 0 request ilustrasi dan currentSrc kosong |
| Bundle | Semua chunks JS gzip 247.687→248.449 byte; CSS gzip 6.837→8.123 byte. Bukan payload satu route |
| Console | Sesi produksi dan dev bersih yang diperiksa: 0 error/0 warning. Sesi HMR awal dengan markup lama menghasilkan mismatch, direstart dan diambil ulang |
| Guard dan endpoint | /ui-test 404; /api/public 503 tanpa konfigurasi; /icon.svg 200; Origin mutasi palsu 403 |
| Konfigurasi Cloud | File ada, URL/publishable key/secret/password demo false; hanya boolean dibaca |
| Batas sumber | Hash PRD, riset, palet sumber, JSON kontras dan pustaka sama; hash logo asli sama. Personal AI/API/auth/RLS/dependency/favicon dipertahankan |

Bukti terbaru: `output/hero-design/before`, `after`, perbandingan penuh dan detail, JSON ukuran/kontras, serta [QA visual](../design-qa.md). Pengukuran 783 ms hanya sampai CTA terlihat menurut otomasi, bukan siap interaksi atau NF07 terpenuhi. CPU/jaringan adalah simulasi, bukan pengukuran HP fisik atau bukti 60 fps. Pengaturan browser dikembalikan setelah uji.

Supabase Cloud, foto privat dan isolasi wilayah nyata serta sinkronisasi laptop kedua masih menunggu konfigurasi. Panduan [SUPABASE_CLOUD.md](SUPABASE_CLOUD.md) tetap berlaku untuk clone `D:\WebDemo`, tanpa Docker. Tidak ada push/publikasi dan tidak ada secret dimasukkan ke Git.

Pemeriksaan visual tanpa JavaScript membuka kembali QA sebelum commit: boundary loading halaman lama hanya memperlihatkan fallback, meskipun HTML tersembunyi sudah terbaca oleh inspeksi DOM. `src/app/loading.tsx` dihapus; dashboard, peta dan submit masih memiliki indikator loading masing-masing. Screenshot `desktop-no-javascript-iteration1.jpg` menyimpan kegagalan, dan `desktop-no-javascript.jpg` memperlihatkan halaman produksi sesudah perbaikan. Simulasi lambat diulang: sampel sampai hero terlihat 664 ms (sampel sebelumnya 783 ms); klik pertama masih terjadi sebelum hidrasi siap, klik setelah skrip siap menampilkan jadwal. Ini tetap bukan ukuran waktu siap interaksi atau NF07.
