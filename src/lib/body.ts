import { HttpError } from "./http";
export async function readLimited(req: Request, limit: number) {
  if (Number(req.headers.get("content-length")) > limit)
    throw new HttpError("Permintaan terlalu besar.", 413);
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array().buffer;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new HttpError("Permintaan terlalu besar.", 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of chunks) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes.buffer;
}
