"use client";
import { useEffect, useState } from "react";
import { getImageProps } from "next/image";
import { ArrowRight } from "lucide-react";

const { props: illustration } = getImageProps({
  src: "/illustrations/coordination.webp",
  alt: "Warga melapor melalui ponsel, petugas menangani sampah, dan koordinator mencatat tindak lanjut di permukiman.",
  width: 1000,
  height: 447,
  sizes: "(min-width: 1200px) 600px, 50vw",
});

export function IntroHero({
  animate,
  onSeen,
  signedIn,
  onSchedule,
}: {
  animate: boolean;
  onSeen: () => void;
  signedIn: boolean;
  onSchedule: () => void;
}) {
  // Freeze the entrance choice for this mount; later data updates do not restart it.
  const [enter] = useState(() => animate);
  useEffect(() => {
    onSeen();
  }, [onSeen]);
  return (
    <section
      className={"intro-hero " + (enter ? "intro-enter" : "")}
      aria-labelledby="intro-title"
    >
      <div className="intro-copy">
        <h1 id="intro-title">
          Dari laporan warga,
          <br className="desktop-break" /> ke <mark>lingkungan terawat.</mark>
        </h1>
        <p>
          Laporkan penumpukan, cek jadwal angkut, dan ikuti penanganannya di
          wilayah Anda.
        </p>
        <div className="intro-actions">
          <button className="button lime" onClick={onSchedule}>
            Lihat jadwal wilayah <ArrowRight size={20} />
          </button>
          <span className="small-muted">
            {signedIn
              ? "Anda sudah masuk untuk melapor."
              : "Pelaporan memerlukan akun."}
          </span>
        </div>
      </div>
      <figure className="intro-illustration">
        <picture>
          <source
            media="(min-width: 901px)"
            srcSet={illustration.srcSet || illustration.src}
            sizes={illustration.sizes}
          />
          {/* No fallback URL: narrow screens never request the desktop illustration. */}
          <img
            alt={illustration.alt}
            width={illustration.width}
            height={illustration.height}
            decoding="async"
            loading="eager"
          />
        </picture>
        <figcaption>Ilustrasi koordinasi lingkungan</figcaption>
      </figure>
    </section>
  );
}
