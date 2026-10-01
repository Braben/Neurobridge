# Backend Route Map

Reviewed 2026-09-30. All paths below are relative to `/api/v1`. The browser Axios client reads `NEXT_PUBLIC_API_URL`, which must include that prefix. Existing services were checked against mounted Express routes and response envelopes; this is a source audit, not a claim that every workflow has been exercised against a deployed database.

## Public Contact Contract

`POST /contact` accepts `{ fullName, email, phone?, subject?, message }` without authentication.

- `fullName`: trimmed, 1-100 characters.
- `email`: trimmed, lowercased, valid email, maximum 254 characters.
- `phone`: optional string, maximum 30 characters; empty is stored as null.
- `subject`: optional string, maximum 200 characters; empty is stored as null.
- `message`: trimmed, 1-2000 characters.
- Unknown fields are stripped. A client cannot supply status, timestamps, or an account identity.
- Success: HTTP 201, `{ message: "Your message has been received.", inquiry: { id, createdAt } }`.
- Invalid input: HTTP 400 with `{ message }`. Rate limit: HTTP 429 with `{ message }` and `Retry-After`.
- The contact-specific allowance is five requests per IP per fifteen minutes, including successes and invalid submissions. The app-wide limit also applies.
- Storage failure follows the existing sanitized HTTP 500 error handler. Success is never returned before the insert completes.
- Receipt means saved for review, not an email sent. Contact persistence does not depend on the email provider.

The `ContactInquiry` model has no automatic link to a registered user: a public email/name is an unverified assertion, not authorization or verified platform role.

## Admin Inquiry Contract

Both endpoints are mounted after the existing JWT and `ADMIN` guards in `admin.route.js`.

| Method and path | Input | Success |
| --- | --- | --- |
| `GET /admin/inquiries` | Optional `status=NEW\|IN_PROGRESS\|RESOLVED`, `page` default 1, `limit` default 25/max 100 | `{ inquiries, pagination: { page, limit, total } }` |
| `PATCH /admin/inquiries/:id/status` | UUID path; body `{ status: "NEW"\|"IN_PROGRESS"\|"RESOLVED" }` | `{ message, inquiry }` |

Records contain `id`, `fullName`, `email`, nullable `phone`/`subject`, `message`, `status`, `createdAt`, and `updatedAt`. Status changes use the existing write limiter. Invalid filters/body/IDs return 400; nonexistent update targets return 404. Listing returns newest-first bounded pages, with ID as a stable tie-breaker.

The frontend `/admin/complaints` route now has separate Contact inquiries and Platform conversations views. The inquiry view consumes the new endpoints, with server-side status filtering, bounded pagination, complete-message expansion, and persisted status changes. It does not assign anonymous senders a verified platform role or widen access to private conversations. Email addresses open the administrator's email client; no automatic reply-email endpoint or inquiry deletion/retention policy has been added.

## Existing Service Mapping

| Frontend owner | Mounted backend paths | Response / access notes |
| --- | --- | --- |
| Auth slice | `POST /auth/register`, `/login`, `/logout`, `/send-otp`, `/resend-otp`, `/verify-otp` | Existing registration/login token + user contracts retained; OTP remains six digits. |
| Auth client interceptor | `POST /auth/refresh` | Rotated access token; refresh cookie required. |
| Forgot/reset pages | `POST /auth/request-password-reset`, `/auth/reset-password` | Request accepts `{ identifier }`; reset accepts identifier/contact, code and password. |
| Auth profile hydration / settings | `GET/PATCH /users/me` | Authenticated current-user profile. |
| `children.ts` | `GET/POST /children`, `GET/PATCH/DELETE /children/:id`, `POST /children/:id/assign` | `{ children }` / `{ child }`; assignment remains admin-only. |
| `intake.ts` | `GET/PUT /intake/:childId` | `{ intake }`; child ownership/assignment checked in controller. |
| `sessions.ts` | `GET/POST /sessions`, `GET/PATCH/DELETE /sessions/:id`, `PUT /sessions/:id/notes` | `{ sessions }`, `{ session }`, `{ note }`; clinical writes restricted to therapist/admin. |
| `availability.ts` | `GET/POST /availability`, `GET/PUT/DELETE /availability/:id` | `{ slots }` / `{ slot }`; token required. |
| `bookings.ts` | `GET/POST /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/status` | `{ bookings }` / `{ booking }`; token required. |
| `messages.ts` | `GET/POST /messages/conversations`, `GET/POST /messages/conversations/:id/messages` | `{ conversations }`, `{ conversation }`, `{ messages }`, send response `{ msg }`; participant-scoped. |
| `notifications.ts` | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | `{ notifications, unreadCount }` / `{ unreadCount }`; user-scoped. |
| `resources.ts` | `GET/POST /resources`, `GET/PUT/DELETE /resources/:id` | `{ resources }` / `{ resource }`; authenticated reads and role-restricted writes. |
| `upload.ts` | `POST/GET /upload`, `DELETE /upload/:id` | Multipart `file` upload; `{ attachment }` / `{ attachments }`; Cloudinary required. |
| `progress.ts` | `GET /progress/:childId` | `{ child, summary, sessions, goals, behaviourTrends }`; child access checked. |
| `reports.ts` | `GET /reports/:childId` | PDF/blob, not JSON; token required. Its separate fetch client does not implement Axios refresh/retry. |
| `therapists.ts` | `GET /therapists`, `GET /therapists/:id` | Public directory `{ therapists }` / `{ therapist }`. |
| `payments.ts` | `POST /payments/initialize`, `GET /payments/verify/:reference`, `/transactions`, `/session-fee`, `/revenue` | Provider redirect `{ authorizationUrl, reference }`; fees in pesewas; revenue controller requires admin. |
| `subscriptions.ts` | `GET /subscriptions/plans`, `POST /subscriptions/subscribe`, `GET /subscriptions/my` | Public plans; authenticated purchase/current subscription; external payment provider required. |
| `admin.ts` + dashboard | `GET /admin/overview`, `/users`, `/parents`, `/therapists`, `/children`, `/sessions`, `/stats` | Admin-only envelopes match current service declarations. Directory projections now exclude credentials. |
| `admin.ts` actions | `PATCH /admin/users/:id/approve`, `PATCH/DELETE /admin/users/:id`, `POST /admin/admin-invites`, `GET/PATCH /admin/settings/session-fee`, `PATCH /admin/bookings/:id/reschedule` | Existing role guards and service paths retained. |

