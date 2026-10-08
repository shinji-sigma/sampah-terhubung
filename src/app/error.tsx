"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="main-content">
      <h1>Halaman belum dapat dimuat</h1>
      <p>
        Periksa koneksi dan coba lagi. Isian yang belum dikirim belum tersimpan.
      </p>
      <button className="button primary" onClick={reset}>
        Coba lagi
      </button>
    </main>
  );
}
