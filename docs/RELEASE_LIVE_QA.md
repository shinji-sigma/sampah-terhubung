# Release QA — 22 October 2026

Production: dpl_5wxzgRNu3mYYMj9mjSctVAMTpUAD (READY)
Deployment: https://sampah-terhubung-njv936si2-langgamramadhan9-3266.vercel.app
Verified canonical: https://sampah-terhubung-langgamramadhan9-3266.vercel.app

## Verified
- Final application snapshot: npm run lint, npm run typecheck, npm test (66/66), npm run build passed. Vercel remote build passed.
- 49/49 live checks in output/release-live-qa.json; reproducible via node scripts/release-live-qa.mjs (uses existing D:/WebDemo/.env.local privately).
- Browser routes: /, /jadwal, /kegiatan, /laporan, /laporan/baru, /integrasi, /panduan, /admin, /kelola, /wilayah, /preview, /uji-pengguna, /evaluasi. Guest admin/management routes show unavailable workspace, not authenticated success.
- Home, study, evaluation at 320/375/390/1024/1200/1440: no horizontal overflow; Masuk visible with height at least 44px.
- Study code remains visible; code survives evaluation reload; browser evaluation POST 201; service-role read confirms one row with score 50; anon SELECT denied 401; missing age POST rejected 422.
- Three /api/v1 GET endpoints return 200 with CORS *.
- No pageerror in final browser run. Earlier /integrasi hydration error traced to differing server/browser origin snippets; fixed using useSyncExternalStore server snapshot.
- Canonical alias originally pointed at obsolete deployment (new routes 404). Reassigned to current deployment. APP_ORIGIN aligned to canonical and redeployed.
- No SQL migration applied: existing Cloud RPC worked with anonymous create/duplicate and service-role cleanup.

## Synthetic cleanup
Direct RPC probe: P-FEEDC0DE, 00000000-0000-4000-8000-000000000001 created/duplicate, exactly one row removed, total then 0.
Browser runs: P-0E9AF601 / 6949922e-6eb9-4585-a520-1f0b3ae44287; P-C225826D / cd493afc-1d6c-4c7c-bfaf-965575d500d7; final P-5AA1E8C4 / aab78250-c506-4d06-947a-04162be7287d. Each exact ID/code row deleted and absence verified. These are QA, never respondents.

## Changes and limits
Explicit 18+ confirmation plus consent version required at HTTP boundary. Free-text comments removed from form; API accepts no nonempty comment and always sends empty RPC comment. Direct evaluation shows study information. Storage access failures caught; in-memory retry ID retained, manual participant code available. Starting study does not falsely mark evaluation consent.

The public legacy RPC still exists and is not a server-only gateway; HTTP age/consent checks do not prove age or prevent direct RPC bypass. Existing DB comment column/RPC parameter remain for compatibility. No new DB consent columns or RPC grant change applied.

Global 60/hour quota can be exhausted by strangers (accepted risk); not per-person verification. Retention_until metadata is not automatic deletion. Copy now states this explicitly. Organizer must handle deletion requests manually via authorized Supabase access, select the exact participant code, confirm intended row, delete only that row and verify absence; no broad wipe. No scheduled purge installed.

Authenticated follow-up (22 October): production service-role secret was stale/mismatched. All 17 workspace RLS table queries succeeded under an existing reporter session against the same Supabase URL/publishable key, while service-role enrichment of 9 visible photos failed only on hosted workspace (503). Corrected only the Vercel production SUPABASE_SERVICE_ROLE_KEY to the owner-controlled simulation backend value, without printing it or altering accounts/data; rebuilt as dpl_2Wuf2MyHXdEAv4jSHQkd2Pa9gfyd (READY) and reassigned the canonical alias. Canonical login/workspace with region returned 200 for reporter, coordinator and worker; absent region returned expected 422. Counts and evidence in output/workspace-regression-qa.json. Live Cloud integration passed 14/14: real HTTP sessions, private JPEG upload, RLS/cross-region isolation, idempotent report, assignment/rejection/concurrency, worker evidence, coordinator review, event capacity, CSV and logout; cleanupFailures 0 with only run-created IDs cleaned. npm test 66/66, typecheck, lint and production build passed. No application source fix was needed. Earlier dpl_5wxzgRNu3mYYMj9mjSctVAMTpUAD findings above are historical, not the current alias.

Still not verified: real signup/email redirect/confirmation; blocked-storage browser flow; network retry; 200% zoom; complete accessibility/contrast. The short Vercel alias also serves the application but APP_ORIGIN authorizes only the canonical hostname; use canonical URLs for mutations (short-host mutations may fail 403). This remains a domain UX gap. No recruitment readiness claim.

No git commit/push, no invitations, no personal account changes, no seed rerun. Existing local changes preserved.
