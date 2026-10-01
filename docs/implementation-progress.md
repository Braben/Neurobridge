# Implementation Progress

Updated on 2026-10-01. This records completed batches, not completion of the entire Figma implementation.

## Completed

1. Inventoried 119 visible Figma screens, states, and modals with source links, dimensions, roles, and proposed routes. See `design/screen-inventory.md` and its JSON companion.
2. Established shared palette/control tokens, primary and secondary buttons, accessible native fields, the exported dropdown caret, and a development-only component review page.
3. Moved six authentication screens to `src/features/auth` and the authentication frame to `src/components/layouts`, preserving public URLs and existing behavior.
4. Added Figma-sized OTP cells with labels, keyboard editing, paste/autofill, pending locks, rejection/retry behavior, and responsive constraints. Fixed the auth layout's narrow-screen overflow.
5. Fixed pending therapist OTP targets being lost during profile hydration. Added account-scoped, tab-scoped pending workflow restoration and cleanup, separate from therapist approval.
6. Restricted `/design-system` to development with an explicit production HTTP 404.
7. Matched the shared auth panel and OTP default composition to the inspected Figma canvas: original transparent logo, reference image crop, arrow, content rail, typography, footer, and two-minute resend display. Added failed-delivery retry, old-code cleanup, and an expiry-based timer that catches up after browser suspension. See `design/authentication-reference.md`.
8. Fixed controlled fields accepting and then losing text before hydration. Shared inputs, selects, textareas, and OTP cells now wait for their React handlers; regression coverage checks server-rendered readiness and the interactive workflows.
9. Matched parent and therapist signin default layouts to their Figma frames, including the wide heading, measured 361px form rail, exact password icons, filled/disabled states, recovery/signup spacing, loading feedback, and mobile error placement. Role queries preserve the intended signup destination without granting authorization. See `design/signin-reference.md`.
10. Matched parent/therapist signup default geometry, original calendar/password icons, role-aware signin links, pending field locks, retry feedback, and OTP transport. Preserved the original parent layout while keeping redesign alternatives in the inventory.
11. Matched forgotten-password and create-password default compositions. Added a separate code-entry step, preserving the final backend reset transaction and positional OTP editing. Fixed shared auth text-node hydration mismatches.
12. Added the original Figma contact frame at `/contact`, with its exact photo crop, local resize icon, bounded fields, genuine persistence/error states, and recovery-topic handoff. Connected the existing landing form and corrected footer route links. This does not sign off the entire landing design.
13. Added persisted public inquiries, validated/rate-limited contact endpoints, admin-only listing/status updates, and a frontend inquiry queue separate from private platform conversations. Added transactional OTP/reset consumption, account-neutral reset metadata, numeric code validation, and credential-safe admin projections. See `architecture/backend-route-map.md`.
14. Implemented the therapist's cross-child `/sessions` screen from Figma 673:6411 and expanded field dialog 673:6640. Added the standalone full-width shell, original local icons/logo, measured table columns and rows, real search/sort/retry behavior, accessible full-text reading, and mobile overflow handling. Corrected the dashboard table link and note-entry navigation. See `design/therapist-session-notes-reference.md` for source geometry and documented adaptations.

## Session Checkpoint

The earlier foundation/authentication batch was committed as `37c98c2` (`Build Figma design foundation and harden authentication flows`). The subsequent signin milestone is not included in that commit and remains available for review. Unrelated landing-page, dashboard/navigation, and backend CORS changes were left outside the checkpoint.

## Verification

Current therapist UI batch: all 41 development browser tests pass with mocked APIs, including three new cross-child session-table tests. Table origin, column width, header/row height, expanded modal width, search/sort/retry, role denial, Escape/focus restoration, asset loading, and 320/390px overflow checks pass. Desktop and phone screenshots were inspected. A subsequent focused rerun passes all three therapist checks with explicit console/page-error assertions after removing invalid whitespace text nodes from the table markup; native websocket transport is also intercepted in these tests. The production TypeScript/build check includes the new `/sessions` route (41 static pages).

The session API now selects child birth date, profile image, and deterministic linked-parent names without exposing account credentials or unrelated child details. Existing therapist/parent ownership predicates are unchanged. All 27 isolated backend checks pass, including eight new session ownership/projection/failure cases. This addition requires no schema migration; the earlier contact migration remains a separate deployment prerequisite.

Previous authentication/contact batch: all 38 development and 33 production browser tests passed with mocked APIs. All 19 isolated backend contract tests passed without loading the live database/mail setup. Frontend lint and production build passed (40 static pages); Prisma Client generation succeeded. No migration or real delivery-provider request was run. Source defaults and responsive screenshots were inspected; individual loading/error/success-frame visual sign-off is still pending.

- `PORT=3100 npx playwright test --workers=2`: 29 passing tests with mocked APIs against the development server.
- Production signin/auth suite at port 3102: all 14 tests in `login-visual.spec.ts`, `auth-handoff.spec.ts`, and `auth-visual.spec.ts` pass against `next start` with mocked APIs. The prior checkpoint also passed all 13 tests in its OTP/auth suite.
- `npm run lint`: passes when run separately. One concurrent run exhausted host memory; the standalone rerun completed successfully.
- `npm run build`: passes, including production TypeScript checks and static page generation.
- Production smoke checks: login, parent/therapist/admin registration, forgotten-password, reset-password, and verification URLs return 200; `/design-system` returns 404.
- Component, OTP, and signin screenshots reviewed at desktop and narrow mobile widths; tests also capture 390px views. OTP and signin assertions match the source's 1440x1024 geometry and locally served image assets. The mobile error capture waits for its warning icon to decode.
- Production signin URLs, including parent/therapist/admin queries, return 200; `/design-system` still returns 404.
- `git diff --check`: passes for the current working diff. Extra trailing blank lines found when staging the checkpoint were removed in this follow-up. Existing unrelated work remains intact; no deployment was performed.

## Remaining

- Complete administrator signin's special-code contract with the backend before adding that Figma field. Current administrator signin remains functional through the existing email/phone and password contract.
- Complete administrator registration and individual authentication/contact success, error, and loading frame comparisons. Parent/therapist signup, forgotten-password, and create-password defaults now have measured browser assertions; the reset transport step and supplementary navigation are documented adaptations.
- Audit remaining typography, spacing, checkbox/radio/toggle, notification, dialog, table, and navigation families.
- Finish the landing page against its full Figma frame and assets, then parent, therapist, and administrator screen-by-screen implementation.
- Continue infrastructure and backend folder migration with regression coverage.
- Verify real backend authorization, email/SMS delivery, deployment configuration, and staging workflows. Browser API mocks and a passing frontend build do not establish hosting readiness.
- Apply `20260930000000_contact_inquiries` to the intended database through the reviewed release process before enabling contact requests. The local Prisma Client has been generated; the database has not been migrated.

The authentication handoff contract and its server-model limitations are recorded in `architecture/authentication-handoffs.md`. Full-screen visual parity is not yet signed off.
