# Review kode, UI dan UX Sampah Terhubung

Reviewer: sub-agent Reviewer. Audit awal 10 Oktober, retest independen 11 Oktober 2026. Branch `codex/sampah-terhubung-local`, HEAD awal `541a2ad4b63453aaadfa9e3288c454965d0baa6f`, HEAD akhir **`0f9d0558756a25e1f8b3fa1a8735972517fcc87e`**. Breadth/performa diuji pada kode beku `9d67c3a0da095ed93bc88aebc8e501ec16dec729`; actual diff `9d67..0f9d` hanya menambah judul pada tiga fallback. Retest produksi baru pada HEAD akhir tercatat di bawah. Aplikasi tidak diedit oleh Reviewer. Koordinator merupakan satu-satunya penulis kode aplikasi.

## Ruang lingkup dan metode

PRD F01–F10/NF01–NF08, AGENTS, arsitektur, pemetaan fitur, hasil uji, QA desain, keputusan hero, panduan pengguna serta deployment/backup dibaca. Audit produk mengikuti skill Product Design Audit. Browser IAB baru dipakai pada produksi port 3004 `/preview` dan development port 3005 `/ui-test`. Data peran merupakan fixture sintetis pada intersepsi API di alat browser; label MOCK terlihat dan tidak ada penyimpanan backend. Kode aplikasi, batas server/client, validasi, state dan tes dibaca langsung.

Bukti hanya berasal dari putaran audit ini. Artefak lama digunakan sebagai sumber data sintetis dan konteks; screenshot lama tidak dipakai sebagai hasil audit. `.env.local` tidak dibuka. Hasil SQL PGlite dan tes koordinator harus dibaca sebagai database terisolasi, bukan Supabase Auth/Storage sungguhan. Cloud, perangkat kedua, email konfirmasi, upload privat serta restore belum diuji.

## Langkah dan keadaan browser

1. Beranda publik 1440×900: sehat untuk demo; jadwal terdekat, status terkonfirmasi, label simulasi dan CTA jelas. `01-public-desktop-before.jpg`.
2. Beranda 360×800 dan 390×844: sehat, nama wilayah membungkus utuh, tanggal/jam pertama terlihat dan tidak ada gulir horizontal. `02-public-mobile360-before.jpg`, `05-public-mobile390.jpg`.
3. Tablet 768×900: sehat, konten satu kolom dan navigasi menu. `06-public-tablet768.jpg`.
4. CTA jadwal dan pemilih wilayah: navigasi bekerja. Menu Enter memindahkan fokus ke Beranda; Escape menutup dan mengembalikan fokus ke Buka navigasi. Sumber jadwal menggunakan disclosure semantik.
5. Koordinator membuka Ruang kerja dan validasi duplikat: kontrol tersedia; command sukses MOCK, bukan transaksi nyata. `03-coordinator-before.jpg`, `08-command-success-mock.jpg`.
6. Refresh ruang kerja mendapat 401 sesudah command MOCK: bermasalah pada baseline, navbar publik tetapi main kosong. `04-session-expired-before.jpg`.
7. Petugas membuka tugas accepted: tindakan, waktu, status pengangkutan, tujuan dan foto tersedia. Belum submit bukti ke layanan nyata.
8. Pelapor membuka Laporan saya dan Buat laporan: nomor/status, patokan, kategori, waktu dan petunjuk foto tersedia; sebelum retest final, HMR mengosongkan fixture. Tidak dihitung sebagai kegagalan runtime produksi.
9. Kegiatan koordinator: PIC, tugas/alat, kapasitas 0/15, waktu/pihak/tujuan pengangkutan dan status konfirmasi terbaca. Belum membuktikan persaingan kursi atau registrasi tersimpan.
10. Reduced motion dan JavaScript dinonaktifkan: SSR beranda/jadwal tetap terlihat; teks entrance animation none, opacity 1. Screenshot `07-no-javascript-reduced.jpg`. Kontrol berbasis JavaScript tidak diklaim bekerja tanpa skrip.

