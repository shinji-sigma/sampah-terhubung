import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
const source = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
test("all SUS actions use one respondent destination and legacy redirects", () => {
  for (const path of ["app/uji-pengguna/page.tsx", "app/evaluasi/page.tsx", "components/guide.tsx", "components/dashboard.tsx", "components/sus-form.tsx"]) assert.match(source("../src/" + path), /SUS_RESPONDENT_URL/);
  assert.match(source("../src/app/evaluasi/page.tsx"), /redirect\(SUS_RESPONDENT_URL\)/);
  assert.match(source("../src/lib/sus-destination.ts"), /https:\/\/docs\.google\.com\/forms\/d\/e\/1FAIpQLSejI-hRb7qXIi5l0FpdWy3V7i3b2Bbv7ONYPrFbPXfSDRDzyw\/viewform/);
});
test("feature guide has no consent or code gate", () => {
  const page = source("../src/app/uji-pengguna/page.tsx");
  for (const text of [/Kawasan Hijau A · Simulasi/, /Jadwal angkut/, /akun sendiri/, /foto-sebelum\.jpg/, /GPS/, /terverifikasi/, /gagal/]) assert.match(page, text);
  assert.doesNotMatch(page, /StudyStart|setujui studi|buat kode peserta|<input/);
  assert.ok(existsSync(new URL("../public/uji-pengguna/foto-sebelum.jpg", import.meta.url)));
  assert.doesNotMatch(source("../src/components/sus-form.tsx"), /\/api\/evaluasi|export function StudyStart|export function SusForm/);
});

