# Security review — Sampah Terhubung

Tanggal audit: 10–11 Oktober 2026; retest final 11 Oktober 2026. Auditor: sub-agent **Security**, benar-benar dijalankan paralel dengan Reviewer; koordinator merupakan satu-satunya penulis aplikasi. Tidak ada sub-agent Security tambahan karena pengguna membatasi tepat dua agent.

## Cakupan dan batas bukti

Baseline source: branch `codex/sampah-terhubung-local`, HEAD `541a2ad4b63453aaadfa9e3288c454965d0baa6f`, status awal bersih menurut pemeriksaan koordinator. Review membaca source saat awal dan melakukan reproduksi dengan migrasi **001 dan 002** di PostgreSQL PGlite disposable. Probe baseline tetap memuat kedua migrasi tersebut agar dapat diulang setelah patch tanpa mengganti checkout. PGlite memakai stub `auth.uid()`/Storage; tidak memvalidasi penerbitan atau signature JWT, Supabase Auth/Storage, HTTP Data API Cloud, atau konkurensi antarkoneksi sungguhan.

HTTP hanya instance produksi milik koordinator di `127.0.0.1:3004`: permintaan berurutan dengan timeout 5 detik, body aktual terbesar 30.001 byte. Origin yang diterima ditemukan melalui probe terbatas `http://localhost:3001`; tidak membuka nilai `.env.local`. Tidak ada token, cookie, password, secret, akun/data orang nyata yang dibaca atau dicetak. Cloud, seed, integration script dan backup/restore **tidak dijalankan**.

Dokumen acuan: PRD sumber, arsitektur, pemetaan fitur, hasil uji, panduan pengguna/Cloud, deployment/backup, keputusan hero dan QA; PRD/riset/logo sumber/Personal AI tidak disentuh. Paket/preflight skill: `security-scan`; preflight ready dengan warning kapasitas rekomendasi 6 vs runtime 4 (3 slot worker), tidak mengubah konfigurasi. Scope source mencakup semua API/Auth route, lib validasi/body/upload/CSV/Supabase, migrasi/grants/RLS, penggunaan foto dan output React, fixture production guard, skrip administratif serta dokumentasi operasional. Review pola secret pada 82 file teks tracked dan 12 browser chunks tidak menemukan pola credential atau referensi secret server di chunks. Ini bukan deteksi secret yang sempurna atau review seluruh dependency vendored.

## Model ancaman

Aset: identitas/sesi akun; laporan pending dan koordinat privat; bukti foto; cakupan peran; integritas penugasan, jadwal, kapasitas kegiatan dan riwayat; kunci server; ekspor wilayah dan ketersediaan ruang kerja.

Peran: anonim, pelapor, petugas aktif per wilayah, koordinator per wilayah, admin global. Penyerang dapat mengubah ID/payload, memanggil Data API/RPC Supabase langsung dengan publishable key dan sesi sendiri, mengirim gambar palsu serta mengulang request. Penyerang tidak diasumsikan memiliki secret server, admin, akses komputer pemilik atau akun orang lain.

| Batas | Sumber / kontrol | Pertanyaan audit |
| --- | --- | --- |
| Browser → Next HTTP | `checkOrigin`, `readLimited`, Zod; `getUser()` server | Origin/body/auth diverifikasi sebelum mutasi? |
| Next/sesi → Data API | user client memakai publishable key + cookie; RLS/command | ID/role/region/ownership tetap dibatasi walau UI atau Zod dilewati? |
| RPC → PostgreSQL | `SECURITY DEFINER`, search_path public, helper EXECUTE revoked, lock/versi/receipt | Input JSON langsung mempertahankan aturan status, waktu dan kepemilikan? |
| Foto → Sharp → Storage | 1–3, 5 MiB/foto, total16 MiB, 25 juta piksel, decode/encodeJPEG, random path | Format palsu/metadata/path pengguna dibuang sebelum service-role upload? |
| Storage → proxy foto | lookup metadata dengan RLS dahulu, lalu download service role; `unoptimized` | Foto privat tidak menjadi URL/cached image publik? |
| Data privat → publik/CSV | proyeksi publik; izin koordinator ekspor; formula escaping | SELECT tabel/RPC langsung tidak lebih terbuka dari proyeksi? |
| Operator → seed/integration/backup | server-only key, DEMO_MODE, generated-ID cleanup, output/private gitignored | Target simulasi benar-benar dipastikan pemilik, bukan hanya flag lokal? |

