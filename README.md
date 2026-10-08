# Sampah Terhubung

Web koordinasi lingkungan berbahasa Indonesia: **laporan → validasi / duplikat → penugasan → bukti → pemeriksaan**, dengan jadwal wilayah, kejadian berulang, pencegahan, dan kegiatan. Semua seed merupakan **Data simulasi**; tidak ada layanan pemerintah, mitra, atau lokasi pilot yang diklaim sudah aktif.

Kode berada di `D:\Project\Lomba_UIN\web`. Dokumen PRD, riset, desain, dan referensi di folder induk tetap dipertahankan. Repository Personal AI berada di luar pekerjaan ini.

## Menjalankan

Node.js 20.9+ diperlukan (pengembangan diuji memakai Node 24.21). Backend memakai **Supabase Cloud** yang sama di kedua laptop. **Docker tidak diperlukan**.

```powershell
Set-Location D:\Project\Lomba_UIN\web
npm ci
Copy-Item .env.example .env.local
# Isi konfigurasi secara privat dengan editor.
npm run check:env
npm run demo:seed
npm run build
npm start
```

Buka `http://localhost:3000`. Pada laptop kedua, ganti lokasi kerja menjadi `D:\WebDemo`, jalankan `npm ci`, isi `.env.local` secara lokal, lalu `npm run build` dan `npm start`. **Jangan seed ulang dari laptop kedua.** Langkah lengkap: [Supabase Cloud dan dua laptop](docs/SUPABASE_CLOUD.md).

Jika port 3000 sedang dipakai aplikasi lain, gunakan `npm start -- --port 3001` atau `npm run dev -- --port 3001`; atur `APP_ORIGIN=http://localhost:3001` dan tambahkan origin tersebut pada konfigurasi Auth. Jangan menghentikan aplikasi lain untuk mengambil portnya. Server hanya mendengarkan pada `127.0.0.1`.

Tanpa konfigurasi, halaman utama menampilkan keadaan backend belum tersedia. `/preview` adalah **pratinjau statis**, tanpa sesi atau penyimpanan. Antarmuka tidak menganggap pratinjau sebagai backend aktif.

## Konfigurasi privat

Isi URL proyek, publishable key, `SUPABASE_SECRET_KEY` (atau alternatif legacy `SUPABASE_SERVICE_ROLE_KEY`), `DEMO_MODE=true`, `APP_ORIGIN`, dan `DEMO_PASSWORD` pilihan sendiri (12+ karakter). URL/publishable key boleh masuk browser; secret khusus server tidak memakai awalan `NEXT_PUBLIC_`.

`.env.local`, hasil backup, manifest seed, dan hasil integrasi privat diabaikan Git. `npm run check:env` hanya mencetak boolean keberadaan, bukan nilai konfigurasi. Jangan menaruh secret pada argumen terminal atau chat.

Jalankan semua file migrasi di `supabase/migrations` menurut nama pada SQL Editor proyek Cloud yang kosong. Seed memakai Auth Admin dan Storage nyata; `supabase/seed.sql` hanya menjelaskan pemanggilan skrip karena akun dan foto tidak dapat disiapkan melalui SQL seed saja.

## Akun demo

Semua akun memakai password yang Anda tetapkan dalam `DEMO_PASSWORD`. Alamat `.invalid` adalah identitas simulasi dan bukan kontak orang sungguhan.

| Akun                         | Peran                              |
| ---------------------------- | ---------------------------------- |
| `pelapor.a@demo.invalid`     | Pelapor A                          |
| `pelapor.2@demo.invalid`     | Pelapor kedua, laporan pendukung   |
| `koordinator.a@demo.invalid` | Koordinator wilayah A              |
| `petugas.a@demo.invalid`     | Petugas wilayah A                  |
| `koordinator.b@demo.invalid` | Koordinator wilayah B, uji isolasi |
| `petugas.b@demo.invalid`     | Petugas wilayah B                  |
| `pelapor.b@demo.invalid`     | Pelapor B                          |
| `admin@demo.invalid`         | Administrator simulasi             |

Signup publik hanya membuat akun pelapor. Peran pengelola tidak mengikuti metadata signup. Dua wilayah aktif dan satu wilayah belum terlayani disiapkan; seed menolak menimpa backend yang sudah berisi data. Seed pertama menulis manifest lokal untuk melanjutkan bila proses terhenti. Seed selesai tidak dijalankan ulang; jangan menghapus manifest untuk memaksa reset.

## Pemeriksaan

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm audit
# Setelah migrasi, seed, .env.local, dan aplikasi aktif:
npm run test:integration
```

Tes PostgreSQL terisolasi memakai PGlite dengan schema Auth/Storage tiruan. Tes ini menjalankan migrasi dan kebijakan peran database, namun **tidak membuktikan Supabase Cloud terhubung**. Pengujian Cloud melakukan login sungguhan, upload foto melalui server, permintaan Data API/RPC, izin antarwilayah, konkurensi tugas dan pendaftaran. Artefak uji dibersihkan berdasarkan ID yang dibuat; backend tidak di-reset.

Skill Playwright dipakai untuk pengujian browser melalui CLI. Halaman `/ui-test` hanya tersedia di `next dev` dengan `ALLOW_UI_FIXTURES=true`; responsnya dimock oleh alat uji dan diberi label besar. Halaman itu mengembalikan 404 pada produksi. Jangan gunakan mock sebagai pembuktian alur backend.

## Dokumentasi

- [Panduan per peran dan demo](docs/PANDUAN_PENGGUNA.md)
- [Arsitektur, akses, dan keputusan desain](docs/ARSITEKTUR.md)
- [Status fitur terhadap PRD](docs/FITUR_PRD.md)
- [Hasil pengujian](docs/HASIL_UJI.md)
- [Deployment dan pemulihan](docs/DEPLOYMENT_DAN_BACKUP.md)
- [Kemajuan dan handoff](PROGRESS.md)

Foto seed berupa ilustrasi SVG buatan proyek yang dirender menjadi JPEG, berlabel DATA SIMULASI. Tidak berisi identitas nyata. Ikon memakai lucide-react (ISC) dan Leaflet (BSD-2-Clause); basemap OpenStreetMap memiliki atribusi dan mengikuti kebijakan tile tanpa prefetch/offline-download. Arsip berita/jurnal tidak disalin ke repository aplikasi.
