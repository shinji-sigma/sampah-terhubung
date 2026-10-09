# QA visual — hero dan navbar Sampah Terhubung

Tanggal: 9 Oktober 2026. Ruang lingkup: implementasi visual atas baseline `268136b`; bukan validasi Supabase Cloud.

## Target, keadaan, dan normalisasi

- Sumber visual: `D:\Project\Lomba_UIN\desain\eksplorasi-2026-10-09\gabungan-hero.png`, 1487×1058 px; konsep pendamping `KONSEP_GABUNGAN_HERO.md`.
- Implementasi: `http://localhost:3001/preview`, beranda publik Data simulasi, sumber tertutup, keadaan akhir hero. Screenshot: `output/hero-design/after/desktop-home.jpg`, 1440×1024 px.
- CSS viewport 1440×1024, density 1 untuk capture akhir. Sumber dinormalisasi ke 1440×1024 (rasio hampir sama); browser chrome dikeluarkan. Gutter scrollbar dapat mengambil 15 px dari lebar konten.
- Tanggal dan waktu dari aplikasi, bukan disalin permanen dari gambar. Timestamp validasi berbeda dari mockup; ini perbedaan data yang diterima. Subjudul produk tetap netral tanpa mengklaim layanan/pilot Surabaya.
- Full-view side-by-side: `output/hero-design/comparison-final.jpg`, 2880×1024, **sumber kiri / aplikasi kanan**, dibuka bersama untuk penilaian.
- Detail: `comparison-brand.jpg` 1000×80, `comparison-copy.jpg` 1320×310, dan `comparison-services.jpg` 1960×490. Detail brand/copy telah dibuka; services dibuka lagi setelah perbaikan kepadatan akhir.
- Ponsel: `after/mobile-home.jpg` 360×800 dan `after/mobile390-home.jpg` 390×844. Tidak ada mockup ponsel baru: adaptasi dinilai terhadap aturan tertulis pengguna, bukan diklaim sebagai pencocokan pixel dengan gambar desktop.
- Sebelum: `before/desktop-home.jpg`, `before/mobile-home.jpg`, `before/mobile390-home.jpg`, diambil dari build baseline sebelum revisi.

## Temuan dan riwayat perbaikan

1. **[P2, selesai] Hero dan jadwal terlalu jauh ke bawah.** Iterasi pertama (`after/desktop-iteration1.jpg`, `comparison-iteration1.jpg`) memiliki hero 354,5 px dan penanganan mulai sekitar y=929. Referensi menggabungkan hero ringkas dan jadwal langsung setelah wilayah. Padding desktop dipadatkan; judul/link jadwal yang mengulang navbar/CTA dipindahkan menjadi heading pembaca layar. Kalender, layanan dan sumber tetap tersedia. Capture pertama masih berada pada fase entrance untuk ilustrasi; penilaian iterasi ini hanya untuk layout yang tidak dianimasikan. Kualitas/fidelity aset dinilai dari capture akhir.
2. **[P2, selesai] Jadwal berikutnya dan daftar insiden masih terlalu tinggi.** Iterasi kedua (`after/desktop-iteration2.jpg`, `comparison-iteration2.jpg`, `comparison-services-iteration2.jpg`) masih memotong isi baris insiden kedua di viewport desktop. Baris jadwal berikutnya dipadatkan, tanggal dan bulan diletakkan sejajar, tanggal pertama menjadi 80 px, dan padding daftar penanganan diperkecil tanpa mengecilkan metadata di bawah 14 px. Bukti akhir: `comparison-services.jpg`; dua lokasi/referensi/waktu/status terbaca pada layar awal. Hero akhir 326,5 px; penanganan mulai y≈827. Batas bawah panel kedua sekitar y=1025; 1 px border adalah P3, bukan informasi yang tersembunyi.
3. **[P2, selesai] Akun koordinator jatuh ke baris ketiga navbar.** `after/desktop-coordinator-iteration1.jpg` memperlihatkan navbar terlalu tinggi. Grid desktop untuk menu peran menempatkan identitas/akun pada baris pertama, semua menu pada baris kedua. `after/desktop-coordinator-mock.jpg` sudah dibuka dan memperlihatkan perbaikan; menu lengkap, akun, dan ruang kerja tetap tersedia. Ponsel memakai menu buka/tutup.
4. **[P1, selesai] Streaming menutupi seluruh isi ketika JavaScript mati.** Inspeksi DOM awal membaca HTML yang masih tersembunyi di boundary streaming. Pemeriksaan screenshot sebelum commit (`after/desktop-no-javascript-iteration1.jpg`) hanya menampilkan **Memuat Sampah Terhubung…**. QA dibuka kembali. Pembungkus `src/app/loading.tsx` dihapus agar server mengirim isi halaman langsung; indikator pemuatan data di dashboard, peta dan submit tetap ada. Capture produksi baru dengan eksekusi skrip dinonaktifkan (`after/desktop-no-javascript.jpg`) sudah dibuka dan memperlihatkan hero, ilustrasi, tanggal/jam, serta daftar penanganan. API/auth/RLS tidak diubah.