Konfigurasi efektif Cloud belum tersedia menurut pemeriksaan boolean koordinator. `supabase/config.toml` adalah konfigurasi lokal yang tidak membuktikan kebijakan Auth Cloud. DEMO_MODE memberi label/guard skrip; bukan isolasi proyek atau izin untuk menguji Cloud. Runtime hanya localhost sesuai scripts; deployment Internet tidak diasumsikan.

## Temuan baseline terkonfirmasi

Tidak ditemukan P0/P1 terkonfirmasi. Severity di bawah mengukur dampak kontrol yang terbukti; tidak menyatakan berhasil menyerang Cloud.

| ID | Severity | Kontrol yang gagal | Bukti baseline | Status patch/retest |
| --- | --- | --- | --- | --- |
| S01 | P2 | Petugas aktif dapat mencatat aktual jadwal yang tidak ditugaskan kepadanya | SQL run tanpa worker_id tersimpan 1 baris | Diperbaiki lokal; retest final lulus |
| S02 | P2 | RPC menerima bukti/kegiatan tanpa waktu pekerjaan | task submitted/event completed dengan performed_at NULL | Diperbaiki lokal; retest final lulus |
| S03 | P3 | SELECT tabel jadwal publik melewati sanitasi identitas proyeksi | anon mendapat worker UUID, runs berisi actor UUID | Diperbaiki lokal; retest final lulus |
| S04 | P2 | Keanggotaan petugas dicabut tetapi alasan review baru masih dikirim/dibaca | 0 task terlihat, 1 notification baru setelah pencabutan | Diperbaiki lokal; retest final lulus |
| S05 | P3 | Respons error privat tidak memberi no-store | HTTP422/403/503 tanpa Cache-Control | Diperbaiki lokal; retest final lulus |
| S06 | P2 | Tanggal PostgreSQL nonfinite dapat disimpan lewat RPC dan mematahkan rendering | report observed_at -infinity tersimpan; Intl formatter RangeError | Diperbaiki lokal; retest final lulus |

### S01 — SQL NULL melewati izin aktual jadwal

Lokasi baseline: `supabase/migrations/202610080001_core.sql:258`, callable authenticated RPC pada baris334. Petugas harus hanya mencatat jadwal tanggung jawabnya (PRD peran petugas; panduan pengguna). Buat jadwal sah tanpa worker_id, beri aktor membership worker aktif, lalu panggil `command({op:'schedule.run',id:<jadwal>,date:<hari aturan>,actual_at:<ISO sekarang>,reason:<catatan>},<UUID>)`. Aktual tersimpan meskipun bukan tanggung jawabnya. Predikat `not (sch.worker_id=actor and has_role(...))` bernilai NULL bila worker_id NULL dan membership aktif; PL/pgSQL IF tidak menolak NULL. Dampak: catatan aktual/jadwal/ringkasan dapat dipalsukan oleh petugas wilayah. Membership wilayah lain/tidak aktif tidak otomatis mendapat kemampuan ini. Rekomendasi: predikat fail-closed (`... IS NOT TRUE`/coalesce), tes unassigned/other worker/inactive/cross-region ditolak dan coordinator/assigned worker tetap boleh.

### S02 — Waktu bukti wajib hanya di Zod, bukan RPC

