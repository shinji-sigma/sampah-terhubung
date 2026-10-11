# Audit, perbaikan dan verifikasi Sampah Terhubung

Audit awal 10 Oktober; penyelesaian 11 Oktober 2026 (WIB). Koordinator adalah satu-satunya penulis kode aplikasi. Sub-agent **Reviewer** dan **Security** benar-benar dijalankan paralel pada baseline, lalu membaca diff dan menguji ulang snapshot kode akhir secara independen.

## Snapshot dan batas

- Branch `codex/sampah-terhubung-local`; HEAD awal `541a2ad4b63453aaadfa9e3288c454965d0baa6f`, status awal bersih.
- Perbaikan utama `9d67c3a`; HEAD kode akhir untuk kedua agent: **`0f9d0558756a25e1f8b3fa1a8735972517fcc87e`**, menambahkan heading pada tiga fallback terakhir yang ditemukan Reviewer. Commit laporan sesudahnya hanya mengemas bukti; ID packaging dapat dibaca dengan `git log -1`.
- `.env.local` ada, tetapi URL/publishable/server secret/password demo belum terisi menurut pemeriksaan boolean. Nilai rahasia tidak dibuka atau ditampilkan. Cloud tidak diuji.
- Server audit loopback milik koordinator: produksi **3004** (sesi final 66937), development **3005** (8117, fixture sintetis, dihentikan setelah retest). Server awal dihentikan sendiri sebelum rebuild. Port **3000** milik proses lain tidak diubah; port audit tidak mengganti konfigurasi deployment pengguna.
- Hash PRD, riset, pustaka, palet/kontras sumber dan logo sumber tetap sama (`output/audit/protected-sources-final.json`). Personal AI tidak disentuh. Tidak ada push, deploy, tunnel, instalasi plugin/layanan, atau mutasi Cloud.

## Temuan gabungan dan patch

| Prioritas | Temuan baseline terkonfirmasi | Perbaikan |
| --- | --- | --- |
| P2 S01 | SQL NULL mengizinkan petugas mencatat jadwal tanpa penugasan | Izin gagal secara tertutup; unassigned/other/inactive worker ditolak |
| P2 S02 | RPC menerima bukti/kegiatan tanpa waktu; tugas bisa tersangkut menunggu pemeriksaan | Waktu wajib sebelum perubahan status/foto; bukti sah tetap diterima |
| P2 S04 | Petugas nonaktif mendapat catatan pekerjaan privat baru | Penerima petugas harus memiliki membership aktif; riwayat lama dipertahankan |
| P2 S06 | PostgreSQL nonfinite dapat merusak rendering tanggal | SQL memeriksa finite/rentang tahun; formatter memberi fallback untuk data lama tidak valid |
| P2 RV01 | Sesi habis meninggalkan ruang kerja kosong | Pesan sesi, panel akses, tombol masuk/muat ulang; workspace basi dihapus ketika gagal dimuat |
| P2 RV02 | Halaman operasional tidak mempunyai heading utama | Page h1, section beranda h2; ukuran visual dipertahankan |
| P3 S03 | Tabel jadwal/aktual publik mengungkap UUID petugas/aktor | Detail dibatasi RLS; kalender publik tetap melalui proyeksi tanpa identitas |
| P3 S05 | Respons API gagal tidak memberi cache privat | Semua cabang failure memakai `private, no-store` |
| P3 RV03 | Arsitektur menyebut palet lama | Riwayat ditandai dan keputusan hero terbaru dirujuk, PRD dipertahankan |
| P3 RV04 | Fallback tanpa sesi/wilayah aktif belum mempunyai h1 | Judul Buat laporan, Laporan saya dan Pemberitahuan ditambahkan; pesan/izin tetap sama |

Recovery tambahan: HTML/non-JSON layanan menjadi pesan yang dapat dipahami dengan isian tetap tersedia; error foto terhubung ke deskripsi aksesibel; scroll navigasi menghormati reduced motion. Navbar, hero, SHINFRAME, palet dan P0/P1 dipertahankan. Tidak ada P0/P1 keamanan terkonfirmasi dalam audit ini; bukan jaminan tidak ada celah lain.