Tidak ada P0/P1/P2 visual yang masih memerlukan perbaikan dalam ruang lingkup ini.

## Lima permukaan fidelity

| Permukaan | Penilaian akhir dan batas |
| --- | --- |
| Font dan tipografi | Sistem font proyek sesuai instruksi pengguna, fallback Segoe UI/system-ui. Hero 52 px, weight 700, line-height 1,08; ponsel 30–32 px/1,1. Isi 16 px, dukungan hero desktop 18 px, metadata 14 px. Nama wilayah membungkus utuh. Ukuran lebih kompak dari tipografi generator diterima karena rentang eksplisit pengguna; tidak memakai font raster dari mockup. |
| Spacing dan layout | Navbar horizontal, teks kiri/ilustrasi kanan, wilayah sekali, kalender lime pertama, baris berikutnya tenang, daftar penanganan dan kolom pendukung sesuai komposisi. Radius 8–12 px dan bayangan terbatas. Hero 327 px desktop / 222 px mobile. Tidak ada overflow horizontal pada viewport dan keadaan yang diperiksa. Dua baris navbar peran merupakan adaptasi yang diperlukan untuk menjaga fitur. |
| Warna dan token | Petrol/jade/gading/sage/lime/violet terpusat; gading/putih dominan. Gradient dari generator tidak ditiru sesuai prompt. Status amber/merah/hijau/biru tetap memakai label. 12 pasangan warna termasuk hover lime, disabled, status dan fokus dihitung pada `contrast.json`; rasio terendah 5,30:1. Ini pemeriksaan pasangan datar terpilih, bukan sertifikasi seluruh aplikasi. |
| Gambar dan aset | Logo sumber utuh dan hash sama, rasio 3:1, 180/140 px. Ilustrasi raster mandiri dari ImageGen, subjek warga–petugas–koordinator serta permukiman sesuai target. Aset terpasang dan caption jelas, tanpa CSS art atau mockup sebagai gambar halaman. WebP 1000×447, 89.304 byte; crop/framing sedikit berbeda karena regenerasi mandiri, diterima. Source desktop tidak dimuat pada 360 px. Ikon library proyek dipertahankan sesuai lingkup, ukuran/stroke konsisten. |
| Copy dan isi | Judul, paragraf, CTA dan caption sesuai prompt. Petunjuk akun sesuai keadaan publik/pelapor MOCK. Tanggal berasal dari aturan aplikasi. Referensi insiden berbeda, UUID lengkap tetap di detail, timestamp publik tetap **Validasi**. Tidak ada statistik, layanan armada langsung atau mitra rekaan. Preview dan fixture tetap berlabel simulasi. |

