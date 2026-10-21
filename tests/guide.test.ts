import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = () => readFileSync(new URL("../src/components/guide.tsx", import.meta.url), "utf8");

test("guide reports unmeasured SUS rather than fabricated empirical outcomes", () => {
  const guide = source();
  assert.doesNotMatch(guide, /81\.5|95%|48 detik|avg:|15 Warga|20 <span|Grade A/);
  assert.match(guide, /Belum diukur/);
  assert.match(guide, /Belum ada data responden/);
});

test("guide provides a complete SUS collection protocol and honest demo boundaries", () => {
  const guide = source();
  assert.match(guide, /<h1\b/);
  assert.match(guide, /1 = Sangat tidak setuju/);
  assert.match(guide, /5 = Sangat setuju/);
  assert.match(guide, /bukan persentase/);
  assert.match(guide, /persetujuan/);
  assert.match(guide, /respons tidak lengkap/);
  assert.match(guide, /belum memvalidasi terjemahan/);
  assert.match(guide, /sangat merepotkan untuk digunakan/);
  assert.match(guide, /Rencana alur, bukan bukti audit/);
  assert.match(guide, /URL repositori publik belum diverifikasi/);
  assert.doesNotMatch(guide, /github\.com\/shinji|Next\.js 15|menjamin akurasi|notifikasi otomatis|GPS akurat|Strict Asia\/Jakarta|offline-first/);
});
