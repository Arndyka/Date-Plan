# Our Little Date Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the couple's private, synchronized date planner to the user's Date-Plan GitHub repository with a responsive romantic interface and accessible animation.

**Architecture:** React/TypeScript frontend served through GitHub Pages; Supabase Auth, PostgreSQL RLS, and Realtime provide private shared data. Feature components call typed repositories; money, time, URL, and calendar logic remain pure and independently testable. Demo mode is explicitly separate from authenticated data.

**Tech Stack:** React, TypeScript, Vite, CSS/SVG, Supabase JS, Vitest, Testing Library, Playwright, SQL migrations, GitHub Actions. Resolve compatible stable dependency versions at implementation time and commit the resulting lockfile.

**Spec:** `docs/superpowers/specs/2026-10-15-our-little-date-design.md`

## Global Constraints

- Bahasa utama Indonesia, mata uang rupiah, zona waktu jadwal Asia/Jakarta.
- Routing berbasis hash agar tautan langsung tetap bekerja pada hosting statis.
- Hosting frontend: GitHub Pages melalui GitHub Actions, base path `/Date-Plan/`.
- Nominal disimpan sebagai bilangan bulat rupiah, bukan floating point.
- Versi awal membatasi satu ruang aktif per akun.
- RLS diberlakukan pada seluruh tabel yang dapat diakses dari klien.
- `prefers-reduced-motion` menonaktifkan gerakan dekoratif, pergeseran, dan confetti.
- Foto pribadi dan musik dari repository referensi tidak otomatis disalin.
- Preview atau demo lokal tidak dianggap bukti sinkronisasi atau deployment selesai.
- No secrets in source, build output, logs, or committed environment files.
- Existing user authorization covers building and deployment to `Arndyka/Date-Plan`; do not request publication permission again.

## Review Focus

1. An invite opened while logged out survives login, is consumed once, and cannot admit a third member; Task 2 tests this.
2. Midnight in Jakarta, month/year boundaries, and leap days preserve the intended calendar date; Task 1 tests this.
3. Concurrent edits and a deletion in another session must not silently overwrite or resurrect records; Tasks 2 and 3 test this.
4. External URLs with deceptive hostnames, script schemes, or malformed escaping must not execute code; Tasks 1 and 4 test this.
5. Reduced motion, small screens, failed embeds, and keyboard-only dialogs remain usable; Tasks 3–6 test this.

## Task 1: Typed domain, validation, and project foundation

**Files:** `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.gitignore`, `.env.example`, `src/domain/types.ts`, `src/domain/money.ts`, `src/domain/schedule.ts`, `src/domain/links.ts`, `src/domain/calendar.ts`, `src/domain/__tests__/domain.test.ts`.

**Interfaces:**
- `BudgetSummary { estimated: number; actual: number; remaining: number; firstOwesSecond: number }`.
- `summarizeBudget(items: Activity[], limit: number, firstShare: number): BudgetSummary`; firstShare is an integer percentage 0–100, remainder rounding belongs to the second member.
- `parseRupiah(input: string): number`; reject fractional, negative, unsafe-integer, and nonnumeric values.
- `jakartaInstant(date: string, time: string): string`; validates real calendar dates and returns ISO UTC.
- `validateSchedule(start: string, end: string): void`; throws when end is not after start.
- `safeTikTokUrl(input: string): URL | null`, `mapsUrl(place: string, directions: boolean): string`.
- `calendarIcs(plan: Plan): string`, `googleCalendarUrl(plan: Plan): string`; stable UID per plan, escaped user text and explicit start/end.
- `types.ts` exports Profile, Space, Member, Plan, Activity, CalendarNote, Inspiration, WishlistItem, Vote, ChecklistItem, Memory; mutable records include version and timestamps.

- [ ] Scaffold package/configuration and write domain tests before implementations. Assert 101 rupiah at 50:50 gives obligations 50/51; unpaid estimates never count as actual; negative/fractional inputs fail; contributions sum to actual. Before a partner joins, disable partner allocation and do not invent a user ID.
- [ ] Add date/URL/export cases: `2026-10-15 00:30` Jakarta becomes `2026-10-14T17:30:00.000Z`; invalid `2026-02-29` fails; valid leap day passes; end-before-start fails; `https://tiktok.com.evil.example/` and `javascript:` fail; newline/comma/semicolon in ICS text are escaped and cannot inject events.
- [ ] Run `npm.cmd test -- src/domain/__tests__/domain.test.ts` and record the missing-feature failure.
- [ ] Implement the exported types and pure functions. Use integer arithmetic for money; validate dates by round trip; fold long ICS lines by UTF-8 octets without splitting characters.
- [ ] Run the domain tests and TypeScript check; commit the foundation when both pass.

## Task 2: Private couple space and synchronization

**Files:** `supabase/migrations/202610150001_initial.sql`, `supabase/tests/access.sql`, `src/data/client.ts`, `src/data/repository.ts`, `src/data/useSpaceData.ts`, `src/auth/AuthProvider.tsx`, `src/auth/AuthScreen.tsx`, `src/auth/SpaceSetup.tsx`, `src/auth/InviteScreen.tsx`, `src/data/__tests__/repository.test.ts`, `tests/e2e/auth.spec.ts`.