## Interaksi dan aksesibilitas yang diperiksa

- Produksi: Enter pada CTA menuju jadwal; tidak ada hero pada jadwal, pemilih wilayah atau kegiatan. Kembali ke beranda dan memilih wilayah lagi tidak mengulang entrance.
- Menu 360 px: Enter membuka; Escape menutup dan mengembalikan fokus ke **Buka navigasi**. Fokus tampil; sumber jadwal dibuka dengan Enter pada summary (`after/mobile-source-keyboard.jpg`).
- Pencarian kawasan dan pilihan manual melalui Enter mengembalikan wilayah yang dipilih. Peta, atribusi dan GPS opsional tetap mengikuti komponen lama; tidak meminta izin GPS OS pada putaran ini.
- 360×800: tanggal pertama sampai y≈621 dan waktu sampai y≈496, hero 222,4 px; ilustrasi `display:none`, `currentSrc` kosong, **0 permintaan ilustrasi** pada reload yang diamati. 390×844 juga diperiksa.
- Koordinator/petugas/pelapor dan formulir pada desktop/mobile: fixture Data API/workspace hanya pada alat browser/dev harness, tidak tersimpan. `after/*-mock.jpg` memuat label MOCK. Menu dan kolom operasional tersedia; hero tidak ada pada ruang kerja/formulir. Petugas tidak memiliki tombol aktif terlihat dengan tinggi <44 px pada pemeriksaan DOM.
- Produksi reduced motion: animation `none`, opacity 1 pada teks/ilustrasi. Tanpa JavaScript, teks SSR dan jadwal tetap terbaca (`after/desktop-no-javascript.jpg`); tidak mengklaim kontrol JavaScript bekerja tanpa skrip.
- Simulasi produksi: latency 150 ms, down/up 200/100 KiB per detik, CPU 4×, cache disabled. CTA berfungsi sesudah skrip siap dalam mode normal dan reduced motion. Klik sebelum hidrasi belum bereaksi; angka 783 ms di `slow-network.json` hanya sampai kontrol terlihat. Tidak ada klaim HP fisik, 60 fps, LCP, atau NF07 selesai.
- Console: sesi produksi serta sesi dev bersih untuk fixture akhir memiliki 0 error/0 warning saat diperiksa. Sesi HMR awal memakai markup lama dan menghasilkan mismatch; dev direstart dan bukti peran diambil ulang dari sesi bersih.
- Guard produksi diperiksa: `/ui-test` 404, `/api/public` 503 tanpa Cloud, `/icon.svg` 200, mutasi dengan Origin palsu 403. API/auth/RLS/dependency/favicon tidak berubah.

## Checklist penerimaan dan tindak lanjut

- [x] Referensi dan hasil render dibuka dalam input perbandingan yang sama.
- [x] P2 layout/density/navbar peran diperbaiki dan dibandingkan lagi.
- [x] Desktop 1440×1024, ponsel 360×800 dan 390×844 tersimpan.
- [x] Keyboard, menu, sumber, navigasi, reduced motion dan simulasi produksi diperiksa.
- [x] Lint, typecheck, build dan 26 tes lokal lulus; bundle/aset dicatat terpisah.
- [x] PRD/riset/desain sumber/Personal AI dipertahankan; tidak ada push/publikasi.

P3 opsional: menyelaraskan ukuran blok tanggal lebih jauh bila pengguna menginginkan fidelity pixel yang lebih ketat; memastikan 1 px border panel kedua sepenuhnya masuk viewport. Tidak menghalangi informasi/tugas utama.

Belum diuji: Supabase Cloud Auth/Storage/database/RLS nyata, sinkronisasi laptop `D:\WebDemo`, HP fisik, audit screen reader penuh, dan beban data operasional. Konfigurasi Cloud masih kosong; hasil MOCK tidak membuktikan hal tersebut.

final result: passed