Lokasi baseline coreSQL:206–209,225,300–303,334; schema Next `src/lib/validation.ts` mengharuskan performed_at tetapi direct RPC tidak melewatinya. Gunakan tugas accepted milik petugas aktif atau kegiatan published milik koordinator, foto metadata sintetis milik aktor, versi terkini, lalu panggil task.evidence/event.complete **tanpa performed_at**. Perbandingan terhadap masa depan/starts_at menjadi NULL, sehingga task menjadi submitted dan kegiatan completed dengan waktu NULL.

Dampak tugas lebih besar dari metadata kosong: insiden menjadi awaiting_review; koordinator menolak approve maupun return-for-fix karena pemeriksaan bukti mensyaratkan waktu; assign tidak menerima awaiting_review. Alur memerlukan repair administratif di database. Kegiatan selesai tidak memenuhi bukti waktu PRD. Rekomendasi: guard waktu wajib dalam SQL sebelum perubahan/foto; snapshot lama harus tetap tak berubah sesudah request ditolak, alur bukti ISO sah tetap berhasil. Tidak memperbaiki/menghapus data Cloud otomatis; jika pernah memakai migrasi lama, operator perlu meninjau data invalid secara terpisah.

### S03 — Identitas pseudonim pada tabel jadwal publik

Lokasi coreSQL:95–97,104 vs safeprojection111/113. Sebagai anon, SELECT confirmed schedules mengembalikan worker_id; SELECT runs pada jadwal tersebut memungkinkan actor_id. public_region_data sengaja menghapus kedua kolom. Bukti terbatas UUID/pseudonim, bukan nama, kontak, token, foto atau identitas pelapor. Rekomendasi: baca publik lewat projection; RLS detail jadwal hanya coordinator atau assigned active worker, sibling exceptions/runs mengikuti jadwal. Pastikan kalender publik tetap berfungsi dan coordinator/worker mendapat detail sah.

### S04 — Notifikasi baru kepada petugas nonaktif

Lokasi `202610080002_notifications.sql:9–10`; `notifications_read` pada coreSQL:103 hanya owner. Siapkan tugas submitted+bukti+waktu sah, cabut membership worker, kemudian koordinator mengembalikan bukti untuk perbaikan dengan catatan sintetis unik. Worker tidak dapat membaca task (0 baris) tetapi menerima dan membaca alasan review baru (1 notifikasi). Worker recipient dipilih berdasar status tugas tanpa memastikan membership aktif. Dampak: informasi pekerjaan baru setelah pencabutan tetap mencapai akun yang kehilangan hak wilayah. Rekomendasi: hanya recipient worker dengan membership aktif atau predicate akses penerima; jangan memakai `has_role()` aktor koordinator sebagai pengganti identitas penerima. Retensi notifikasi historis harus dibedakan dari pengiriman informasi baru.

### S05 — Header privat hilang pada error

Lokasi `src/lib/http.ts` fungsi failure (baseline19–44), digunakan workspace/photo/export/commands/auth. Request UUID salah →422, Origin salah/hilang→403, backend kosong→503 tidak memiliki Cache-Control. Respons sukses privat memakai private,no-store. Tidak ada bukti cache membocorkan isi foto/data pribadi; hasil error umum/field validation saja. Gap ini memungkinkan caching error pada keadaan sesi/hak yang berubah, terutama penolakan404 foto jika perantara mengcache. Rekomendasi minimal: header private,no-store seluruh cabang failure; tes HttpError, ZodError, generic503, produksi aktual. Tidak menambah CSP/headers besar tanpa risiko terbukti.

### S06 — Tanggal nonfinite mematahkan ruang kerja

Lokasi coreSQL:153–155,334; `src/lib/types.ts` dateTime, `src/components/operations.tsx:99,471–472`. Pelapor authenticated memanggil report.create langsung dengan observed_at `-infinity`, input lain sah, foto milik sendiri. PostgreSQL menyimpan -infinity dan future check tidak menolaknya. Formatter nyata `Intl.DateTimeFormat(...).format(new Date('-infinity'))` melempar `RangeError: Invalid time value`. Data laporan dapat mematahkan render daftar pending koordinator dan daftar laporan pemilik. Ini bukan DoS trafik dan tidak diuji pada orang/Cloud. Rekomendasi: SQL menolak nilai nonfinite/date/time di luar representasi yang diterima aplikasi, fallback formatter untuk data lama/import invalid, tes invalid ditolak dan ISO sah tetap terlihat.

