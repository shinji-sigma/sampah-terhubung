# Panduan pengguna dan urutan demo

## Pengunjung

1. Klik **Wilayah Saya**, cari kawasan, lalu pilih. Pilihan tersimpan pada perangkat. GPS hanya menyarankan kawasan; konfirmasi Anda tetap diperlukan. Menolak GPS tidak menghalangi pemilihan manual.
2. Buka **Jadwal angkut**, pilih tanggal awal, baca layanan, jam WIB, sumber konfirmasi, masa berlaku, perubahan tanggal, dan pelaksanaan aktual. “Belum dikonfirmasi” bukan janji layanan.
3. Baca insiden yang sudah divalidasi dan kegiatan publik. Laporan privat, identitas, dan foto tidak ditampilkan kepada pengunjung.

## Pelapor

1. Masuk dengan email/password atau daftar sebagai pelapor dan konfirmasikan email.
2. Pilih wilayah aktif, lalu **Buat laporan**. Isi kategori, waktu pengamatan, patokan, deskripsi, dan 1–3 foto JPG/PNG/WebP (maksimal 5 MB masing-masing). Pilih koordinat lewat peta bila tersedia; patokan tetap wajib.
3. Hindari wajah, pelat kendaraan, dan bagian rumah yang tidak diperlukan. Foto diproses server dan metadata EXIF/GPS dibuang.
4. **Laporan saya** menunjukkan nomor, status, riwayat, alasan penolakan bila ada, dan bukti penanganan yang boleh dibaca. Dua pelapor tetap mempunyai laporan masing-masing ketika ditautkan ke satu insiden.
5. Kirim tanggapan jika penanganan perlu ditinjau. Tanggapan tidak langsung mengubah status petugas.
6. Pada kegiatan yang masih membuka pendaftaran, daftar atau batalkan. Sistem mencegah peserta ganda dan kursi melebihi kapasitas.

Kesalahan server tampil pada kolom terkait. Bila jaringan gagal, isian tetap tersedia untuk dicoba lagi selama halaman tidak ditutup/dimuat ulang. Jangan menganggap pesan gagal sebagai berhasil. Backend memakai kunci pengiriman untuk menghindari duplikasi saat permintaan diulang.

## Koordinator

1. Buka **Ruang kerja**. Periksa foto dan lokasi laporan. Untuk kejadian yang sama, pilih **insiden terbuka** pada validasi; untuk kejadian baru sesudah penanganan sebelumnya, pilih **titik lama** dan tulis patokan publik yang aman. Menolak memerlukan alasan.
2. Pilih petugas aktif dan perkiraan waktu tindak lanjut. Penugasan tetap “Ditugaskan” sampai petugas menerima dan mulai. Penolakan mengembalikan insiden ke “Terverifikasi”; penugasan ulang tetap menyimpan riwayat.
3. Saat “Menunggu verifikasi”, periksa foto, waktu, tindakan, dan tujuan pengangkutan. Centang persetujuan untuk menutup; tanpa centang, kembalikan dengan alasan.
4. Membuka kembali insiden selesai hanya untuk pekerjaan lama yang belum benar-benar selesai. Sistem mempertahankan ID insiden dan tidak menambah kejadian berulang.
5. Pada **Jadwal**, buat aturan, ganti aturan mulai tanggal baru, tambahkan perubahan satu tanggal, atau catat aktual. Aturan historis dan perubahan tidak dihapus.
6. **Pencegahan** menunjukkan kejadian berbeda dalam periode konfigurasi wilayah. Catat dugaan (“Perlu konfirmasi”), dasar, tindakan, PIC, tanggal evaluasi, dan hasil. Tidak ada kesimpulan otomatis tentang kesalahan warga/petugas.
7. **Kegiatan**: buat draf, lengkapi pengangkut/waktu/tujuan, konfirmasi, kemudian terbitkan. Tetapkan tugas peserta. Catat hasil, foto, dan pengangkutan. Selesai kegiatan tidak otomatis menutup insiden.
8. **Ringkasan wilayah** membedakan laporan dikirim dalam periode dari insiden divalidasi dalam periode. CSV hanya mencakup wilayah yang diizinkan dan tidak berisi kontak pelapor.

## Petugas

1. Buka **Ruang kerja**. Pilih **Terima dan mulai tugas** atau tolak dengan alasan.
2. Catat kendala tanpa mengubahnya menjadi penutupan.
3. Kirim foto sesudah, waktu pekerjaan, tindakan, serta tujuan jika sampah dipindahkan. Status menjadi “Menunggu verifikasi”.
4. Bila koordinator meminta perbaikan, lengkapi bukti. Bukti lama tetap tersimpan.
5. Catat pelaksanaan jadwal yang menjadi tanggung jawab Anda. Perubahan rencana jadwal tetap dilakukan koordinator.

## Administrator

Kelola status wilayah dan parameter tinjauan titik. Tetapkan/cabut peran untuk akun yang sudah terdaftar setelah pemeriksaan manusia. Sembunyikan atau pulihkan konten dengan alasan; riwayat operasional tidak dihapus. Konten belum tervalidasi selalu privat.

## Demo dua laptop

Gunakan backend Cloud yang sama. Laptop pertama masuk sebagai pelapor/koordinator; laptop kedua masuk sebagai petugas dengan URL localhost masing-masing. Refresh untuk melihat perubahan terbaru (belum ada realtime subscription). Jangan menyalin folder node_modules atau .next dari satu laptop ke laptop lain.

Urutan demonstrasi: jadwal tanpa login → laporan baru → koordinator validasi dan tautkan laporan kedua → tugaskan → petugas tolak sekali dengan alasan → koordinator tugaskan ulang → petugas terima/catat kendala/kirim bukti → koordinator periksa → pelapor tanggapi → titik berulang dari seed → pencegahan → kegiatan yang punya pengangkutan → ringkasan/CSV.

Skenario seed dan aksi demo tetap **Data simulasi**. Demo tidak membuktikan dampak pada penumpukan nyata, kemitraan, ataupun pengangkutan pemerintah.