Migrasi **tambahan** `202610100003_audit_controls.sql` mempertahankan data serta gateway transaksi yang ada. 001/002 tidak diubah. Migrasi belum diterapkan pada Cloud. Jika backend pernah memakai versi lama, operator perlu meninjau tugas/kegiatan tanpa waktu dan notifikasi nonaktif; audit tidak memperbaiki data Cloud otomatis.

## Hasil pemeriksaan

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| Tes baseline | 26/26 lulus sebelum patch |
| Tes akhir koordinator | **31/31 lulus**, log `output/audit/tests-final.txt` |
| Lint / typecheck / build produksi | Lulus; build ID pada `output/audit/build-metrics-final.json` |
| Retest Security independen | **41/41 probe SQL** positif/negatif; **13 pemeriksaan HTTP produksi**; suite 31/31 lulus lagi pada source yang sama |
| Retest Reviewer akhir | Actual diff `0f9d055`, preview produksi baru, empat viewport, reflow emulasi 200%, reduced motion/no-JS SSR, fixture 404; tidak ada blocker baru pada jalur yang diperiksa |
| Supabase Cloud integration | **Tidak dijalankan**: konfigurasi/target proyek pengujian sintetis belum tersedia |
| Backup/restore dan laptop kedua | **Belum diuji**; prosedur tersedia, bukan bukti berhasil |

SQL memakai PGlite dengan stub Auth/Storage dan satu koneksi serial. Ini tidak membuktikan signature JWT, cookie/provider nyata, Storage ACL atau race antarkoneksi. HTTP membuktikan fixture produksi 404, header/Origin/body limits dan penanganan tanpa konfigurasi; tidak membuktikan request akun nyata.

Retest Reviewer, matriks peran, langkah browser dan skor final: [REVIEW_KODE_UI_UX.md](REVIEW_KODE_UI_UX.md). Model ancaman, izin, enam temuan dan retest: [SECURITY_REVIEW.md](SECURITY_REVIEW.md). Screenshot baru sebelum/sesudah dan bukti terisolasi di `output/audit/reviewer/` dan `output/audit/security/`.

Reviewer menilai demo **4/5** untuk visual, navigasi, kemudahan tugas, recovery, konsistensi peran dan aksesibilitas; **3/5** performa, dengan keyakinan rendah untuk HP/Cloud. Browser memeriksa publik, pelapor, petugas, koordinator dan admin dengan payload sintetis. Submit laporan/bukti, retry, keikutsertaan kegiatan dan pemulihan sesi teramati dalam MOCK; beberapa operasi seperti evaluasi pencegahan, jadwal pengelola dan reopen hanya diperiksa dari source/SQL, belum seluruhnya dikirim di browser. Kemampuan pengguna menyelesaikan tugas nyata tanpa bantuan belum diukur.

Pemeriksaan reflow merupakan emulasi viewport/DPR, bukan zoom toolbar desktop. Cache/jaringan/CPU/media/script dikembalikan Reviewer; penutupan tab dan reset terakhir device metrics tidak dapat dikonfirmasi karena runtime alat browser reset. Keterbatasan ini dicatat pada laporan Reviewer; bukan klaim adanya regresi aplikasi.

Satu sampel produksi pada `9d67c3a`, cache browser mati, latensi 150 ms, download 204.800 B/s, upload 102.400 B/s dan CPU 4× menunjukkan **FCP 703,5 ms / DOMContentLoaded 769,0 ms**. Ini bukan LCP/CLS/INP, waktu seluruh foto/data siap, rata-rata atau bukti SLA perangkat lapangan. Patch heading akhir dibangun ulang; sampel tersebut tidak diberi label benchmark commit terbaru.

Pengukuran build akhir `zfvmZPUfSGa7gDy7IBFJ4`: seluruh 12 chunks JS **818.003 byte raw / 248.793 gzip**; CSS **37.521 / 8.138 byte**. Hero WebP **89.304 byte**, 1000×447. Ini semua chunks, bukan payload satu route. Lingkungan Windows x64, Node 24.21.0, i5-13450HX, 16 logical CPU, RAM 28 GiB. Ukuran browser dan batasnya dilaporkan Reviewer; tidak ada klaim HP fisik, FPS, LCP/CLS lengkap atau SLA Cloud.

