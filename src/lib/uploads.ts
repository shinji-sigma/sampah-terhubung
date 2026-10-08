import sharp from "sharp";
import { HttpError } from "./http";
export async function validateImage(bytes: Buffer, mime: string) {
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024)
    throw new HttpError("Ukuran foto harus 1 byte sampai 5 MB.", 422);
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime))
    throw new HttpError("Gunakan foto JPG, PNG, atau WebP.", 422);
  try {
    const image = sharp(bytes, {
      limitInputPixels: 25000000,
      failOn: "warning",
    });
    const meta = await image.metadata();
    const expected: Record<string, string> = {
      "image/jpeg": "jpeg",
      "image/png": "png",
      "image/webp": "webp",
    };
    if (meta.format !== expected[mime] || (meta.pages ?? 1) > 1)
      throw new Error("Invalid format");
    // Decode and re-encode, stripping EXIF/GPS and executable or trailing payloads.
    return await image
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    throw new HttpError("Isi foto tidak dapat dibaca. Pilih foto lain.", 422);
  }
}
