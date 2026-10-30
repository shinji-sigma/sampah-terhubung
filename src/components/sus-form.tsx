"use client";
import { useState } from "react";
import { SUS_RESPONDENT_URL } from "@/lib/sus-destination";

export function WhatsAppInvite() {
  const [message, setMessage] = useState("");
  async function copyInvite() {
    const text = `Halo! Bantu mencoba Sampah Terhubung selama 10–15 menit (sukarela). Ini simulasi akademik, bukan layanan pengangkutan nyata. Anda boleh berhenti kapan saja.
Panduan akses fitur: ${window.location.origin}/uji-pengguna. Cek jadwal Kawasan Hijau A · Simulasi, coba laporan dengan gambar contoh yang disediakan, lalu lihat status. Gunakan akun sendiri bila perlu masuk. Jangan bagikan GPS rumah atau foto pribadi; bila gagal, berhenti tanpa memaksakan pengiriman.
Setelah mencoba, isi evaluasi SUS di ${SUS_RESPONDENT_URL}, termasuk jika tugas gagal atau perlu bantuan. Persetujuan ada pada Google Forms; kode peserta opsional. Balas pesan ini bila ada kendala.`;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Undangan tersalin. Belum dikirim ke siapa pun.");
    } catch {
      setMessage("Clipboard tidak tersedia. Salin tautan panduan dan Google Forms secara manual.");
    }
  }
  return <div><button type="button" className="button" onClick={copyInvite}>Salin undangan WhatsApp</button><p role="status" className="small-muted">{message}</p></div>;
}

