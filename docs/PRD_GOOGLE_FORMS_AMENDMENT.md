# PRD amendment — single SUS destination

Approved scope: explicit user request, 22 October 2026.

- P0: All SUS response actions go to the provided Google Forms respondent URL through one shared constant. `/evaluasi` redirects there; no duplicate native questionnaire.
- P0: `/uji-pengguna` explains access to real features, without consent/code gates. Keep voluntary simulation context; consent belongs on Google Forms and participant code is optional.
- Explain public schedule access, own-account login only for protected actions, active simulated region, supplied sample images, no private photos/GPS/home addresses, and submitted versus verified/resolved status.
- Preserve existing admin/table work, legacy response data, API and migration. No Google Form edits, credentials, database writes, seeds or response submissions.
- Verification: test-first regressions, lint/typecheck/tests/build, real production CLI deployment, canonical alias and browser checks at 390/1440px, exact outbound links and legacy redirect. Inspect form read-only if accessible.
- Non-goals: redesign, automatic data migration/synchronization, changing admin behavior, recruitment or collecting synthetic responses.
