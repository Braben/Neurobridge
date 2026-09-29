# Implementation Progress

Verified on 2026-09-29. This records completed batches, not completion of the entire Figma implementation.

## Completed

1. Inventoried 119 visible Figma screens, states, and modals with source links, dimensions, roles, and proposed routes. See `design/screen-inventory.md` and its JSON companion.
2. Established shared palette/control tokens, primary and secondary buttons, accessible native fields, the exported dropdown caret, and a development-only component review page.
3. Moved six authentication screens to `src/features/auth` and the authentication frame to `src/components/layouts`, preserving public URLs and existing behavior.
4. Added Figma-sized OTP cells with labels, keyboard editing, paste/autofill, pending locks, rejection/retry behavior, and responsive constraints. Fixed the auth layout's narrow-screen overflow.
5. Fixed pending therapist OTP targets being lost during profile hydration. Added account-scoped, tab-scoped pending workflow restoration and cleanup, separate from therapist approval.
6. Restricted `/design-system` to development with an explicit production HTTP 404.
7. Matched the shared auth panel and OTP default composition to the inspected Figma canvas: original transparent logo, reference image crop, arrow, content rail, typography, footer, and two-minute resend display. Added failed-delivery retry, old-code cleanup, and an expiry-based timer that catches up after browser suspension. See `design/authentication-reference.md`.
8. Fixed controlled fields accepting and then losing text before hydration. Shared inputs, selects, textareas, and OTP cells now wait for their React handlers; regression coverage checks server-rendered readiness and the interactive workflows.

## Verification

- `PORT=3100 npx playwright test --workers=2`: 24 passing tests with mocked APIs against the development server.
- Production auth suite at port 3101: all 13 tests in `auth-handoff.spec.ts`, `auth-otp.spec.ts`, and `auth-visual.spec.ts` pass against `next start` with mocked APIs.
- `npm run lint`: passes.
- `npm run build`: passes, including production TypeScript checks and static page generation.
- Production smoke checks: login, parent/therapist/admin registration, forgotten-password, reset-password, and verification URLs return 200; `/design-system` returns 404.
- Component and OTP screenshots reviewed at desktop and narrow mobile widths; tests also capture 390px views. OTP visual assertions match the source's 1440x1024 geometry and locally served image assets.
- `git diff --check`: passes. Existing unrelated work remains intact; no deployment was performed. This verified batch is the session checkpoint requested for commit.

## Remaining

- Complete the remaining signin, registration, forgotten-password, and reset-password form compositions, including password icons. The shared panel and OTP default composition have been audited; other authentication screens are not yet fully signed off.
- Audit remaining typography, spacing, checkbox/radio/toggle, notification, dialog, table, and navigation families.
- Finish the landing page against its full Figma frame and assets, then parent, therapist, and administrator screen-by-screen implementation.
- Continue infrastructure and backend folder migration with regression coverage.
- Verify real backend authorization, email/SMS delivery, deployment configuration, and staging workflows. Browser API mocks and a passing frontend build do not establish hosting readiness.

The authentication handoff contract and its server-model limitations are recorded in `architecture/authentication-handoffs.md`. Full-screen visual parity is not yet signed off.
