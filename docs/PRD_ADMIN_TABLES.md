# Admin-only operational data tables

Approved scope: the administrator's data-bearing views—not a redesign of coordinator, worker, reporter, or anonymous experiences. Existing backend permissions and mutation forms remain unchanged. Admin can already access the selected-region workspace and its operational lists; table presentation does not grant additional capabilities.

## P0
- Reusable, semantic, responsive table with search across meaningful visible fields, relevant select filters, sortable columns, result count, reset, empty state and bounded pagination. Changing a query/filter/sort resets to page one; controls have labels and buttons indicate sort direction.
- In administrator sessions only, show tables for selected-region schedules, events, pending reports, incidents, feedback, prevention hotspots/actions, workspace summaries where data lists exist, and administration regions, memberships, moderation. Row detail/actions remain reachable by keyboard, with existing authorized forms unchanged.
- Public, reporter, worker and non-admin coordinator rendering and permissions remain exactly as before. Tables scroll within their own container on 390px; document does not gain horizontal overflow.

## P1 / boundaries
- Preserve statistics, maps, create forms and explanatory copy. Do not create permissions or modify server contracts. Admin sees only records delivered by existing workspace/public APIs (selected-region scope except existing admin-wide administration data).
- No backend search or new data collection. Pagination is client-side at 10 rows; changing workspace data refreshes displayed rows.

## Acceptance
- Test search + filter intersection, sorting both ways, count, reset, empty search and pagination boundary on real table behavior; desktop and 390px browser checks with admin session.
- Verify live administrator navigation, row details/actions and existing non-admin presentation; lint, typecheck, tests, build, production deployment and alias/version check.

## Delivery verification (2026-10-22)
- Implementation is live at `https://sampah-terhubung-langgamramadhan9-3266.vercel.app` (Vercel production deployment `dpl_CwFmiyPWJGaYtKRscHkDDAKshf6H`).
- Playwright verified admin login, 10 admin data-table sections across Administrasi, Ruang kerja, Kegiatan and Jadwal on 1440px and 390px viewports; search, filter intersection, sort in both directions, reset, details dialogs and Escape close; no document horizontal overflow or uncaught browser errors. Additional navigation verified Pencegahan and Ringkasan wilayah.
- Anonymous public routes remained outside admin table rendering. `npm run lint`, `npm run typecheck`, `npm test` (70 passing) and `npm run build` passed.
- Automated live table checks do not establish all role permutations or a screen-reader/WCAG audit.
