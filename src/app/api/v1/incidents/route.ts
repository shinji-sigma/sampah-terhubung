import { publicGet, preflight } from "../public-get";

export const OPTIONS = preflight;
export async function GET(req: Request) {
  return publicGet(req, "incidents");
}