## Matriks izin dan hasil lokal

| Aktor / keadaan | Baca/mutasi yang seharusnya boleh | Larangan / hasil tersedia | Metode dan batas |
| --- | --- | --- | --- |
| Anon | safe public regions/schedules/incidents/events | reports/photos/history privat tak terlihat; command execute ditolak; raw confirmed schedule ditemukan S03 | RLS/PGlite + HTTP produksi fixture404; bukan AuthCloud |
| Pelapor A | own report/foto pending, incident terkait, feedback sendiri, join/leave | akun lain/cross-region pending report/foto tidak terlihat; admin/direct tables/helper ditolak | suite lokal + safeprobes; RPC invaliddate ditemukan S06 |
| Pelapor lain | own report, shared incident jika menjadi supporting reporter | tidak membaca report/foto pending A; tidak review/close incident | suite lokal |
| Petugas belum ditugaskan | jadwal responsibility jika ada | tidak membaca pending report A; tidak accept tugas orang lain | suite lokal; unassignedschedule S01 ditemukan |
| Petugas ditugaskan aktif | accept/reject/block/evidence tugas sendiri, incident/report tervalidasi terkait | stale version/illegal transition/evidence tanpa tujuan ditolak | suite lokal; performedNULL S02 ditemukan |
| Petugas dialihkan | riwayat baca pada insiden pernah ditugaskan (kebijakan eksplisit arsitektur) | mutasi tugas superseded harus ditolak | source guards; final probe menolak kedua ID tugas (lama superseded dan ID baru milik petugas lain), assignment sah tetap berhasil |
| Worker membership nonaktif | akses sebagai pelapor jika punya report sendiri; notifikasi historis sesuai kebijakan | task/incident via membership ditolak; newprivate notification S04 ditemukan | isolated repro; bukan logout/revocationJWTCloud |
| Koordinator A | semua operasi pengelolaan dalam A | coordinatorB/worker/reporter tidak dapat validate/review/prevention A; export checks has_role | suite SQL, exportsource; eksporHTTP dengan sesi sungguhan belum teruji |
| Admin | region/member/moderation + global scope sesuai desain | signup metadata tidak memberi admin; helper write RPC tidak callable | suite SQL + source |

Riwayat read pekerja lama memang diizinkan `can_incident/can_report` selama membership masih aktif, termasuk incident terkait. Ini tidak diperlakukan otomatis sebagai celah; perlu keputusan pengelola sebelum pilot jika kebijakan yang diinginkan hanya tugas aktif atau membatasi bukti baru setelah alih tugas. Mutasi superseded tetap dibatasi.

## Kontrol yang diperiksa dan counterevidence

