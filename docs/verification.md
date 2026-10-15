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

## Hosted activation and verification

- Supabase Project URL and publishable key were supplied and validated against `/auth/v1/settings` (HTTP 200). Email signup and confirmation are enabled. Public configuration is stored in ignored `.env.local` and GitHub Actions variables. The configured production build and all 17 local tests pass.
- Owner CLI login, project linking, migration `202610150001_initial`, and Auth URL configuration are complete. The hosted database has 11 application tables with RLS enabled; 10 are in the Realtime publication (invites are deliberately excluded). CLI 2.121.0 was obtained from the official GitHub release and its SHA256 verified after the npm ARM64 binary dependency failed to install.
- The Supabase-enabled deployment succeeded on 15 October 2026: [workflow run](https://github.com/Arndyka/Date-Plan/actions/runs/38737806434), source commit `8832a4b`.
- `node tests/remote-smoke.mjs` passed seven hosted checks: three temporary users authenticated; concurrent invitation acceptance admitted exactly one partner; outsider and anonymous access were denied; actual Realtime updates arrived and stale writes were rejected; independent desktop/phone browser contexts synchronized creation and edits; conflicting edits preserved drafts and reload retained cloud data; a generated recovery link returned to the live app and changed the temporary account password.
- The hosted smoke test removed its temporary room and all three accounts. A follow-up query found zero users carrying its test metadata. It uses confirmed temporary accounts and admin-generated recovery links; it does not send email or prove mailbox delivery.
- The first Realtime test exposed a subscription readiness gap: channel `SUBSCRIBED` can precede the PostgreSQL listener becoming ready. The test now waits for the `system` event for `postgres_changes` with status `ok`; the app also refreshes data at that point to cover changes during startup. See the [official Realtime troubleshooting guide](https://supabase.com/docs/guides/troubleshooting/realtime-postgres-changes-troubleshooting).
- All **24 browser tests passed against the public GitHub Pages URL** in one run (1.0 minute, two workers), covering desktop and mobile. Production screenshots were visually inspected at both sizes. This confirms the deployed frontend and demo behavior, not private cloud synchronization.

## Email delivery verified

Email confirmation remains enabled. Gmail SMTP is configured with TLS on port 465, an App Password, sender name `Our Little Date`, and a limit of 10 Auth emails per hour. Direct SMTP authentication returned 235. Remote configuration applied successfully; secrets remain in ignored local configuration and the hosted Auth service.

With the owner's explicit approval, a single confirmation email was sent through Supabase signup to a Gmail alias belonging to the owner. Supabase recorded the send, the owner confirmed receipt and a working return to Date-Plan, and the admin API confirmed `email_confirmed_at` was set. The temporary account was then deleted. This verifies one actual Gmail delivery and confirmation flow; delivery to other providers and reset-email mailbox delivery were not separately tested. Recovery routing and password changes passed the independent hosted smoke test. See [Supabase SMTP requirements](https://supabase.com/docs/guides/auth/auth-smtp).

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
- Shared cloud behavior and an actual email confirmation flow have been verified against the live deployment. No Auth confirmation requirement has been disabled.
