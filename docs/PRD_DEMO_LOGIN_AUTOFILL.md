# PRD: Demo Login Autofill (Presentation Mode)

## Context & Authorization
- Authorized by user explicitly for competition presentation: public autofill of simulation accounts (`admin@demo.invalid` and `pelapor.a@demo.invalid`), not personal user credentials.
- Amends previous restrictions in `docs/PRD_USER_STUDY_SUS.md` specifically for demonstration purposes; participants in formal usability studies remain on dedicated non-admin routes (`/uji-pengguna`, `/evaluasi`).

## Scope & Functional Requirements
- **Admin Demo Button**: Autofills `admin@demo.invalid` and configured `DEMO_PASSWORD` into login inputs.
- **User Demo Button**: Autofills `pelapor.a@demo.invalid` and configured `DEMO_PASSWORD` into login inputs.
- **Autofill Only**: Populates DOM input elements (`email`, `password`) and displays status prompt. Does NOT automatically trigger form submission (`/api/auth`) and does NOT bypass authentication.
- **Simulation Disclaimer**: Displays explicit notice: *"Data simulasi · Akun bersama untuk presentasi, bukan akun pribadi. Jangan isi data pribadi. Pilih akun, lalu tekan Masuk."*
- **Graceful Fallback**: If demo mode is inactive or `DEMO_PASSWORD` is absent on server, buttons are disabled with status notice; manual login input remains fully functional.

## Security Architecture & Boundaries
1. **Server-Gated Route (`/api/demo-login`)**:
   - `DEMO_MODE === "true"` and `DEMO_LOGIN_ENABLED === "true"` are strictly required. Missing or "false" returns HTTP 404.
   - Missing `DEMO_PASSWORD` in server environment returns HTTP 503 (`available: false`).
   - `checkOrigin(req)` enforces same-origin protection against cross-site exploitation.
   - Request body parsed with `readLimited(req, 5000)`. Role parameter validated against a strict allowlist (`admin`, `user`); unlisted roles reject with HTTP 422.
   - All responses include `Cache-Control: private, no-store`.
2. **Zero Service Key Exposure**:
   - No Supabase secret keys or service role keys are touched or exported.
   - Client never receives credentials unless user clicks demo button with active gate.
   - Password is placed into standard `type="password"` input without plain-text disclosure or console logging.
3. **No Database Reset / Reseed**:
   - Uses existing seeded accounts in database mapping (`admin@demo.invalid`, `pelapor.a@demo.invalid`).
   - No mutations, deletions, or reseeding performed.

## Acceptance & Verification
- Unit/API test (`tests/demo-login.test.ts`): verifies gate matrix (mode/enabled toggles), allowlist enforcement, origin rejection, 503 on missing password, and 0 cookies set.
- Browser test (`scripts/demo-login-browser.mjs`): automated Playwright run on 1440px desktop and 360px mobile viewports. Verifies both buttons fill inputs, zero auth requests occur prior to manual submit, and zero horizontal page overflow.
- All 71 existing test suites pass; `npm run lint`, `npm run typecheck`, and `npm run build` pass cleanly.
