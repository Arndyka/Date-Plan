# Verification ledger

Date: 15 October 2026 (Asia/Jakarta).

## Implemented and checked locally

- React/TypeScript production build and type checking.
- Domain tests: integer budget arithmetic, contribution limits, Jakarta date conversion, invalid dates, TikTok host validation, URL encoding, Google Calendar prefills, ICS escaping/UID, and idea filtering.
- Real PostgreSQL via PGlite: room creation, RLS outsider denial on private tables, invitation acceptance/reuse/expiry/revocation, two-person limit, money/time constraints, parent ownership, version conflicts, vote uniqueness, author-only journals, and retaining inspiration when a linked plan is deleted.
- Demo persistence: data survives reload, stale updates/deletes fail, deleting a plan removes dependent activities.
- Playwright desktop/phone journeys exercise plan creation and budget entry, completing a date, notes, TikTok URL validation, wishlist votes, random ideas, checkbox edits and assignment, and inspiration-plan links.
- Responsive review covers 360, 390, 768, and 1280 px. Dialog Escape/focus restoration and reduced motion are checked.
- An axe accessibility audit found insufficient contrast in supporting pastel text. Text colors were darkened while preserving pastel surfaces. The rerun passed on both desktop and phone, with zero WCAG A/AA rule violations detected on the dashboard.

Verified commands after review fixes: `npm test` — 17 passed; `npm run build` — TypeScript and Vite passed. The production-preview browser suite now covers 24 desktop/phone cases: 22 passed in the initial run, while two multi-tab cases timed out during the parallel run; both passed unchanged on the targeted rerun (10.7 seconds). Browser workers are now capped at two to reduce local resource contention. The audit is automated coverage of the dashboard, not a certification of every interaction or screen.

## Final review and regression fixes

- Open plan and room editors now retain their edit-start version, rejecting stale saves while preserving the user's draft. Two-tab tests reproduced silent overwrites before the fix and passed afterward, including retrying a stale save.
- A room with one member no longer displays split fields or a debt owed by an absent partner. A regression reproduced the incorrect settlement before the fix and passed afterward.
- Remote plan deletion previously unmounted open forms. This was promoted from a minor review finding to important because it lost unsaved user input. Plan, activity, and checklist editors now retain their drafts with a deletion notice and prevent saving against a deleted parent. All three regressions failed before the fix and passed afterward.
- No review findings were deferred. Local multi-tab tests exercise synchronization through the demo adapter's storage events; they do not establish that hosted Supabase Realtime works.

## External checks still pending

- Supabase Project URL and publishable key have not yet been supplied. The connector was discovered but its connection has not been confirmed.
- Remote migration, email delivery, password recovery, two real accounts, actual Realtime transport, and simultaneous transactions across server connections therefore remain unverified. PGlite proves database behavior in one local PostgreSQL instance; it is not an external account test or a concurrent-session test.
- GitHub Pages deployment succeeded on 15 October 2026: [workflow run](https://github.com/Arndyka/Date-Plan/actions/runs/38731357035), source commit `620e6d9`. The public URL `https://arndyka.github.io/Date-Plan/` returned HTTP 200 with the expected app title. The deployed configuration currently supports the local demo; Supabase has not been activated.
- All **24 browser tests passed against the public GitHub Pages URL** in one run (1.0 minute, two workers), covering desktop and mobile. Production screenshots were visually inspected at both sizes. This confirms the deployed frontend and demo behavior, not private cloud synchronization.

## Review decisions

- Work uses an implementation branch in the user-specified checkout; the repository initially contained only planning documents.
- Small domain helpers are grouped in `logic.ts`. Form payloads use typed JSON with relational IDs/FKs and server validation. Profile display names are stored in `space_members` because accounts have one room.
- API configuration is deliberately absent from Git. A deployment without configuration opens an explicit local demo; it does not claim private cross-device synchronization is active.
- Browser automation tests use an isolated headless Edge session; no preexisting browser tabs or personal browser data are modified.
- Workflow bookkeeping uses native PowerShell because the bundled shell helpers are not native to this environment; there is no product behavior change.
- Domain helpers and shared UI use focused files rather than one file per trivial function. A future refactor would be required if these modules grow substantially.
- JSON payloads retain relational parent IDs, foreign keys, server-side validation, and RLS. Introducing new fields requires updating TypeScript and SQL validation together.
- Display names are stored in room membership rather than a separate profile table; supporting several rooms per account would require a schema change.
- Test selectors use accessible headings and the mobile navigation menu rather than ambiguous repeated text; coverage and assertions remain intact.
- Shared cloud behavior remains an explicit pending dependency. Deploying before configuration provides the local demo only; activation requires migration, Auth URLs, public configuration, and remote verification.