**Interfaces:**
- `createSpace(name: string, nickname: string): Promise<Space>` and `acceptInvite(token: string): Promise<Space>` use transactional RPCs.
- `createInvite(spaceId: string): Promise<string>` returns the raw token once; only its digest is stored. `revokeInvite(inviteId: string): Promise<void>`.
- `SpaceRepository.list<K extends EntityName>(entity: K, spaceId: string): Promise<EntityMap[K][]>`.
- `SpaceRepository.create<K extends EntityName>(entity: K, input: EntityInsert[K]): Promise<EntityMap[K]>`.
- `SpaceRepository.update<K extends EntityName>(entity: K, id: string, version: number, patch: EntityPatch[K]): Promise<EntityMap[K]>`.
- `SpaceRepository.remove(entity: EntityName, id: string, version: number): Promise<void>`.
- Stale updates/deletions produce `ConflictError`; denied operations never appear successful.
- `useSpaceData(spaceId: string)` returns typed data, load/error/save status, mutation methods, and refresh; authentication state is provided separately.

- [ ] Write SQL tests for outsider denial across every table, two-member access, immutable space/author ownership, correct child-parent membership, unique votes, budget constraints, expired/revoked/reused invites, and concurrent admission beyond two members.
- [ ] Write repository tests for failed/stale writes preserving the user's draft, stale deletion failing, no session refusing private data access, and reconnect triggering a refresh.
- [ ] Run tests against the unimplemented repository/schema and record failures. Use a disposable local database if available; never reset a remote project for tests.
- [ ] Implement migration with FKs, checks, indexes, restricted grants, and RLS. SECURITY DEFINER helpers use fixed search paths and explicit caller checks. Invite RPC locks the room and enforces one active room per account. Transactional aggregate writes validate contributions atomically.
- [ ] Implement Auth screens and setup flows including password reset and recovery callbacks. Carry the invite securely through login and remove it after processing. Preserve input on errors.
- [ ] Subscribe only to authorized space data, refresh on visibility/network recovery, unsubscribe on space changes/logout, and clear private client state on logout. Disable server mutations when offline.
- [ ] Run SQL and repository tests plus two-browser-session auth tests. If Supabase is unavailable, mark remote validation pending and continue independent frontend work; never replace a remote result with a demo assertion.
- [ ] Commit the tested backend/auth work and document any infrastructure-dependent checks still pending.

## Task 3: Responsive shell, dashboard, plans, budget, and animation

**Files:** `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/app.css`, `src/components/{AppShell,Dialog,Field,EmptyState,SyncStatus,Flower,Confetti}.tsx`, `src/features/dashboard/Dashboard.tsx`, `src/features/plans/{PlanList,PlanDetail,PlanForm,ActivityForm,Timeline,BudgetPanel,Checklist}.tsx`, `src/demo/demoData.ts`, `src/demo/DemoProvider.tsx`, `tests/e2e/planner.spec.ts`.

**Interfaces:** Feature screens consume `useSpaceData` through a common data context. `Dialog({open,title,onClose,children})` owns focus handling. `PlanDetail({planId})` composes timeline, budget, checklist, and rainy-day notes. `BudgetPanel({plan,activities,members})` uses domain calculations exclusively. Demo implements the same repository interface in a separate local namespace and shows a persistent demo label.

- [ ] Write failing browser journeys: create/edit/delete a plan, reorder activities, invalid end time, overlap warning, split expenses and totals, checklist changes, and mark complete. Include empty state and failed save retaining form contents.
- [ ] Run journeys against the incomplete UI to establish failure.
- [ ] Build the reference-inspired cream/blush/berry design, serif headings, scrapbook accents, mobile bottom navigation, desktop sidebar, dashboard countdown, and consistent form/status states.
- [ ] Implement all plan/activity/checklist mutations, deletion confirmation, statuses, budget contribution validation, split percentage editing, and conflict recovery without discarding drafts.
- [ ] Add subtle flower motion, short transitions, and action-triggered completion confetti; apply reduced-motion rules. Provide keyboard ordering instead of drag-only controls. Manage focus trapping/restoration in dialogs.
- [ ] Test at 360 and 390 px, tablet, and desktop; verify no horizontal overflow, visible focus, accessible field errors, reduced motion, and usable long dialogs. Repeat the concurrent-edit case through the UI.
- [ ] Run domain/repository suite and planner journeys; commit when available checks pass.

## Task 4: Calendar, Maps, and TikTok inspiration

**Files:** `src/features/calendar/{Calendar,CalendarNoteForm,SaveTheDate}.tsx`, `src/features/inspiration/{InspirationBoard,InspirationForm,TikTokEmbed}.tsx`, `src/components/PlaceLink.tsx`, `tests/e2e/calendar-inspiration.spec.ts`.