- Auth: API privat menggunakan server getUser, bukan percaya profile dari request/browser. Cookie HttpOnly/SameSite=lax, Secure mengikuti APP_ORIGIN HTTPS; modul Supabase server-only; storageAdmin hanya untuk validasi+metadata+proxy. Tidak menyimpulkan rotasi/expiry/logout/smtp Cloud berhasil.
- RLS/grants: semua 18 tabel public termasuk receipt diaktifkan RLS; anon/authenticated SELECT melalui policy, direct mutation revoked; internal audit/attach_photos/require_coordinator tidak callable; signup is_admin metadata diabaikan. command securitydefiner memakai search_path eksplisit public, input SQL parameterized. Cloud grant/default privileges masih perlu diperiksa pada proyek nyata.
- Workflow: receipt terikat actor+UUID+payload; advisory lock+rowlock+versi, unique current task/open incident/registration, capacity row lock, attachment lock+owner+unused checks. Lokal menjalankan serial assertions; ini tidak membuktikan konkurensi Supabase multiclient.
- Input/output: React text rendering, tidak menemukan attacker input pada innerHTML/eval/exec atau Leaflet tooltip HTML; UUID/ISO schema; SQL values bukan dynamicSQL. CSV menetralkan =+-@ serta whitespace/control prefixes dan quoting. Tidak menemukan injection yang terkonfirmasi.
- Upload: Sharp decode format sesuai MIME, reject SVG/animated pages/oversize/invalid, limit25mp/resize1920/JPEG encode membuang EXIF; user filename tidak dipakai path, random UUID dan owner path. Storage insert policy client tidak ada; RLS photo sebelum service-key download; privat `unoptimized` dan no-store success. Real Storage signed/private/direct object read, rate limits dan rollback objek belum diuji Cloud.
- HTTP: foreign/missing Origin403 sebelum backend; Content-Length dan streaming limit unit, JSON auth/command overlimit413 lokal; deklarasi upload16MiB+1 hanya1actualbyte ditolak413. Header nosniff/DENY/referrer dan CORS nonpermissive diamati. Response/errorlogs tidak menampilkan detail provider/credential.
- Fixture: /ui-test production404, NODE_ENV development DAN flag true wajib; /preview synthetic no-auth/no-save berlabel. Ini bukan bypass backend Auth. Production guard perlu diulang sesudah build patch.
- Dependencies: npm audit registry aktual 10 Oktober 2026 menemukan 0 vulnerabilities, versi konkret lockfile dipertahankan. Hasil scanner tidak membuktikan tidak ada vulnerability baru atau jalur rentan tanpa advisory.

Bukti: `output/audit/security/initial-sql-probes.json`, `sql-probes.mjs`, `initial-http-probes.json`, `http-probes.mjs`, `npm-audit.json`, `source-secret-patterns.json`, `preflight.json`. Probe baseline dapat diulang dengan node (PGlite disposable, tak ada backend nyata); tidak menjalankan seed atau integration.

## Operasional dan hal yang belum teruji

Tidak ada limit agregat aplikasi untuk upload/login yang dibuktikan source; batas request/foto bukan kuota total. Upstream Auth Cloud rate limits, CAPTCHA/SMTP, default password policy, retensi foto tak terpakai, pengelola data/logs/monitoring dan aturan revoke/read history perlu ditetapkan pemilik sebelum layanan umum. Ini **potensial/perlu verifikasi**, bukan hasil brute-force/DoS berhasil. Tidak mengklaim kebijakan auth.rate_limit di config.toml sebagai pengaturan Cloud.

Kegagalan backend tidak memalsukan keberhasilan: public503 setup, private failures generic503; route mutasi data memakai sesi/RLS. Script integration/seed punya flagdemo+knownaccounts dan cleanup bycreatedIDs; keberadaan config/flag tidak menggantikan izin target simulasi terpisah. Cleanup error file privat harus diperiksa sebelum ulang, jangan reset.

Auth/email confirmation/logout/session refresh, DataAPI RLS actual, unggah+proxy+Storage ACL/rollback, dua browser/laptop Cloud, race request antarkoneksi, server HTTPS/CDN cache dan backup **database + objek foto** serta restore belum dapat dinilai. Panduan prosedur ada, latihan restore belum ada. /auth/confirm unconfigured bisa gagal backend; belum membuktikan callback token sebenarnya.

Cloud next step: pemilik siapkan proyek pengujian khusus sintetis, isi URL/publishable dan tepat satu server secret secara lokal, APP_ORIGIN sesuai port/redirect serta DEMO_PASSWORD privat. Jalankan semua migrasi urut nama termasuk patch tambahan; jangan install schema001 ulang pada data existing. Lalu seed hanya proyek kosong dan sekali, jalankan integration/role browser/photo direct-ID/expiry/reassign/inactive/newdate/concurrency, kedua laptop (clone D:\WebDemo), lalu latihan restore terpisah. Setiap pengujian Cloud membutuhkan target yang jelas diizinkan; jangan menguji proyek operasional hanya karena config terisi.