Screenshot tersimpan di `output/audit/reviewer/`. Screenshot sesi habis dibuka lagi dari file lokal; file yang tersimpan cocok dengan keadaan yang diperiksa. Screenshot beranda akhir baseline diambil sesudah pergi ke Jadwal lalu kembali, sehingga opacity entrance tidak disalahartikan sebagai kontras akhir.

## Matriks peran × fitur

| Peran | Fitur | Pemeriksaan / hasil | Batas |
| --- | --- | --- | --- |
| Publik | F01 wilayah/GPS | Browser daftar/pencarian dan pemilih; kode GPS opsional, konfirmasi tetap wajib | Izin GPS OS belum diuji pada audit ini |
| Publik | F02 jadwal | Browser CTA, tanggal, label konfirmasi, sumber dan periode | Simulasi; bukan jadwal mitra nyata |
| Publik | F04/F06 status | Browser label insiden terverifikasi; kode projection/privasi | Foto privat tidak tersedia di preview |
| Pelapor | F03 laporan | Browser form, status dan nomor MOCK; kode validasi/foto/retry/inFlight | Upload nyata, idempotensi HTTP Auth nyata belum diuji |
| Pelapor | F06 tanggapan | Kode MyReports menyediakan tanggapan laporan validated dan status peninjauan | Submit nyata belum diuji |
| Koordinator | F04 validasi/duplikat/tolak | Browser disclosure dan pilihan insiden; command sukses MOCK; kode version/reason | SQL terisolasi dilaporkan koordinator/Security |
| Koordinator | F05 penugasan/alihtugas | Kode petugas aktif, estimasi, alasan dan riwayat; UI kontrol tersedia | Pergantian dua akun sungguhan belum diuji |
| Petugas | F05/F06 terima/tolak/kendala/bukti | Browser task accepted dan form bukti; kode offered/rejected/submitted/accepted | Foto dan keputusan needs-fix nyata belum diuji |
| Koordinator | F06 pemeriksaan/reopen | Kode bukti/tindakan/waktu/tujuan, checkbox approve, reason wajib | Keaslian foto dan operasional belum dapat disimpulkan |
| Koordinator | F07 berulang/pencegahan | Kode recurrence dedup ID insiden, periode, urutan pengamatan setelah close; form pencegahan/evaluasi; browser populated final di bawah | Submit/evaluate hanya source-check, tidak persist nyata |
| Peserta/koordinator | F08 kegiatan | Browser kegiatan dengan logistik dan kapasitas; kode daftar/batal/draf/transport/hasil | Kapasitas atomik nyata belum diuji |
| Koordinator | F09 ringkasan/CSV | Kode periode WIB terpisah laporan/insiden, export server scope/CSV escaping | CSV HTTP sungguhan belum diuji |
| Semua akun/admin | F10 notification/moderasi | Kode menu notifikasi, admin region/membership/moderation/reason/history; browser admin dan notifications final di bawah | Auth/admin nyata belum diuji |

## Temuan awal yang dikonfirmasi

### RV-01 — P2 — Sesi kedaluwarsa menghasilkan ruang kerja kosong

Prasyarat: koordinator berada pada manage, public refresh berhasil, workspace refresh mengembalikan 401. Reproduksi aman: fixture koordinator → Ruang kerja → Validasi duplikat (command 200 sintetis) → public 200 → workspace 401. Aktual: akun dihapus, main hanya nama wilayah tanpa judul atau pesan pemulihan. Yang diharapkan: pemberitahuan sesi berakhir dan aksi masuk kembali; tindakan tidak dapat dilanjutkan tanpa akun. Dampak: pengguna kehilangan konteks dan mengira aplikasi rusak. Sumber baseline `src/components/dashboard.tsx` load 401 dan render manage/prevention/summary/admin yang hanya memiliki conditional positif. Bukti `04-session-expired-before.jpg`.

Rekomendasi: panel akses/sesi eksplisit untuk gated view, pesan recovery pada 401, hilangkan workspace basi pada kegagalan pemuatan; pertahankan isian formulir bila command gagal. Retest final dicatat di bawah.

### RV-02 — P2 — Halaman operasional tidak mempunyai heading utama

