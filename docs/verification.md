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

Verified commands at the feature-complete checkpoint: `npm test` — 17 passed; `npm run build` — TypeScript and Vite passed; `npm run test:e2e` — 12 passed on desktop and phone. The audit is automated coverage of the dashboard, not a certification of every interaction or screen.

## External checks still pending

- Supabase Project URL and publishable key have not yet been supplied. The connector was discovered but its connection has not been confirmed.
- Remote migration, email delivery, password recovery, two real accounts, actual Realtime transport, and simultaneous transactions across server connections therefore remain unverified. PGlite proves database behavior in one local PostgreSQL instance; it is not an external account test or a concurrent-session test.
- Deployment and live-URL smoke results will be recorded after the GitHub workflow completes.

## Review decisions

- Work uses an implementation branch in the user-specified checkout; the repository initially contained only planning documents.
- Small domain helpers are grouped in `logic.ts`. Form payloads use typed JSON with relational IDs/FKs and server validation. Profile display names are stored in `space_members` because accounts have one room.
- API configuration is deliberately absent from Git. A deployment without configuration opens an explicit local demo; it does not claim private cross-device synchronization is active.
- Browser automation tests use an isolated headless Edge session; no preexisting browser tabs or personal browser data are modified.
