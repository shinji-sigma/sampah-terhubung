import { z } from "zod";
import { checkOrigin, privateHeaders } from "@/lib/http";
import { configured, userClient } from "@/lib/supabase";

const outcome = z.enum(["success", "help", "failed", "not_tried"]);
const schema = z.object({
  submissionId: z.uuid(),
  participantCode: z.string().regex(/^P-[A-F0-9]{8}$/),
  consent: z.literal(true),
  eligible18: z.literal(true),
  consentVersion: z.literal("sus-consent-1.1"),
  comment: z.literal("").optional(),
  device: z.enum(["phone", "tablet", "desktop", "other"]),
  tasks: z.object({ schedule: outcome, report: outcome, status: outcome }).strict(),
  answers: z.array(z.number().int().min(1).max(5)).length(10),

  honey: z.literal("").optional(),
}).strict();
const maxBytes = 4096;
function reply(body: unknown, status: number, headers?: Record<string, string>) {
  return Response.json(body, { status, headers: { ...privateHeaders, ...headers } });
}

// No GET: responses are never exposed through a public results endpoint.
export async function POST(req: Request) {
  try {
    checkOrigin(req);
  } catch {
    return reply({ error: "Asal permintaan tidak diizinkan." }, 403);
  }
  if (req.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    return reply({ error: "Gunakan application/json." }, 415);
  if (Number(req.headers.get("content-length") || 0) > maxBytes)
    return reply({ error: "Isian terlalu panjang." }, 413);
  // Bound actual streamed bytes as well as the untrusted Content-Length header.
  const reader = req.body?.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          return reply({ error: "Isian terlalu panjang." }, 413);
        }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let json: unknown;
    try { json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { return reply({ error: "JSON tidak valid." }, 400); }
    const parsed = schema.safeParse(json);
    if (!parsed.success) return reply({ error: "Periksa persetujuan, usia 18+, 10 jawaban, perangkat, dan hasil tugas." }, 422);
    if (!configured()) return reply({ error: "Penyimpanan evaluasi belum tersedia." }, 503);
    const data = parsed.data;
    const score = data.answers.reduce((sum, value, index) => sum + (index % 2 === 0 ? value - 1 : 5 - value), 0) * 2.5;
    // Public RPC validates again and provides cross-instance quotas/idempotency.
    // No account ID, cookies, IP, or user-agent is included in the stored record.
    const client = await userClient();
    const { data: status, error } = await client.rpc("submit_study_response", {
      p_submission_id: data.submissionId,
      p_participant_code: data.participantCode,
      p_device: data.device,
      p_tasks: data.tasks,
      p_answers: data.answers,
      p_score: score,
      p_comment: "",
    });
    if (error) return reply({ error: "Penyimpanan evaluasi belum tersedia. Coba lagi dengan kode yang sama." }, 503);
    // Accept only the RPC's fixed acknowledgement, never echo database payloads.
    if (status === "created") return reply({ status }, 201);
    if (status === "duplicate") return reply({ status }, 200);
    if (status === "conflict") return reply({ error: "Kode peserta atau pengiriman telah digunakan." }, 409);
    if (status === "rate_limited") return reply({ error: "Batas pengiriman sementara tercapai. Coba lagi nanti." }, 429, { "Retry-After": "3600" });
    return reply({ error: "Penyimpanan evaluasi belum tersedia." }, 503);
  } catch {
    return reply({ error: "Penyimpanan evaluasi belum tersedia. Coba lagi dengan kode yang sama." }, 503);
  } finally {
    reader?.releaseLock();
  }
}