**Interfaces:** `Calendar({plans,notes})` uses Jakarta dates; `SaveTheDate({plan})` consumes `calendarIcs` and `googleCalendarUrl`; `PlaceLink({name,address,url})` uses validated URLs. `TikTokEmbed({url})` loads supported embeds only after user interaction and always exposes a safe original link.

- [ ] Write failing journeys for next/previous month, year boundary, today button, CRUD calendar notes, automatic plan appearance, external-calendar prefill, and `.ics` download with correct event dates.
- [ ] Add cases for TikTok CRUD/filtering, malicious hostname rejection, short-link fallback, private/unavailable video fallback, and Google Maps search/directions without location permission.
- [ ] Run tests to establish failures, then implement the calendar and integrations using Task 1 helpers.
- [ ] Keep user content as text; do not fetch arbitrary remote metadata through a proxy or inject returned HTML. Reject unsupported URL protocols. Explain that external calendar copies are not continuously synchronized.
- [ ] Run domain tests and calendar/inspiration journeys; commit the feature set.

## Task 5: Wishlist, ideas, memories, and couple settings

**Files:** `src/features/wishlist/{Wishlist,DateRoulette}.tsx`, `src/features/memories/Memories.tsx`, `src/features/settings/Settings.tsx`, `src/domain/ideas.ts`, `src/domain/__tests__/ideas.test.ts`, `tests/e2e/extras.spec.ts`.

**Interfaces:** `eligibleIdeas(items: DateIdea[], category: string | null, ceiling: number | null): DateIdea[]` returns matching candidates; DateRoulette chooses among them on demand. Settings updates nicknames, room name, and shared sweet note; invite creation/revocation use Task 2 RPCs.

- [ ] Write failing cases for budget/category filtering, empty eligible results, wishlist edit/delete, vote toggling, one vote per member, and converting an idea into a new plan draft without inventing a schedule.
- [ ] Add journal tests: each member can edit their own journal/rating and read the partner's entry; outside accounts cannot read either. Add settings and logout journeys.
- [ ] Implement wishlist, idea picker, completed-date journals, profile/room settings, and sweet note. Avoid photo/video upload or messaging features outside the specification.
- [ ] Run the full available unit and browser suites; commit when passing.

## Task 6: Production setup, end-to-end verification, and GitHub Pages

**Files:** `.github/workflows/deploy.yml`, `.github/workflows/check.yml`, `README.md`, `docs/setup-supabase.md`, `docs/verification.md`, `public/favicon.svg`, `playwright.config.ts`.

**Interfaces:** Deployment reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from configured repository variables and publishes Vite's `dist` artifact. Build without backend values exposes clearly labeled demo/setup state, not a fake synchronized account. Tests use separate fixture users/data, never the couple's real records.

- [ ] Write a production smoke test for `/Date-Plan/`, assets, hash-route refresh, signin screen, demo boundary, and app navigation on mobile. Configure deterministic local demo journeys separately from real Supabase integration tests.
- [ ] Document Supabase migration, Auth redirect/recovery configuration, allowed Realtime tables, RLS checks, environment variables, and removal of test fixtures. Verify compatible library APIs against official docs before use.
- [ ] Configure Actions to install from lockfile, typecheck, run tests, build, upload Pages artifact, and deploy with the minimum required token permissions. No backend service-role secret is needed in the frontend build.
- [ ] Run `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`, and the browser suite. Review console errors, production bundle for accidental secrets, responsiveness, focus, and reduced motion. Record exact commands/results and outstanding remote checks in `docs/verification.md`.
- [ ] Review the complete diff against the specification; fix issues and rerun affected checks. Use the required requesting-code-review workflow at completion.
- [ ] Verify GitHub repository identity/access, commit implementation, push to `origin/main`, enable Pages with Actions, and inspect the actual workflow result. User already authorized these actions.
- [ ] Configure the user's Supabase project through available authorized access. If unavailable, ask only for the missing connection information and clearly report that cross-device sync remains unconfigured; continue deployment of the usable demo without misrepresenting it as the finished private service.
- [ ] Open the returned production URL and run smoke checks. Confirm the deployed commit matches the implementation. Report the live URL, source commit, checks performed, and any remaining integration blockers.

## Plan self-review and current environment

All spec sections map to tasks: visual/accessibility 3 and 6; auth/security/sync 2; domain rules 1; planning/budget/checklists 3; calendar/Maps/TikTok 4; unique extras/settings 5; release and verification 6. External-calendar automation and uploads remain out of scope as agreed.

Verified on 15 October 2026: repository `Arndyka/Date-Plan` is public, the available GitHub credential has push permission, and GitHub Pages is not enabled yet. Node is `v24.18.0`; npm is `11.16.0` via `npm.cmd` because PowerShell script execution blocks `npm.ps1`. No Supabase configuration is present in this checkout or its named environment variables. No paid service creation is authorized or necessary for the frontend release.

Recommended execution method: **native**, implemented directly in this session. The feature tasks share domain and repository interfaces; keeping implementation in one session avoids coordination overhead. The required final review can be delegated under its applicable skill after execution is approved.

Status: plan written and self-reviewed; awaiting the plan review required by the writing-plans skill. No application source has been implemented yet.
