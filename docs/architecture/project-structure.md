# Project Structure And Migration

## Current Milestone

The initial migration establishes canonical shared controls in `frontend/src/components/ui`, design values in `frontend/src/styles/tokens.css`, and a local review feature in `frontend/src/features/design-system`. Existing URLs and application behavior remain the compatibility boundary.

The two old `src/app/components/ui` entry points re-export the canonical button and field implementations. They are temporary compatibility exports, not independent versions. New code imports from `@/components/ui`. Remove each compatibility export only after all of its callers have migrated.

## Target Frontend Ownership

Authentication screens now live in `src/features/auth`, with the authentication shell in `src/components/layouts/AuthFrame.tsx`. Login, registration, verification, forgotten-password, and reset-password URLs retain thin route entry points. Existing Redux, HTTP, and validation imports still point to `src/app` infrastructure until that layer has separate migration coverage; no duplicate stores or transports were introduced.

| Directory | Responsibility | Dependency direction |
| --- | --- | --- |
| `src/app` | Thin route entry points, layouts, metadata, error/loading boundaries | Composes features and layouts |
| `src/components/ui` | Reusable design-system primitives; no role, Redux, or API knowledge | React, Next primitives, shared styles |
| `src/components/layouts` | Public, authentication, parent, therapist, administrator page shells | UI and session/navigation contracts |
| `src/features/<feature>` | Screens, feature-specific components, API functions, schemas, types | Shared UI and infrastructure |
| `src/features/dashboards/{parent,therapist,admin}` | Distinct role dashboard compositions | Shared domain features and UI |
| `src/lib/api` | Shared HTTP transport, error normalization, authentication transport | Runtime configuration |
| `src/lib/realtime` | Socket lifecycle and transport | Session contracts and feature events |
| `src/store` | Store composition and genuinely shared client state | Feature reducers |
| `src/styles` | Verified tokens and global foundations | No feature imports |
| `public/design-assets` | Permanent exports with source records | Referenced by UI and features |
| `e2e` | User journeys and browser-level component checks | Public routes and controlled API fixtures |

Each feature should own files such as `api.ts`, `types.ts`, `schemas.ts`, and `components/` when needed. Do not create empty layers or duplicate server data across unrelated stores. Keep native form behavior and the existing Redux/HTTP stack during the design migration.

## Route Migration

- Preserve existing URLs before considering any URL redesign. Route-group names do not add URL prefixes.
- Split the misleading `(admin)` grouping into workspace and administration ownership only after the corresponding layouts have regression coverage.
- Parents and therapists currently share `/dashboard`; keep a small role dispatcher there and move each actual screen into its feature.
- Record Figma modals separately from routes. Preserve direct links when a workflow gains modal navigation, and test closing, back navigation, and reload behavior.
- The development-only `/design-system` route has a server-side not-found guard and a narrowly matched `src/proxy.ts` rule returning HTTP 404 in production before streaming starts. Its authentication-chrome exception uses the same development predicate.
- UI route checks are not authorization. Backend handlers must continue enforcing roles and record ownership.

## Backend Migration

Keep Express and Prisma. Move route definitions and validation into the existing feature modules one module at a time. Thin controllers should delegate meaningful business rules to services; extract repositories only when query reuse or complexity warrants them. Keep email, SMS, payment, and upload adapters under `integrations/` when those modules move.

This milestone does not claim that the backend module migration or deployment audit is complete. Existing changes in `backend/src/config/cors.js` are retained.

## Delivery Order

1. Screen inventory and verified control foundation (this milestone).
2. Remaining design-system families: password/OTP, checks/toggles, notifications, dialogs, tables, and navigation. Audit the full typography/spacing variable sets.
3. Move auth feature screens and the auth layout; verify all recovery, OTP, and approval paths against their Figma states.
4. Rebuild the public page using exact exported assets and functional contact submission.
5. Parent workflows, then therapist workflows, then administration workflows.
6. Complete route-group and backend-module migration as each feature becomes verified.
7. Responsive and screenshot comparison, role/ownership tests, and staging deployment verification.

## Completion Evidence

A Figma screen needs its source ID, reference dimensions, state fixtures, working actions, error/empty/loading behavior, and a screenshot comparison before being marked visually verified. Lint/build success and a screenshot generated from the implementation are useful checks, but neither alone establishes pixel equality with Figma. Keep geometry differences and missing mobile references explicit in the design inventory.