Prasyarat: navigasi Jadwal, pemilih wilayah atau Ruang kerja. DOM browser awal menunjukkan heading page level 2 tanpa level 1. Sumber baseline `src/components/primitives.tsx` SectionTitle hardcoded h2; page memakai komponen yang sama dengan section beranda. Dampak: navigasi heading pembaca layar kehilangan judul utama dan hierarki awal tidak sesuai PRD. Rekomendasi: prop level, page eksplisit h1, section beranda tetap h2, gaya tetap konsisten. Retest final dicatat di bawah.

### RV-03 — P3 — Dokumen warna lama perlu penanda riwayat

ARSITEKTUR awal menyebut #166534/#0F766E/#F8FAFC; keputusan hero terbaru menetapkan petrol/jade/gading. Ini konflik deskripsi, bukan perubahan konsep yang diperlukan. Rekomendasi: rujuk addendum terbaru pada arsitektur tanpa mengedit PRD atau desain sumber.

Respons API non-JSON pada baseline terbukti melalui inspeksi kode dapat membuat `response.json()` melempar SyntaxError teknis. Tidak diklaim reproduksi browser awal: intersepsi pertama mengembalikan command sukses karena helper menangkap respons lama. Screenshot tersebut dinamai `08-command-success-mock.jpg`, bukan bukti error. Reproduksi dan penilaian setelah patch harus memakai respons eksplisit.

## Kualitas kode dan batas kebutuhan

Komponen terbagi berdasarkan tugas nyata (jadwal, operasi, kegiatan, form), API server memegang validasi dan akses, SQL memegang transaksi. Sequence/AbortController mencegah hasil pencarian wilayah basi; retry request_key terikat payload, inFlight mengunci double submit. File foto divalidasi klien dan server; proxy privat memakai Image unoptimized. Peta diimpor dinamis sehingga beranda tidak memerlukan Leaflet. Peran nyata adalah publik, pelapor, worker, coordinator dan admin.

Tes lokal mempunyai perilaku penting (RLS/ownership/cross-region, idempotensi, stale version, workflow, recurrence, CSV, upload decoder dan body/origin), bukan hanya class CSS. PGlite mengganti Auth/Storage dan eksekusinya berurutan: tidak memvalidasi cookie/provider asli atau race pada jaringan Cloud. Banyak form panjang dibuka melalui details; perlu uji pengguna lapangan untuk mengukur keberhasilan tugas tanpa bantuan. Koordinat peta opsional dan petunjuk lokasi manual menjaga akses saat peta gagal; pelaksanaan layanan tetap bergantung koordinator dan pengangkut nyata.

## Penilaian awal demo sebelum perbaikan

| Aspek | Skor 1–5 | Alasan / keyakinan |
| --- | --- | --- |
| Visual | 4 | Hierarki hero/jadwal jelas, logo utuh, palet/ruang konsisten empat viewport; keyakinan tinggi pada layar diam yang diperiksa |
| Navigasi | 4 | CTA/action jelas, navbar peran lengkap, menu keyboard berfungsi; keyakinan sedang, belum seluruh keyboard form |
| Kemudahan tugas | 3 | Tugas awal dapat ditemukan, tetapi sesi habis buntu pada baseline; keyakinan sedang pada MOCK |
| Feedback/recovery | 2 | Blank workspace 401 terkonfirmasi; uji non-JSON/retry final belum selesai; keyakinan sedang |
| Konsistensi peran | 4 | Pola tombol/status/form sama dan hero tidak ada di ruang kerja; keyakinan sedang karena fixture |
| Aksesibilitas | 3 | Fokus/Escape/label/status kata kuat, heading h1 hilang pada baseline; belum screen reader penuh/kontras semua state |
| Performa | Belum dapat dinilai final | Belum ukuran jaringan produksi putaran audit ini; bundle/hero/lazy map saja tidak cukup membuktikan SLA |

Kemudahan tugas operasional dengan backend sungguhan **belum dapat dinilai**. Tidak ada uji pengguna lapangan, sehingga skor audit tidak menjadi persentase keberhasilan pengguna.

## Retest independen snapshot final

