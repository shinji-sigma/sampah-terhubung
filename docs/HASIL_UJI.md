# Hasil pengujian — 8 Oktober 2026

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
