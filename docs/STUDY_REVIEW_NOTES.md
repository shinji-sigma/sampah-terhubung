# Study integration review notes

Scope: read-only source review of the current working tree, including the in-progress study page. Only this notes file was written. No application edits, Cloud writes, deployment, authenticated submission, or browser layout verification were performed. Line references describe the reviewed snapshot; sibling work may change them.

## Remote participants: supporting evidence works without GPS

- `src/components/report-evidence.tsx:267–290`: under **Sumber bukti laporan**, select **Gunakan bukti pendukung** (not **Laporan langsung**).
- `src/lib/validation.ts:60–87` and `supabase/migrations/202610120005_report_evidence.sql:39–52`: supporting mode accepts no device snapshot and no incident coordinates. If coordinates are supplied, latitude and longitude must both be present; if any device snapshot field is supplied, all four fields are required. Direct mode instead requires a complete snapshot and a camera-web photo.
- `src/components/report-evidence.tsx:292–307`: **Lampirkan lokasi perangkat** remains visible in supporting mode, but is optional. Location is requested only after pressing it. Participants should skip it; they need not deny a permission prompt as part of the task.
- `src/components/dashboard.tsx:963–980`: the map pin is optional; **Lokasi atau patokan** is the manual alternative. Do not set a fake pin or device coordinate.
- `src/components/report-evidence.tsx:251–262,280–283`: switching to supporting mode does NOT clear a previously collected device snapshot. Therefore “supporting mode” does not guarantee “no GPS data sent.” For this study instruct participants to choose supporting mode before requesting any location, and stop if they already supplied sensitive location rather than assuming the mode switch removes it. Consider a separate future explicit clear-location control; not changed here.

### Exact required controls and constraints

Source: `src/components/report-evidence.tsx:405–437,467–526`, `src/components/forms.tsx:166–205`, `src/lib/validation.ts:3–7,25–87`.

| Visible label | Requirement |
| --- | --- |
| **Foto pendukung (JPG, PNG, WebP)** | Upload 1–3 nonempty JPG/PNG/WebP images, at most 5 MB each. At least one image is mandatory even though the file input lacks a native required marker. A downloaded study example is suitable for the simulation. |
| **Kategori** | Required; choose **Penumpukan**, **Tempat sampah penuh**, or **Sampah berserakan**. Study scenario uses Penumpukan. |
| **Waktu pengamatan** | Required date/time, initialized to current WIB. Use the time of the exercise. Database rejects a time more than five minutes in the future (`202610100003_audit_controls.sql:35`). |
| **Lokasi atau patokan** | Required, 3–2000 trimmed characters. Use the fictional scenario landmark, never the participant's home address. |
| **Apa yang Anda lihat?** | Required, 10–2000 trimmed characters. Mark it as a simulation, not an actual event. |
| **Alasan menggunakan bukti pendukung** | Required in supporting mode, 3–2000 trimmed characters. Example: “Uji jarak jauh dengan gambar contoh”. |
| **Saya telah memeriksa lokasi/patokan kejadian** | Required checked confirmation. This must refer to checking the scenario landmark, not asserting physical presence. |
| **Kirim laporan** | Submit once after checking the required fields. |

The selected active region ID is supplied by the application; it is not a free-text required input in the evidence form. Login with the participant's own account is required (`dashboard.tsx:915–960,986–1003`; SQL execute permission is authenticated-only).

### Is being outside the area prohibited?

**Physical presence outside the area is not a rejection condition in the reviewed reporting path. Selecting an inactive/unserved region is prohibited. These are different constraints.**

- `supabase/migrations/202610100003_audit_controls.sql:33–37`: the report-create branch checks selected region `active`, observed time, and report data; it does not check participant distance/geofencing. The newer evidence wrapper delegates to that branch after evidence checks.
- `src/components/dashboard.tsx:933–960`: inactive region blocks the form with **Wilayah ini belum terlayani. Laporan tidak dapat dikirim.**
- `src/components/report-evidence.tsx:331–334`: **Pusat wilayah hanya ilustrasi, bukan batas layanan. Kesesuaian wilayah perlu dikonfirmasi pengelola.** Do not infer a service boundary from the map center.
- `docs/PRD_USER_STUDY_SUS.md:8` and `src/app/uji-pengguna/page.tsx:29–41`: participants may manually choose **Kawasan Hijau A · Simulasi**, use the scenario landmark, and submit supporting evidence without home GPS. This does not extend real service coverage. If that region is missing/inactive or the task fails, record failure/assistance and continue to evaluation. Live region availability and Cloud migration state were not verified.