Reviewer membaca actual diff `541a2ad..9d67c3a` pada komponen, client API, date formatter, CSS, tes client API serta dokumentasi; kemudian meninjau diff tambahan tiga fallback SectionTitle pada dashboard. Penilaian berikut berasal dari browser baru dan respons eksplisit, bukan hanya ringkasan koordinator. Semua command/upload sukses di tabel merupakan MOCK, tidak tersimpan. Perubahan respons workspace sintetis dipakai untuk menunjukkan keadaan peran; ini tidak membuktikan perpindahan state SQL/Cloud.

| Urutan final | Jalur / keadaan yang benar-benar diamati | Hasil dan bukti baru |
| --- | --- | --- |
| 1 | Koordinator → Ruang kerja → command MOCK 200 → workspace 401 | RV-01 pulih: pesan sesi berakhir, h1 Ruang kerja belum tersedia, Masuk kembali/Muat ulang akses; main tidak kosong. `final-01-session-expired.jpg` |
| 2 | Muat ulang akses workspace 200 → Tolak dengan alasan → command HTML 503 | Pesan layanan ramah, bukan SyntaxError; textarea tetap berisi. `final-02-html503-input-preserved.jpg` |
| 3 | Form sama, double click ketika request tertahan → network failure → retry field 422 → mutation 401 | Satu request saat double click; isian tetap; error field terasosiasi; retry payload sama menggunakan key sama. `final-03-network422-retry.jpg`, `final-client-retry.json` |
| 4 | Command 200 lalu workspace 503 | Workspace basi dibersihkan, kartu dan metrik privat hilang, panel retry tersedia. `final-04-workspace503-cleared.jpg` |
| 5 | Reporter → Buat laporan, 360px → teks/foto invalid → PNG sintetis valid | Error foto dijelaskan dan aria-describedby mencakup error; teks tetap tersedia. Upload MOCK ids dan report.create 200 memindahkan ke Laporan saya. `final-05-reporter-invalid-photo.jpg` |
| 6 | Reporter → Kegiatan → join 422 kapasitas penuh → join 200 dengan registrasi sintetis → leave 200 | Error kapasitas terlihat; 1/15 dan tugas, tombol batal; sesudah leave kembali 0/15 dan tombol daftar. `final-06-event-reporter.jpg`, `final-07-event-joined.jpg` |
| 7 | Worker accepted → Catat kendala → command 200 | Kontrol kendala/bukti tersedia, sukses MOCK. `final-08-worker-controls.jpg` |
| 8 | Worker accepted dengan reason perbaikan → tindakan/waktu/moved/tujuan/foto → task.evidence 200 | Alasan perbaikan terbaca, form dapat dikirim ulang, sukses MOCK mereset form. `final-09-worker-returned-evidence.jpg` |
| 9 | Worker offered → Tolak penugasan | Terima dan mulai serta tolak dengan alasan tersedia. Kontrol diperiksa, tidak semua keputusan dikirim. `final-10-worker-offered.jpg` |
| 10 | Coordinator working → Alihkan penugasan | Pilihan petugas aktif, estimasi dan alasan muncul. Tidak menjalankan pergantian dua akun nyata. `final-11-coordinator-reassign.jpg` |
| 11 | Coordinator awaiting_review → alasan, approve unchecked → review 200 | Copy menyatakan dikembalikan untuk perbaikan bila tidak dicentang. Sukses MOCK; tugas returned diuji terpisah langkah 8. `final-12-coordinator-needs-fix.jpg` |
| 12 | Ringkasan → tanggal native via ArrowDown/Tab | Dari 2026-09-11 berubah ke 2026-08-11; CSV href ikut berubah dan region tetap sama. Laporan 1 dan insiden 1 ditampilkan terpisah. `final-13-summary-period-csv.jpg` |
| 13 | Prevention dengan dua ID insiden berbeda, satu point | Ambang 2/30 hari, referensi terpisah, label dugaan perlu konfirmasi, dasar/tindakan/PIC/evaluasi dan form hasil tersedia. `final-14-prevention-two-incidents.jpg` |
| 14 | Admin MOCK → Administrasi → penunjukan/cabut akses | Peran, akun, wilayah, akses aktif serta alasan tersedia; moderasi dan riwayat ditampilkan. Tidak mengubah akses sungguhan. `final-15-admin-membership.jpg` |
| 15 | Ganti wilayah → GPS tanpa pemberian izin → manual | Pesan GPS tidak tersedia atau izin ditolak; pilihan manual tetap dapat dipilih. Ini tidak membedakan penolakan OS dari GPS browser tidak tersedia. `final-16-gps-unavailable-manual.jpg` |
| 16 | Notifications berisi → read 200 → workspace 401, lalu mine anonim | Sesudah patch kecil: satu h1 Pemberitahuan; satu h1 Laporan saya, dengan petunjuk masuk. `final-17-notifications-expired-heading.jpg`, `final-18-mine-anonymous-heading.jpg` |

