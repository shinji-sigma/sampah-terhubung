import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { delimiter, resolve } from "node:path";
process.loadEnvFile(".env.local");
const origin = "https://sampah-terhubung-langgamramadhan9-3266.vercel.app";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretName = process.env.SUPABASE_SECRET_KEY
  ? "SUPABASE_SECRET_KEY" : "SUPABASE_SERVICE_ROLE_KEY";
if (url !== "https://jrozalhfgmzpxvpvzgcf.supabase.co" || !publishable ||
    !process.env[secretName] ||
    (!!process.env.SUPABASE_SECRET_KEY === !!process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    process.env.DEMO_MODE !== "true" || !process.env.npm_execpath) {
  throw new Error("Konfigurasi demo belum valid. Jalankan melalui npm run deploy:env. Nilai disembunyikan.");
}
const values = {
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
  [secretName]: process.env[secretName],
  DEMO_MODE: "true",
  APP_ORIGIN: origin,
};
const childEnv = { ...process.env };
for (const name of [...Object.keys(values), "DEMO_PASSWORD", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) delete childEnv[name];
const endpoint = "/v10/projects/prj_wvSxAQAkl0gh6prrhg7R8Uk9xg5L/env?upsert=true&teamId=team_KUNEHGv0CpseMF8MPtDUzYOJ";
let cli;
for (const directory of process.env.PATH.split(delimiter)) {
  const candidate = resolve(directory, "../vercel/package.json");
  if (!existsSync(candidate)) continue;
  const pkg = JSON.parse(readFileSync(candidate, "utf8"));
  if (pkg.name === "vercel" && pkg.version === "63.1.2") {
    cli = resolve(candidate, "..", pkg.bin.vercel);
    break;
  }
}
if (!cli) throw new Error("Jalankan melalui npm run deploy:env agar CLI resmi tersedia.");
// Send one JSON object at a time; do not expose values in arguments or logs.
async function upload(key, value) {
  await new Promise((done, fail) => {
    const child = spawn(process.execPath, [cli, "api", endpoint,
      "--method", "POST", "--input", "-", "--raw", "--scope", "langgamramadhan9-3266"],
      { env: childEnv, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.resume();
    child.on("error", fail);
    child.on("close", code => {
      try {
        const response = JSON.parse(output);
        if (code !== 0 || !response.created || response.failed?.length) throw new Error();
        done();
      } catch { fail(new Error()); }
    });
    child.stdin.on("error", () => {});
    child.stdin.end(JSON.stringify({ key, value, type: "encrypted", target: ["production"] }));
  });
}
try {
  for (const [key, value] of Object.entries(values)) await upload(key, value);
  console.log("Lima variabel runtime produksi tersimpan privat pada proyek demo. Password akun demo tidak diunggah. Redeploy diperlukan.");
} catch {
  console.error("Pemasangan environment gagal. Periksa login/scope CLI dan konfigurasi privat. Nilai disembunyikan.");
  process.exitCode = 1;
}