## Retest final independen dan kelayakan

Snapshot penutupan aplikasi yang dibaca dan diuji: **0f9d0558756a25e1f8b3fa1a8735972517fcc87e**. Security membaca sendiri diff nyata `541a2ad..9d67c3a` termasuk seluruh migrasi003, perubahan HTTP/helper tanggal/client state/forms, lalu diff tambahan `9d67c3a..0f9d055` (heading tiga fallback), bukan hanya ringkasan koordinator. Pemeriksaan 41 SQL, 13 HTTP produksi baru, dan suite31 diulang dan lulus pada snapshot penutupan ini. Bukti retest pertama9d67 tetap disimpan sebagai `retest-9d67-*`. Versi aplikasi dibekukan selama retest; dokumen/bukti kemudian ditambahkan. `next-env.d.ts` otomatis berubah ke jalur `.next/dev/types` karena server fixture, dicatat kepada koordinator; Security tidak mengedit source/test aplikasi.

Migrasi `202610100003_audit_controls.sql` bersifat tambahan: menjaga tabel/data lama, mengubah policy jadwal, mengganti command dengan guard NULL/finiteness/range dan audit recipient aktif. Tidak ada migrasi/repair data pada Cloud. Rekomendasi pemulihan data invalid lama ditulis dalam panduan Cloud.

| Temuan | Perubahan konkret | Hasil retest independen |
| --- | --- | --- |
| S01 |003:139 owner compare `IS NOT DISTINCT FROM`, fail closed|Unassigned/different/inactive/cross-region ditolak; assigned active dan coordinator aktual sah diterima|
| S02 |003:87,181 missing/null/empty performed_at ditolak sebelum foto/status|Missing/null/empty/future ditolak, task/version/photo unchanged; task valid→review perbaikan→resubmit→close sah; event published tetap utuh sebelum valid completion|
| S03 |003:4–7 policy raw schedules hanya role penanggung jawab|Anon/pelapor/coordinator wilayah lain raw schedules/runs0; assignedworker/coordinator1; projection tetap menampilkan calendar+aktual tanpa UUID pengguna|
| S04 |003:224 recipient worker membership active|Worker nonaktif task/incident0, NEW private notification0; reaktivasi mendapat notice sah dan alur closure berhasil|
| S05 |failure Zod/HttpError/generic semua privateHeaders|13 HTTP produksi: error422/403/413/503 private,no-store; suite juga401/404 dan providerdetail redaction; fixture404|
| S06 |003:15–28 finite date/time tahun1–9999, formatter fallback|Nonfinite/future out-of-range/BC ditolak tanpa row tercemar; ISO/idempotent normal berhasil; fallback legacy invalid date tak melempar|

**41/41** assertions pada probe SQL independen lulus; **13** permintaan HTTP terbatas selesai dengan status/header yang diharapkan; **31/31** suite lokal dijalankan ulang oleh Security dan lulus. Tidak memakai mock Auth sebagai bukti login sungguhan. Lint/typecheck/build dilaksanakan koordinator; bukti root disimpan terpisah, bukan klaim Security menjalankan build. Semua enam baseline temuan ditutup **untuk source/runtime lokal yang diuji**. P0/P1 terkonfirmasi tidak ada; temuan terbuka lokal yang terkonfirmasi setelah retest tidak ada. Penutupan ini tidak menyatakan deployment Cloud telah memakai migration003.

Bukti final: `output/audit/security/final-sql-retest.json` dan `.mjs` (memuat semua migrasi urut nama, database disposable), `final-http-probes.json` dan `.mjs`, `final-tests.txt`; bukti baseline001/002 tetap utuh terpisah. Draft native `native-draft.json` menyimpan enam temuan baseline dan validation fixed, dengan coverage **partial** untuk live-service/operational gap. Ini membedakan histori audit dari isu current local yang masih terbuka.