Native date `fill()` pada alat browser hanya mengubah DOM value tanpa memperbarui state React dalam percobaan pertama; itu tidak dipakai sebagai bukti filter berhasil atau bug produk. Keyboard tanggal pada langkah 12 benar-benar mengubah href. Intersepsi di alat tidak menyentuh cookie/provider atau backend; hasil idempotensi browser hanya membuktikan reuse key dan penguncian klien.

RV-01: **closed secara UI lokal**, RV-02: **closed untuk halaman operasional yang diperiksa**, RV-03: **closed melalui rujukan dokumen warna terbaru**. Temuan tambahan RV-04 **P3**, fallback mine anonim tidak mempunyai h1 pada `9d67c3a`: root menambah h1 pada mine, notifications anonim dan report tidak aktif tanpa mengubah behavior. Dua cabang pertama diperiksa langsung melalui HMR; mine diperiksa ulang di produksi final; cabang report tidak aktif dibaca dari actual diff karena CTA normal dinonaktifkan pada wilayah tidak aktif. **RV-04 closed dengan batas source-only pada cabang report inactive.** Tidak ditemukan blocker UI baru dalam jalur yang benar-benar diuji.

Retest penutup **0f9d**, build produksi `zfvmZPUfSGa7gDy7IBFJ4`, port 3004 baru:

| Pemeriksaan penutup | Hasil / bukti |
| --- | --- |
| Fresh `/preview` → Laporan saya anonim | Tepat satu h1 Laporan saya; petunjuk masuk tetap. `final-19-prod-anonymous-mine.jpg` |
| Beranda 1440×900, 768×900, 390×844, 360×800 | Tidak meluap horizontal; scrollWidth masing-masing 1425/753/375/345, semuanya ≤ innerWidth. `final-20-prod-1440.jpg`, `final-20-prod-768.jpg`, `final-20-prod-390.jpg`, `final-20-prod-360.jpg`, `final-viewport-reduced.json` |
| Reduced motion final | Intro animation none, opacity 1 dan scrollBehavior auto di keempat ukuran |
| Keyboard menu final 360 | Enter membuka dan fokus Beranda; Escape menutup dan fokus Buka navigasi |
| Reflow setara zoom 200% | Emulasi viewport 720×450 CSS px, DPR 2 menghasilkan raster 1440×900; teks/CTA utuh, scrollWidth705≤720 dan menu fokus terlihat. `final-21-emulated-200-reflow.jpg`. Ini emulasi reflow, bukan perubahan zoom toolbar browser desktop atau uji semua halaman |
| JavaScript dinonaktifkan lalu reload | Konten beranda/jadwal SSR terlihat; `final-22-prod-no-js.jpg`. Interaksi tidak diuji tanpa skrip |
| `/ui-test` produksi | UI 404; fixture development tidak tersedia pada build produksi |
| Console setelah fresh penutup | 0 warn/error ditangkap pada window retest penutup; tidak mencakup seluruh app/Cloud |

Cache/jaringan/CPU, media reduced dan scripting dipulihkan sesudah percobaan. Setelah retest penutup runtime browser ter-reset dan inventory alat kosong; cleanup override ukuran/tab sementara tidak dapat dikonfirmasi melalui alat pada panggilan terakhir. Tidak ada pengaturan browser atau intersepsi yang sengaja dipakai sebagai konfigurasi pengguna; koordinator menerima informasi ini untuk membuka ulang hasil akhir dengan viewport normal.