## Kelayakan

**Demo lokal antarmuka simulasi:** layak, dengan label simulasi dan batas MOCK yang jelas. Akun/penyimpanan nyata serta demo dua laptop belum dapat ditunjukkan tanpa backend.

**Pengujian data asli terbatas:** belum siap dinyatakan terverifikasi. Dahulukan proyek sintetis untuk menguji Auth, foto, izin peran/wilayah, sesi dan konkurensi; tetapkan pengelola, izin foto/data dan masa simpan sebelum memakai data asli.

**Operasional masyarakat:** belum siap. Backend nyata/email, HTTPS/caching, kuota login/upload, pemantauan, tata kelola, latihan restore database **dan objek foto**, serta uji pengguna/perangkat masih diperlukan.

Pemilik menyiapkan proyek Supabase pengujian khusus dan mengisi `.env.local` secara privat sesuai [panduan Cloud](../SUPABASE_CLOUD.md). Pada proyek kosong, migrasi **001 → 002 → 003**; pada proyek lama hanya tambahan yang belum diterapkan setelah meninjau target/backup. Seed/integration hanya pada target sintetis yang jelas diizinkan. Uji setiap peran, ID foto/ekspor lintas akun/wilayah, logout/expiry, alihtugas/membership nonaktif, retry laporan, kapasitas kegiatan dan restore. Laptop kedua mengikuti clone **`D:\WebDemo`**, backend Cloud yang sama, tanpa Docker.

## Artefak native dan provenance

Plugin Codex Security juga menyelesaikan laporan native baseline `541a2ad`, scan ID `c88a04c9-d84b-47d8-8179-dea7daa25ff2`, coverage **partial**. Perbedaan HEAD yang diperingatkan plugin terjadi karena patch aplikasi yang diotorisasi. Status kode terbaru dibuktikan oleh retest independen dalam laporan utama, bukan dengan menganggap baseline sebagai source akhir.

- [Laporan native](C:/Users/user/.codex/state/plugins/codex-security/scans/web/541a2ad4b63453aaadfa9e3288c454965d0baa6f_20261010T135501Z_inn5iah1/report.md)
- [Model ancaman native](C:/Users/user/.codex/state/plugins/codex-security/scans/web/541a2ad4b63453aaadfa9e3288c454965d0baa6f_20261010T135501Z_inn5iah1/threatmodel.md)
- [Findings JSON](C:/Users/user/.codex/state/plugins/codex-security/scans/web/541a2ad4b63453aaadfa9e3288c454965d0baa6f_20261010T135501Z_inn5iah1/findings.json), [coverage JSON](C:/Users/user/.codex/state/plugins/codex-security/scans/web/541a2ad4b63453aaadfa9e3288c454965d0baa6f_20261010T135501Z_inn5iah1/coverage.json), [manifest JSON](C:/Users/user/.codex/state/plugins/codex-security/scans/web/541a2ad4b63453aaadfa9e3288c454965d0baa6f_20261010T135501Z_inn5iah1/scan-manifest.json)

Erratum S05: kutipan source helper HTTP pada laporan native memakai versi setelah patch. Bukti baseline yang benar adalah `output/audit/security/http-baseline-source.txt` dan `initial-http-probes.json`; bukti sesudah patch adalah `final-http-probes.json`. Narasi temuan dan reproduksi HTTP benar. Artefak native yang disegel tidak diubah; erratum dijelaskan pada laporan Security utama.

Metering yang dikembalikan plugin bersumber dari **seluruh riwayat satu chat** (`codex_rollout`, threadCount 1, coverage complete): input **8.549.003**, termasuk cached input **8.368.896**; output **26.205**, termasuk reasoning output **5.957**; total **8.575.208 token**. Ini bukan pengukuran biaya atau konsumsi khusus audit ini; cached/reasoning merupakan bagian hitungan, tidak ditambahkan lagi ke total.