No missing mounted path was found among the existing service calls inspected. Public contact was a concrete missing capability, now implemented. Goals and behaviour CRUD routers exist on the backend, but this audit found no corresponding direct calls in the current frontend services/pages; screen integration is a separate task, not evidence those workflows are complete.

## Authentication Changes

- Password-reset requests now return the same `{ message, resetChannel, resetIdentifier }` for active, missing, and deleted accounts. Metadata reflects the submitted normalized target, not whether an account exists.
- Reset and verification consumption now use conditional `updateMany` inside an interactive transaction, checking `isUsed: false` and expiry at write time. Only one request can win a claim; password/approval changes share its rollback boundary.
- Reset clears the stored refresh token. Existing access tokens still expire on their existing fifteen-minute schedule; immediate access-token revocation was not introduced.
- Both auth code validators require six decimal digits, rather than any six characters.
- Delivery and code endpoints share a twenty-request/IP/fifteen-minute recovery limit, including successful requests. This closes the previous unlimited-success resend gap in the general auth limiter.
- Therapist contact verification still does not grant administrator approval. No separate persisted contact-verification field was introduced.
- Admin login code semantics remain pending a product/security decision. This change does not add a fake code field or reuse the registration invite code for login.

These are targeted fixes, not a complete authentication security audit. Response-shape enumeration is covered; database/provider-dependent response timing is not equalized. Codes remain in the existing plaintext OTP schema. Per-account throttling, a durable delivery queue, OTP hashing, and immediate session revocation need a separate security design. Rate-limit storage remains process-local, so multiple API replicas need a shared limiter store. Verify the deployment's proxy/IP configuration before relying on per-client limits; this change does not blindly trust forwarded headers.

## Validation and Deployment

The therapist `/sessions` frontend now uses the existing scoped `GET /sessions` contract for its cross-child table. The shared safe session projection includes `child.dateOfBirth`, `child.profileImage`, and `child.parents[].parent.{id,firstName,lastName}`. Linked parents are ordered by `parentId` for stable rendering. No unrestricted user relation, credentials, contacts, or unrelated medical details were added. Existing therapist ownership and linked-parent predicates are unchanged for list/detail. This projection-only addition needs no migration.

Run both isolated suites with `node --test tests/isolated/backend-contracts.check.cjs tests/isolated/session-contracts.check.cjs`. All 27 checks pass: the eight session cases cover the three role-specific list/detail predicates, explicit safe projection, and persistence failure forwarding. These assert production controller queries against mocks, not real database enforcement or deployed authentication.

From `backend`, run `node --test tests/isolated/backend-contracts.check.cjs`. The `.check.cjs` suffix keeps the file out of Vitest's integration-test discovery. It installs Prisma/mail/SMS test doubles before loading production controllers and mounts only isolated routers on a temporary loopback port. It does not load `.env`, the real app, or the existing live integration setup.

Verified: 19 isolated tests, including public validation/rate limits, admin access controls/status updates, persistence failures, safe directory serialization, reset metadata parity, transactional failure handling and parallel code-consumption simulations. `node node_modules/prisma/build/index.js validate` also passed. Mocked transaction tests verify controller behavior, not actual PostgreSQL lock scheduling; database concurrency should be checked in staging.

Deployment requires generating Prisma Client and applying `20260930000000_contact_inquiries` to the intended database before serving the new endpoints. Use the existing `npm run prisma:generate` and `npm run prisma:migrate:deploy` commands in the reviewed release process. No migration was run and no database was modified during this work. The migration only adds the inquiry enum, table and indexes; it does not rewrite existing account data.

Frontend contact submission, landing submission, recovery routing, and the admin inquiry lifecycle are connected and covered by mocked browser tests. The contact lifecycle must still be exercised against an isolated staging database after migration. Email/SMS delivery, Cloudinary, payment callbacks, cross-origin cookies and deployed proxy behavior were not exercised here. Existing dirty `backend/src/config/cors.js` was left unchanged. No commit was created.