- **Demo lokal:** layak sebagai preview/mock simulasi dan bukti source/SQL isolated; belum dapat dinyatakan demo alur backend dua laptop siap sebab Auth/database/foto Cloud belum dihubungkan. Label preview/mock wajib tetap jelas.
- **Pengujian data asli terbatas:** belum layak dinyatakan terverifikasi. Selesaikan target Cloud sintetis, migration003, direct RLS/Storage/Auth/session/concurrency/real-browser/laptop kedua terlebih dahulu; tentukan kebijakan data/foto dan latihan pemulihan.
- **Operasional publik:** belum siap. Selain gap Cloud, quota/rate policy, orphanphoto retention, monitoring, admin cadangan, tujuan/izin pengelola, dan backup basisdata+objek/restore belum dibuktikan.

Audit tidak menyatakan “100% aman”. Agent Security benar-benar membuat reproduksi awal dan retest independen; tidak melakukan aktif Cloud, deployment, push, kontak, reset atau perubahan repository Personal AI/dokumen riset/PRD/logo sumber.

## Catatan provenance laporan native dan bukti tambahan

Laporan native disegel koordinator untuk target baseline541a2ad. **Erratum terbatas S05:** kutipan helper HTTP pada laporan native memakai source final yang sudah mengandung privateHeaders, meskipun narasi baseline dan hasil HTTP awalnya benar. Kutipan tersebut tidak boleh dipakai sebagai bukti bahwa baseline sudah no-store. Source helper sebelum patch tersedia pada `output/audit/security/http-baseline-source.txt` (dibaca melalui gitshow commit541a2ad yang secara eksplisit menjadi target perbandingan audit); `initial-http-probes.json` membuktikan Cache-Control kosong dan `final-http-probes.json` membuktikan private,no-store. Primary report ini mencatat status penutupan pada app0f9d055; native yang sudah disegel tetap mencatat retest pertama9d67c3a. Laporan native tetap disegel; tidak diedit, dibuat ulang atau diselesaikan ulang. Perbedaan HEAD baseline/HEAD aplikasi final adalah hasil patch yang diotorisasi, bukan bukti audit final dilakukan pada snapshot lama.

Pemeriksaan tambahan Security pada snapshot9d67c3a: JPEG sintetis8×8 diberi EXIF (tag sintetis Artist/Copyright); metadata EXIF ada sebelum validateImage dan tidak ada setelah encode JPEG. PNG1×1 dengan header dimensi5001×5000 dan CRC disesuaikan dapat dibaca dimensinya, kemudian ditolak oleh validator; body kecil ini merupakan probe malformed-image terbatas, **bukan** benchmark decode gambar25MP valid. Formatter invalidlegacy date memberikan fallback dan ISO sah tetap WIB. Bukti `final-upload-formatters.json` dan `.mjs`; ini tidak memakai foto orang atau membuktikan Cloud Storage. Tidak mengubah total41assertions SQL/13HTTP/31suite yang sudah dicatat.

### Pembekuan snapshot terakhir

11 Oktober 2026: root menambahkan h1 pada fallback laporan wilayah nonaktif/publik, laporan saya anonim dan pemberitahuan anonim (RV04). Security membaca diff `9d67c3a..0f9d055` sendiri; hanya fragment/SectionTitle, tidak mengubah API/auth/RLS/upload/workflow. Pada HEAD **0f9d0558756a25e1f8b3fa1a8735972517fcc87e**, **41/41 SQL**, **13 HTTP produksi**, dan **31/31 suite** diulang oleh Security dan lulus. /ui-test tetap404, private error no-store, batas body413, semua positive/negative assertions tetap benar. Tidak ada temuan Security baru. Bukti final bernama final-* kini merujuk snapshot0f9d; bukti pertama9d67, baseline001/002, laporan native disegel dan metering tidak ditulis ulang. Batas Cloud/operasional dan keputusan kesiapan tetap sama.
