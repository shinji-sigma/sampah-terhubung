import sharp from "sharp";

const source = await sharp("../desain/eksplorasi-2026-10-09/gabungan-hero.png")
  .resize(1440, 1024, { fit: "fill" })
  .png()
  .toBuffer();
const rendered = await sharp("output/hero-design/after/desktop-home.jpg")
  .png()
  .toBuffer();

async function compare(name, left, right, width, height) {
  await sharp({
    create: { width: width * 2, height, channels: 3, background: "#ffffff" },
  })
    .composite([
      { input: left, left: 0, top: 0 },
      { input: right, left: width, top: 0 },
    ])
    .jpeg({ quality: 92 })
    .toFile("output/hero-design/" + name + ".jpg");
}
await compare("comparison-final", source, rendered, 1440, 1024);
for (const [name, region] of [
  ["comparison-brand", { left: 40, top: 10, width: 500, height: 80 }],
  ["comparison-copy", { left: 40, top: 115, width: 660, height: 310 }],
  ["comparison-services", { left: 40, top: 525, width: 980, height: 490 }],
]) {
  await compare(
    name,
    await sharp(source).extract(region).png().toBuffer(),
    await sharp(rendered).extract(region).png().toBuffer(),
    region.width,
    region.height,
  );
}