### Cakupan akhir peran dan batas verifikasi

| Peran | P0/P1 yang diperiksa di browser final | Yang masih source-only / belum nyata |
| --- | --- | --- |
| Publik | Beranda/jadwal/region/insiden preview; empat viewport pada putaran awal; mine anonim final | Autentikasi sungguhan; saran GPS berhasil dan akurasi batas geografis; jaringan peta gagal terkontrol belum berhasil disimulasikan |
| Reporter | Form kategori/patokan/waktu/foto, invalid/retry, submit MOCK, mine, join/leave/capacity error, notifikasi berisi dan sesi habis | Feedback/reopen disediakan kode tetapi submit browser belum dijalankan; upload Storage, signed photo URL, persist dua akun dan email konfirmasi belum diuji |
| Worker | Offered accept/reject controls, accepted kendala, returned reason, evidence dengan tujuan/foto MOCK | Accept/reject tidak seluruhnya dikirim; State transition/ownership nyata belum diuji oleh Reviewer |
| Coordinator | Validasi/duplikat/reject form, command error/retry, reassign controls, review needs-fix MOCK, recurrence/prevention, ringkasan periode/CSV href, kegiatan logistik | Reopen, schedule manager/exception/run, draft/transport/publish/duty/complete event dan prevention submit/evaluate dibaca source; tidak seluruhnya diklik atau dikirim final |
| Admin | Menu, region disclosure, membership form, moderation/history controls, notifikasi kosong | Penunjukan/cabut/moderasi persist dan RLS provider nyata belum diuji |

Tabel awal F01–F10 merupakan pemetaan source+UI, bukan klaim seluruh alur berfungsi pada Cloud. Tidak ada login atau akun Cloud, seed Cloud, migrasi Cloud, cache foto antar akun, race kapasitas nyata, laptop kedua atau backup/restore nyata di audit Reviewer. Hasil SQL/HTTP terisolasi tersedia di laporan Security; hasil tersebut tetap bukan integrasi Supabase. Rencana uji Cloud: proyek pengujian terpisah berdata sintetis yang disetujui, lima peran, dua wilayah, upload/fetch lintas akun, alur laporan→validasi→tugas→bukti→review→feedback/reopen, kapasitas paralel serta ekspor scope; jalankan setelah target tersedia tanpa menulis secret ke laporan/Git.

### Aksesibilitas, gerak, gambar dan performa

Label form, feedback teks dan status kata/icon diperiksa. Focus ring tampak pada tanggal ringkasan (`final-13`) dan menu mobile pada audit awal memberi fokus awal serta Escape mengembalikan fokus. Error photo final terhubung ke input; sesi habis mempunyai judul serta tindakan. H1 akhir diperiksa untuk beranda, region, reporter report/mine, worker, coordinator, kegiatan, prevention, summary, admin dan notification; fallback report inactive hanya source-check. Ini bukan audit pembaca layar seluruh halaman atau sertifikasi WCAG.

Tiga belas pasangan kontras dari CSS nyata diukur pada `contrast-selected-states.json`: teks/ivory 13,48:1, muted 5,97:1, tombol primary 7,52:1 dan semua pasangan teks terpilih minimum 5,30:1. Fokus/ivory 6,15:1. Ini sampel normal/hover/disabled/status/fokus, bukan seluruh kombinasi/foto. Beranda 360/390/768/1440 tidak meluap pada pemeriksaan awal dan final, form pelapor 360 dan kegiatan 360 diperiksa final; belum semua form panjang per ukuran, zoom toolbar desktop, keyboard keseluruhan, screen reader dan HP fisik. Reflow emulasi 200% diuji pada beranda penutup. Reduced motion/no-JS SSR diulang final dan konten tetap terlihat; interaksi JS tidak diklaim bekerja tanpa skrip.

