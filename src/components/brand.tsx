import Image from "next/image";

export function BrandLogo() {
  return (
    <Image
      src="/brand/shinframe.png"
      alt="SHINFRAME"
      width={2172}
      height={724}
      unoptimized
      loading="eager"
      className="brand-logo"
    />
  );
}
