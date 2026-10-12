# Bukti QA — 12 Oktober 2026

`chrome.mock.json`/`edge.mock.json` mencatat hasil UI sintetis; `.mock.png` berisi foto canvas dan data MOCK. Ini bukan Supabase/HP/sensor nyata. Chrome memakai sesi CLI `evidence`, Edge `evidence-edge`. Screenshots tanpa prefix merupakan run awal; screenshots berprefix berasal dari build lokal akhir.

`cloud-auth-limited.json` merupakan login/logout akun demo yang sudah ada melalui Supabase Auth sungguhan. Workspace versi baru terhalang migrasi 005 (503/42703). Tidak ada signup email, unggahan foto, laporan, seed, migrasi Cloud atau deployment dalam pemeriksaan ini. Hasil unit/SQL bukan Auth/Storage Cloud.

Cara menjalankan ulang UI dengan runtime/dependensi yang sudah ada, dari `D:\WebDemo`:

```powershell
npm start -- --port 3001
# Terminal lain; browser yang tersedia, tanpa install browser baru:
npm exec -- playwright-cli -s=evidence open http://localhost:3001 --browser=chrome
node output/qa-report-evidence/run-browser-code.mjs output/qa-report-evidence/browser-setup.mock.js
node output/qa-report-evidence/run-browser-code.mjs output/qa-report-evidence/browser-login.mock.js
node output/qa-report-evidence/run-browser-code.mjs output/qa-report-evidence/browser-evidence.mock.js
node output/qa-report-evidence/run-browser-code.mjs output/qa-report-evidence/browser-upload-cache.mock.js
node output/qa-report-evidence/run-browser-code.mjs output/qa-report-evidence/browser-lifecycle-auth.mock.js
npm exec -- playwright-cli -s=evidence close
```

Untuk Edge gunakan `--browser=msedge`, sesi `evidence-edge`, dan tambahkan `evidence-edge` pada argumen terakhir setiap adapter. Skrip memasang intercept hanya dalam browser uji; tidak mengubah produksi. Respons error 401/422 disengaja untuk recovery. Prompt kamera tanpa jawaban membutuhkan sekitar 20 detik. Browser, viewport dan reduced motion di sini emulasi UI, bukan Android/iOS fisik. Jangan simpan cookie/traces/env dengan akun sungguhan di folder ini.

Untuk integrasi Cloud setelah migrasi, ikuti `docs/BUKTI_LAPORAN_DAN_PEMISAHAN_AKUN.md` dari Shinji_server. Rilis belum dilakukan; kode lokal di branch `codex/report-evidence-auth`.
