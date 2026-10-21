import { z } from "zod";
import { evidenceTime } from "./validation";
import { HttpError } from "./http";

export function photoMetadata(raw: FormDataEntryValue | null, count: number) {
  let value: unknown;
  try {
    value =
      raw === null
        ? Array.from({ length: count }, () => ({ source: "upload" }))
        : JSON.parse(String(raw));
  } catch {
    throw new HttpError(
      "Metadata foto tidak dapat dibaca. Pilih ulang foto.",
      422,
    );
  }
  return z
    .array(
      z
        .object({
          source: z.enum(["camera_web", "upload"]),
          captured_at: evidenceTime.optional(),
        })
        .refine(
          (m) => m.source !== "camera_web" || !!m.captured_at,
          "Waktu pengambilan foto kamera diperlukan.",
        ),
    )
    .length(count)
    .parse(value);
}