## Study instruction alignment

- `src/app/uji-pengguna/page.tsx:35–38`: the route correctly names **Gunakan bukti pendukung**, skips device location, supplies a sample image and scenario values. However it abbreviates visible labels as “patokan”, “deskripsi”, and “alasan”; for unassisted remote participants use the exact labels in the table above.
- `src/app/uji-pengguna/page.tsx:38`: explicitly tell participants to tick **Saya telah memeriksa lokasi/patokan kejadian**, then press **Kirim laporan**. Current “Periksa informasi lokasi/patokan dan ringkasan” is vague and suggests a summary step that is not present in the inspected evidence form.
- `src/app/uji-pengguna/page.tsx:29`: the navigation item is **Jadwal angkut**, not just “Jadwal” (`dashboard.tsx:78`). Match the actual label.
- `src/app/uji-pengguna/page.tsx:40–51`: outside-area, no-real-service, stop-on-failure, and evaluate-even-after-failure instructions align with the PRD. Keep them.

## Header: why Masuk moves onto another row

- `src/app/globals.css:152–160`: `.topbar` is a wrapping flex container with 48px horizontal padding and 24px gaps.
- `src/app/globals.css:162–213`: the identity uses a 180px logo plus a second product identity, spacing and divider. Navigation has five public items with icons, 16px text, 24px horizontal padding per item, gaps, and its own wrapping.
- `src/components/dashboard.tsx:491–600`: the action group containing the bell and **Masuk** comes after the whole navigation flex item.
- `src/app/globals.css:224–228`: actions already have `flex-shrink: 0`; this preserves their width but does not prevent their entire flex item moving to a new row. A nowrap rule on the word “Masuk” alone will not fix this.
- `src/app/globals.css:1529–1541,1553–1605`: desktop navigation uses `max-width: calc(100% - 570px)` rather than reserving the actual identity/action/gap widths. The duplicate identity disappears only at 1200px; the hamburger begins only at 1000px. Intermediate widths and added role-specific navigation can exhaust the row. This is a source-level explanation, not a measured viewport reproduction.

### Minimal recommended fix (not applied)

1. Keep **Panduan** and SUS out of top navigation, as required by the PRD. The reviewed `nav` array already omits both (`dashboard.tsx:76–82`); retain `/panduan` via the footer and study/evaluation links in the study flow.
2. Give identity and actions stable first-row slots rather than relying on flex wrapping. A compact desktop-only grid is the smallest robust layout correction: `.topbar { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; }`, `.main-navigation { min-width: 0; max-width: none; margin-left: 0; }`. Keep navigation's own wrapping so extra coordinator/admin links can grow header height without displacing Masuk. Restrict this change to widths above the hamburger breakpoint; retain the existing mobile flex/menu behavior.
3. Remove/override the desktop `calc(100% - 570px)` nav cap when using grid. Keep `.header-actions` nonshrinking and make **Masuk** visually primary via the existing `button primary small-button` classes; do not hide it inside the menu.
4. If the three-column layout becomes too dense, extend the existing hamburger rules to a tested larger breakpoint (e.g. start testing at 1200px), rather than shrinking text, clipping navigation, or merely forcing the entire desktop row to nowrap. Hide the duplicate product identity at that same breakpoint.
5. Verify 320/375/390px mobile, 1000/1024px, 1200/1201px, 1280/1440px, 200% zoom, and longest signed-in names plus coordinator/admin menus. Masuk, bell and menu should remain visible without horizontal page scrolling; preserve 44px targets, focus indication and current menu keyboard behavior. Browser checks remain outstanding.

Guideline reference consulted: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md (layout overflow, responsive content, labels, focus and touch targets). No runtime or deployment success is claimed by this review.
