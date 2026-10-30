# Uji pengguna jarak jauh dan SUS

Disetujui pengguna dalam percakapan: hilangkan Panduan & SUS dari navbar, perjelas Masuk, sediakan /uji-pengguna dan /evaluasi dengan form SUS di Supabase. Tidak mengirim WA otomatis.

## Kebutuhan
- Navbar tetap memiliki Masuk terlihat pada desktop/mobile. /panduan dipertahankan di footer.
- /uji-pengguna: persetujuan sukarela, instruksi 10–15 menit, kode peserta acak nonidentitas, tugas cek jadwal, masuk/daftar akun sendiri, kirim laporan simulasi melalui bukti pendukung/gambar contoh, lihat status, isi evaluasi meskipun tugas gagal.
- Peserta di luar area tidak diminta berpindah lokasi atau GPS rumah. Pilih Kawasan Hijau A · Simulasi dan bukti pendukung; lokasi/patokan adalah skenario contoh, bukan kejadian nyata. Jangan memberi klaim layanan aktif. Jangan memperluas jangkauan layanan nyata atau memakai koordinat perangkat palsu.
- /evaluasi: 10 pertanyaan SUS (positif ganjil, negatif genap), Likert 1–5, semua wajib, persetujuan, device, hasil tugas (berhasil/bantuan/gagal/tidak mencoba), komentar opsional. Tanpa nama/email/WA. Jangan menyimpan email/IP/user-agent sebagai identitas peserta.
- Label: Penilaian System Usability Scale (SUS). Jujur: instrumen evaluasi, bukan hasil; skor belum tersedia sampai respons nyata. Tidak mengklaim 81.5, Grade A, sampel 15–20 sebagai hasil atau syarat universal. Nilai 0–100 bukan persen keberhasilan.
- Simpan ke tabel terpisah study_responses; anonymous tidak bisa SELECT/UPDATE/DELETE. Validasi server, origin, ukuran payload, jawaban tepat 10 integer 1–5, idempotensi submission UUID dan deduplikasi, honeypot/batas yang layak. Jangan membuka endpoint daftar hasil publik. Ringkasan/admin hanya berdasarkan respons nyata dan audit.
- Simpan hanya persetujuan, versi instrumen, kode acak/submission ID, waktu server, perangkat kategori, hasil tugas, jawaban, skor server, komentar terbatas. Larang data pribadi di komentar dengan instruksi, beri masa simpan 90 hari dan cara permintaan penghapusan melalui penyelenggara memakai kode peserta. Peringatan data isian laporan tersimpan di proyek simulasi.
- Tambah forward SQL migration, tes RED/GREEN, lint/typecheck/build dan browser mobile/desktop, verifikasi storage pada Cloud tanpa mengarang hasil.

## Bug login prioritas
APP_ORIGIN produksi masih domain lama sedangkan domain aktif sampah-terhubung.vercel.app. Repro POST /api/auth {} dari origin baru 403 dan origin lama 422. Update config ke domain kanonis lalu redeploy. Jangan melonggarkan origin checker atau menerima origin arbitrer. Tautan uji memakai domain kanonis. Verifikasi redirect Auth Supabase terpisah.

## Akses admin
Email contoh terdokumentasi admin@demo.invalid. Password tidak boleh ditebak/diumumkan/disalin ke chat. Nilai DEMO_PASSWORD lokal belum membuktikan password Cloud cocok; gunakan uji terkontrol atau pemilik reset melalui mekanisme aman. Jangan bagikan admin ke peserta.
