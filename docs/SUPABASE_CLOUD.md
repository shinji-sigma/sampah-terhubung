# Supabase Cloud dan dua laptop

Aplikasi ini memakai satu backend Supabase Cloud untuk kedua laptop. Docker bukan syarat menjalankan aplikasi. Pakai proyek khusus **Data simulasi**, bukan proyek yang berisi data pengguna nyata.

1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard), buat proyek jika belum ada, pilih region yang sesuai dan rencana yang Anda setujui sendiri. Simpan password basis data di pengelola password. Aplikasi tidak memerlukan password basis data.
2. Buka SQL Editor. Pada proyek kosong, jalankan `supabase/migrations/202610080001_core.sql`, lalu `supabase/migrations/202610080002_notifications.sql`, masing-masing satu kali dan dalam urutan tersebut. Migrasi pertama membuat tabel, aturan akses, fungsi transaksi, dan bucket foto privat; migrasi kedua melengkapi penerima pemberitahuan. Jangan jalankan ulang pada proyek yang telah dipakai tanpa migrasi lanjutan.
3. Ambil **Project URL** dan **publishable key** dari dialog Connect/API Keys. Ambil **secret key** pada bagian API Keys untuk server. Jika proyek hanya memakai kunci lama, `anon` dapat dipakai sebagai publishable dan `service_role` sebagai kunci server. Jangan memasukkan secret ke chat, screenshot publik, atau Git.
4. Salin `.env.example` menjadi `.env.local`. Isi:

| Variabel                               | Isi                                           | Penggunaan                                               |
| -------------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL `https://…supabase.co`                    | Alamat proyek, kedua laptop sama                         |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key                               | Kunci publik dengan pembatasan basis data                |
| `SUPABASE_SECRET_KEY`                  | Secret key `sb_secret_…`                      | Hanya server: memvalidasi lalu menyimpan foto; seed      |
| `SUPABASE_SERVICE_ROLE_KEY`            | Alternatif legacy service_role                | Kosongkan jika secret key sudah diisi                    |
| `DEMO_MODE`                            | `true`                                        | Label Data simulasi di layar dan ekspor                  |
| `APP_ORIGIN`                           | `http://localhost:3000`                       | Origin browser laptop tersebut                           |
| `DEMO_PASSWORD`                        | Password pilihan sendiri, minimal 12 karakter | Seed akun demo dan pengujian, tidak ditampilkan aplikasi |

5. Authentication → URL Configuration: Site URL `http://localhost:3000`, Redirect URLs `http://localhost:3000/**`. Login awal memakai email/password tanpa OAuth. Signup publik hanya membuat akun pelapor; peran pengelola tidak diambil dari metadata signup. Untuk signup pengguna baru dengan konfirmasi email, konfigurasi email/SMTP sesuai kebutuhan dan tautan konfirmasi. Akun demo dibuat terkonfirmasi oleh skrip server.
6. Jalankan `npm run demo:seed` setelah kode aplikasi selesai dipasang. Skrip membuat dua wilayah simulasi dan akun demo, jadwal, laporan pendukung, insiden, riwayat, serta kegiatan. Skrip menolak seed pada proyek yang berisi data operasional. Jangan mengirim secret pada hasil terminal.
7. Jalankan `npm run check:env`; hasil hanya menyatakan ada/tidaknya konfigurasi, bukan nilainya. Restart aplikasi setiap mengubah `.env.local`. Pastikan aplikasi berjalan pada alamat `APP_ORIGIN`, lalu jalankan `npm run test:integration` pada terminal kedua untuk memeriksa Auth, Data API, RPC, unggahan privat, dan izin antarwilayah menggunakan backend nyata. Skrip hanya menghapus data yang dibuat pengujiannya; bila pembersihan gagal, tinjau hasil privat sebelum mengulang.

Alamat akun demo menggunakan domain `.invalid`; bukan kontak orang sungguhan. Password sama dengan `DEMO_PASSWORD` yang Anda tetapkan. Nama akun lengkap akan dicatat pada README. Jangan memakai seed akun demo pada layanan pengguna nyata.

`NEXT_PUBLIC_*` masuk ke bundle browser. Hanya URL dan publishable key boleh menggunakan awalan itu. Secret key memiliki hak luas: hanya server unggahan dan skrip persiapan yang memakainya. Permintaan operasional aplikasi tetap memakai sesi pengguna agar pembatasan wilayah/peran berlaku.

Panduan resmi: [API keys](https://supabase.com/docs/guides/api/api-keys), [password Auth](https://supabase.com/docs/guides/auth/passwords), [redirect URL](https://supabase.com/docs/guides/auth/redirect-urls), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## Laptop kedua: D:\WebDemo

Pasang Node.js versi LTS yang memenuhi minimum Next.js (20.9+; Node 24 disarankan untuk menyamai laptop pengembangan) serta Git. Setelah repository tersedia, clone ke `D:\WebDemo` menggunakan URL repository milik Anda. Alternatifnya salin folder aplikasi tanpa `.env.local`, `node_modules`, dan `.next`.

```powershell
Set-Location D:\WebDemo
npm ci
Copy-Item .env.example .env.local
# Isi .env.local secara lokal melalui editor. Jangan tempel secret ke terminal.
npm run build
npm start
```

Buka `http://localhost:3000`. Isi konfigurasi backend proyek Cloud yang sama dan `APP_ORIGIN=http://localhost:3000`. Jangan seed ulang dari laptop kedua. Internet diperlukan untuk Auth, data, dan foto; peta boleh gagal tanpa menghalangi daftar atau patokan manual. Port lain memerlukan `APP_ORIGIN` dan konfigurasi redirect yang sesuai.

File `.env.local` tidak ikut clone. Transfer rahasia hanya melalui mekanisme privat yang Anda kelola. Bila laptop kedua tidak dipercaya untuk memegang kunci server, gunakan deployment server yang sudah dikonfigurasi pada tahap berikutnya; server lokal penuh memerlukan kunci server untuk unggahan.

Pada laptop pengembangan, port 3000 sedang dipakai proses lain. Gunakan `APP_ORIGIN=http://localhost:3001`, tambahkan `http://localhost:3001/**` ke daftar redirect Auth, lalu jalankan `npm start -- --port 3001`. Laptop kedua boleh tetap memakai port 3000. Pilihan port tidak mengubah proyek Cloud bersama.