Peta lazy import hanya saat diperlukan; placeholder Memuat peta… dan patokan manual terlihat final. GPS error manual diuji; gagal memuat ubin peta belum teruji dinamis karena perintah blocking CDP tidak didukung. Kode fallback manual dibaca, jangan menyamakan source check dengan bukti jaringan gagal. Ilustrasi hero WebP 89.304 byte, 1000×447; foto privat memakai proxy unoptimized sehingga tidak dipublikasikan ke optimizer global.

Satu sampel fresh produksi `9d67c3a` pada localhost `/preview`: cache browser dinonaktifkan, latensi 150ms, download 204.800 B/s, upload 102.400 B/s, CPU throttling 4×. Dari timestamp request dokumen: **FCP 703,5ms, DOMContentLoaded 769,0ms**. Bukti event CDP `final-production-network-sample.json`. Pengukuran berakhir sebelum seluruh loadingFinished; bukan total transfer/rata-rata/p95, bukan LCP/CLS/INP atau waktu tugas siap. Flag cache/jaringan/CPU dikembalikan. Hasil ini tidak cukup membuktikan NF07 <3 detik pada perangkat nyata atau backend Cloud.

Metrik build root di `output/audit/build-metrics-final.json`, diperbarui untuk `0f9d`: Node 24.21.0, Windows x64, Intel i5-13450HX/16 logical CPU/28 GiB; semua 12 chunk JS **818.003 raw/248.793 gzip**, satu CSS 37.521 raw/8.138 gzip. **Jumlah semua chunk bukan payload satu route**. Bundle dan hero terkendali untuk prototipe, tetapi lapangan memerlukan uji latency Cloud, perangkat kelas rendah dan foto lebih banyak. Tidak menyatakan CLS/FPS yang tidak diukur.

### Skor akhir produk demo

| Aspek | Skor 1–5 | Dasar dan keyakinan |
| --- | --- | --- |
| Visual | 4 | Hero/palet/logo/ruang konsisten, informasi jadwal utama mudah dibaca; tinggi pada viewport/screen yang diperiksa |
| Navigasi | 4 | Jalur publik dan menu lima peran ditemukan, fokus menu mobile kembali setelah Escape; sedang, seluruh keyboard form belum diuji |
| Kemudahan tugas | 4 | Pelapor, worker dan coordinator menemukan formulir dan next action; sedang dalam MOCK, belum uji pengguna tanpa bantuan |
| Feedback/recovery | 4 | Blank 401 ditutup; HTML503/network/422/401 menjaga input, workspace503 hilangkan data basi; tinggi pada kasus explicit MOCK |
| Konsistensi peran | 4 | Status/form/action seragam, hero tidak mendominasi ruang worker/coordinator; sedang karena payload role sintetis |
| Aksesibilitas | 4 | Heading page, label, error association, status teks, fokus dan kontras sampel memadai; sedang, bukan audit assistive technology lengkap |
| Performa | 3 | FCP/DCL lokal terukur dan aset terbatas/lazy map; keyakinan rendah untuk HP/Cloud, LCP/CLS/INP belum diukur |

Skor audit tidak sama dengan kepuasan/keberhasilan tugas pengguna. **Kesiapan demo lokal: layak dengan label pratinjau/MOCK dan batas fitur. Kesiapan operasional dengan Supabase Cloud: belum dapat dinyatakan**, walaupun unit/SQL/HTTP lokal lulus.

### Bukti visual perbaikan

Sesi habis sebelum perbaikan:

![Baseline main kosong sesudah workspace401](D:/Project/Lomba_UIN/web/output/audit/reviewer/04-session-expired-before.jpg)

Sesi habis sesudah perbaikan:

![Final panel sesi habis dengan tindakan pemulihan MOCK](D:/Project/Lomba_UIN/web/output/audit/reviewer/final-01-session-expired.jpg)

Input tetap tersedia saat HTML503:

![Final pesan layanan ramah dan alasan tetap terisi MOCK](D:/Project/Lomba_UIN/web/output/audit/reviewer/final-02-html503-input-preserved.jpg)

Keikutsertaan kegiatan sintetis:

![MOCK terdaftar dengan tugas dan tombol batal](D:/Project/Lomba_UIN/web/output/audit/reviewer/final-07-event-joined.jpg)
