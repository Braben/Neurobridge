# Neurobridge — Progress Tracker

> **Last Updated:** 2026-07-10  
> **Current Phase:** Phase 3 (Business Features) — Hydration Fix ✅

---

## Implemented Features

### 1. User Registration

|                 |                                                                                                                                                                                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer**       | Backend                                                                                                                                                                                                                                                                                                                     |
| **Endpoint**    | `POST /api/v1/auth/register`                                                                                                                                                                                                                                                                                                |
| **Description** | Creates a new user account with role-based validation. Accepts firstName, lastName, email, phone, password, role (PARENT/THERAPIST), optional avatar and areaofexpertise. Passwords hashed with bcrypt. Parents auto-approved; Therapists require admin approval. Returns JWT access token + httpOnly refresh token cookie. |
| **Validation**  | Zod schema validates all fields — email format, password length (min 6), role enum, conditional areaofexpertise for THERAPIST. Returns 400 with combined error messages on failure.                                                                                                                                         |
| **User Flow**   | Parent/Therapist fills register form → submits → validated → user created → tokens issued → redirected to dashboard.                                                                                                                                                                                                        |

### 2. Login (Email or Phone)

|                 |                                                                                                                                                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer**       | Backend                                                                                                                                                                                                                                                                          |
| **Endpoint**    | `POST /api/v1/auth/login`                                                                                                                                                                                                                                                        |
| **Description** | Authenticates a user by either email OR phone. Accepts `{ email }` or `{ phone }` with password. Queries the User model by whichever identifier is provided. Validates password with bcrypt.compare. Returns JWT access token (15m expiry) + httpOnly refresh token cookie (7d). |
| **Validation**  | Zod schema requires at least one of email/phone + password. Returns 400 if neither identifier given. Returns 401 on wrong credentials (user not found, deleted, or password mismatch).                                                                                           |
| **User Flow**   | User enters email/phone + password → Zod validates → server looks up user → compares password → tokens generated → cookie set → redirected to role-based dashboard.                                                                                                              |

### 3. Logout

|                 |                                                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer**       | Backend                                                                                                                                                                                  |
| **Endpoint**    | `POST /api/v1/auth/logout`                                                                                                                                                               |
| **Description** | Reads the refreshToken from cookies, nullifies it in the database (via `updateMany`), and clears the cookie. Works even if the token is already expired or invalid — always returns 200. |
| **User Flow**   | User clicks logout → cookie read → DB token cleared → cookie cleared → redirected to login page.                                                                                         |

### 4. Token Refresh

|                 |                                                                                                                                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer**       | Backend                                                                                                                                                                                                                                                                                 |
| **Endpoint**    | `POST /api/v1/auth/refresh`                                                                                                                                                                                                                                                             |
| **Description** | Reads the refreshToken from cookies, verifies the JWT signature, checks it matches the stored hash in the database. Issues a new access + refresh token pair (rotation). Old refresh token is replaced in the DB. Returns 401 if token is missing, expired, or doesn't match DB record. |
| **User Flow**   | Frontend interceptor detects expired access token → calls `/refresh` with cookie → new tokens issued → original request retried.                                                                                                                                                        |

### 5. JWT Authentication Middleware

|                 |                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Layer**       | Backend                                                                                                                                                                                                                                                                                                                                                      |
| **File**        | `src/middleware/auth.js`                                                                                                                                                                                                                                                                                                                                     |
| **Description** | Two middleware functions: (a) `verifyToken` — extracts Bearer token from Authorization header, verifies with `JWT_SECRET`, confirms the user still exists and isn't soft-deleted, attaches `req.user`. Returns 401 on missing/expired/invalid token. (b) `authorize(...roles)` — checks `req.user.role` against allowed roles, returns 403 if not permitted. |
| **User Flow**   | Protected routes use `verifyToken` first → `authorize("THERAPIST")` second → controller runs. Unauthenticated requests get 401; unauthorized roles get 403.                                                                                                                                                                                                  |

### 6. Zod Input Validation

|                 |                                                                                                                                                                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer**       | Backend                                                                                                                                                                                                                                                                                                                                                 |
| **File**        | `src/validators/auth.validator.js`                                                                                                                                                                                                                                                                                                                      |
| **Description** | Reusable validation middleware generator. Schemas defined for: register (name, email, phone, password, role, avatar, expertise), login (email OR phone + password), send OTP (email), verify OTP (email + 6-digit code). Uses Zod `safeParse` and returns 400 with combined error messages on failure. Replaces `req.body` with parsed data on success. |
| **User Flow**   | Request hits route → `validate(schema)` runs → if invalid: 400 returned immediately → if valid: `req.body` sanitised, next middleware/controller runs.                                                                                                                                                                                                  |

### 7. Helmet Security Headers

|                 |                                                                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer**       | Backend                                                                                                                                                                                                                                                    |
| **File**        | `app.js`                                                                                                                                                                                                                                                   |
| **Description** | Added `helmet()` to the Express middleware stack. Sets security-related HTTP headers: X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, Content-Security-Policy, and others. First middleware in the stack so all responses are covered. |
| **User Flow**   | Every HTTP response includes security headers automatically — no user-facing change.                                                                                                                                                                       |

### 8. Email OTP Verification

|                 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer**       | Backend                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Endpoints**   | `POST /api/v1/auth/send-otp`, `POST /api/v1/auth/verify-otp`, `POST /api/v1/auth/resend-otp`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Description** | Complete OTP flow: (a) **send-otp** — generates a cryptographically secure 6-digit code (via `crypto.randomInt`), stores in `OtpCode` table with 10-minute expiry, sends via Nodemailer. Invalidates any previous unused codes for the same email. (b) **verify-otp** — looks up the code by email + code + type + not expired + not used, marks as consumed. Returns 400 if invalid/expired. (c) **resend-otp** — invalidates old codes, generates fresh code, re-emails. Dev mode logs to console instead of sending real email when SMTP not configured. |
| **User Flow**   | User submits email → OTP sent → user checks inbox → enters 6-digit code → verified → account activated (to be wired in Week 2).                                                                                                                                                                                                                                                                                                                                                                                                                             |

---

## Feature Roadmap

| Phase | Features                                                                                                                        | Est. Weeks | Status     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 0     | Profile management, rate limiting, CORS lockdown, JWT secrets, test framework, register+OTP integration                         | Week 2     | ✅ Complete |
| 1     | Child CRUD, parent/therapist dashboards, session notes, intake forms, goal tracking, behaviour tracking, admin panel, messaging | Week 3–7   | ✅ Complete |
| 2     | Progress charts, file uploads, notifications, resource library, therapist profiles                                              | Week 8–10  | ✅ Complete |
| 3     | Booking system, payments (Paystack), subscriptions, reports generator                                                           | Week 11–13 | 🟡 In Progress |
| 4     | School dashboard, AI features, teletherapy, multi-language, mobile app                                                          | Week 14–18 | 🔴 Pending |

---

## Changelog

| Date       | Feature                            | Description                                                                                       |
| ---------- | ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| 2026-07-04 | User Registration                  | Backend register endpoint with Zod validation, bcrypt hashing, role-based rules, JWT token pair   |
| 2026-07-04 | Login (Email or Phone)             | Backend login endpoint accepting email or phone + password, token generation, cookie set          |
| 2026-07-04 | Logout                             | Backend logout — clears refresh token from DB and httpOnly cookie                                 |
| 2026-07-04 | Token Refresh                      | Backend refresh endpoint with token rotation and DB-level verification                            |
| 2026-07-04 | JWT Auth Middleware                | verifyToken (Bearer extraction, JWT verify, user existence check) + authorize (role guard)        |
| 2026-07-04 | Zod Input Validation               | Reusable validate() middleware with schemas for register, login, OTP flows                        |
| 2026-07-04 | Helmet Security                    | Security HTTP headers enabled in app.js                                                           |
| 2026-07-04 | Email OTP Verification             | Full send/verify/resend OTP flow with crypto-secure codes, 10-min expiry, Nodemailer              |
| 2026-07-04 | User Profile (GET/PATCH /users/me) | Backend profile retrieval and update (firstName, lastName, phone, avatar) with JWT auth           |
| 2026-07-04 | Rate Limiting                      | Global 100 req/15min rate limiter with express-rate-limit                                         |
| 2026-07-04 | CORS Restriction                   | CORS whitelisted to FRONTEND_URL (defaults to localhost:3000)                                     |
| 2026-07-04 | JWT Secrets Rotation               | Placeholder secrets replaced with strong production keys in .env                                  |
| 2026-07-04 | Admin Seed Script                  | `node prisma/seed.js` creates admin@neurobridge.com with default password                         |
| 2026-07-04 | Test Suite (Vitest)                | 11 integration tests covering register, login (email+phone), refresh, profile, logout, validation |
| 2026-07-04 | OTP + Registration Integration     | Register now sends OTP; user must verify email before account is approved                         |
| 2026-07-04 | Frontend: Redux Store + Auth Slice | Store configured with auth slice (register, login, logout, OTP thunks)                            |
| 2026-07-04 | Frontend: Axios Instance           | API client with JWT interceptor + auto token refresh on 401                                       |
| 2026-07-04 | Frontend: Login Page               | Email/phone login form with validation, error display, role-based redirect                        |
| 2026-07-04 | Frontend: Register Page            | Multi-step registration form with conditional therapist fields, client-side validation            |
| 2026-07-04 | Frontend: OTP Verification Page    | 6-digit code input with auto-advance, resend with countdown timer                                 |
| 2026-07-04 | Frontend: Dashboard Shell          | Basic role-aware dashboard with approval status banner                                            |

## Changelog (continued)

| Date       | Feature                                      | Description                                                                                   |
| ---------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 2026-07-05 | Child CRUD Backend (Role-aware)              | Updated `listChildren`/`getChild` to support PARENT, THERAPIST, ADMIN roles                   |
| 2026-07-05 | Therapist Assignment Endpoint                | `POST /children/:id/assign` (admin only) with validation                                     |
| 2026-07-05 | Frontend: Children API Service               | Full CRUD service layer for children with TypeScript types                                    |
| 2026-07-05 | Frontend: Child Redux Slice                  | Async thunks + reducer for children CRUD state management                                     |
| 2026-07-05 | Frontend: Children List Page                 | `/children` — grid view with View/Edit/Delete, role-aware (parent vs therapist)               |
| 2026-07-05 | Frontend: Add Child Page                     | `/children/add` — form with validation                                                        |
| 2026-07-05 | Frontend: Child Detail Page                  | `/children/[id]` — profile, parents, therapists, goals, sessions, behaviours sections         |
| 2026-07-05 | Frontend: Edit Child Page                    | `/children/[id]/edit` — pre-filled form                                                       |
| 2026-07-05 | Frontend: Dashboard Widgets                  | Quick stats (child count), My Children list widget, role-aware navigation                     |
| 2026-07-05 | Backend: Session Notes CRUD                  | Session create/update/delete with upsertable session notes                                    |
| 2026-07-05 | Backend: Intake Forms                        | Get/upsert intake form per child                                                              |
| 2026-07-05 | Backend: Goal Tracking CRUD                  | Create/update/delete goals per child with status enum                                         |
| 2026-07-05 | Backend: Behaviour + Behaviour Log CRUD      | Behaviours with name/description, logs with frequency + date tracking                         |
| 2026-07-05 | Backend: Admin Panel                         | List users (with filters), approve therapists, platform stats                                 |
| 2026-07-05 | Backend: Messaging API                       | Conversations (create/list), messages (send/list) with participant verification               |
| 2026-07-05 | Frontend: Sessions Pages                     | `/children/[id]/sessions` list with notes, `/sessions/new` with combined session+notes form   |
| 2026-07-05 | Frontend: Intake Form Page                   | `/children/[id]/intake` — form with auto-load existing data                                   |
| 2026-07-05 | Frontend: Admin Panel Page                   | `/admin` — stats cards, users table with role filter, approve therapists                      |
| 2026-07-05 | Frontend: Messaging Pages                    | `/messages` conversation list, `/messages/[id]` chat UI with send                             |
| 2026-07-05 | Frontend: Child Detail Nav                   | Tab navigation to Sessions, Intake, Goals, Behaviours                                         |
| 2026-07-05 | Frontend: Dashboard Nav Update               | Links to Children, Messages, Admin (role-aware)                                               |

## Changelog (continued)

| Date       | Feature                                      | Description                                                                                   |
| ---------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 2026-07-05 | Real-time Socket.io Backend                  | Socket.io server with JWT auth middleware, `emitToUser`/`emitToUsers` helpers, user room joining |
| 2026-07-05 | Real-time Message Delivery                   | `message:new` + `conversation:new` socket events emitted to conversation participants         |
| 2026-07-05 | Real-time Session Updates                    | `session:created` + `session:updated` socket events; parents notified on session log/update   |
| 2026-07-05 | Real-time Therapist Assignment               | `assignment:new` socket event + notifications to parents and therapist                        |
| 2026-07-05 | Notification Service                         | `createNotification` persists + emits real-time; helpers for participants/parents/therapists   |
| 2026-07-05 | Notification API                             | `GET /notifications`, `GET /unread-count`, `PATCH /:id/read`, `PATCH /read-all`               |
| 2026-07-05 | SocketManager Component                      | Global socket listener → Redux dispatch + toast for notifications and messages                 |
| 2026-07-05 | Notification Redux Slice                     | In-memory list + unread count for Navbar badge                                                |
| 2026-07-05 | Message Redux Slice                          | Live message buffer per conversation (capped at 100)                                          |
| 2026-07-05 | Notification Bell Dropdown                   | Navbar bell icon with unread badge, dropdown with 10 recent notifications, "Mark all read"    |
| 2026-07-05 | Notifications Page                           | `/notifications` — full list with single/mark-all read, unread indicators                     |
| 2026-07-05 | Navbar Refactor                              | Extracted to `components/Navbar.tsx` with role-aware links, mobile menu, hydration-safe       |
| 2026-07-05 | Comprehensive E2E Tests                      | 8 notification integration tests covering API + real-time socket events                       |
| 2026-07-05 | Database Seed Overhaul                       | Full seed script: 3 parents, 3 therapists, 4 children, intake forms, goals, behaviours, sessions, conversations, notifications |
| 2026-07-05 | Prisma: Resource + FileAttachment Models     | Added Resource and FileAttachment models with relations to User, Child, Session; ResourceType enum |
| 2026-07-05 | Backend: Resource CRUD                       | Full CRUD endpoints for resources with type/search filtering, role-based access                 |
| 2026-07-05 | Backend: File Upload (Cloudinary)            | Cloudinary + multer config, upload/delete files, list by childId/sessionId                      |
| 2026-07-05 | Backend: Progress Aggregation                | Sessions, goals, behaviour trends, summary stats per child                                      |
| 2026-07-05 | Backend: Therapist Public Profile            | Public profile endpoint with expertise, avatar, child/session counts                            |
| 2026-07-05 | Frontend: Progress Charts Page               | `/progress/[childId]` — Recharts bar/pie/line charts for session duration, goal status, trends  |
| 2026-07-05 | Frontend: Resource Library Page              | `/resources` — grid view with search, type filter, external resource links                      |
| 2026-07-05 | Frontend: Therapist Profile Page             | `/therapists/[id]` — avatar, expertise badge, stats cards, contact info                         |
| 2026-07-05 | Frontend: Child Detail Tabs + File Upload    | Added Progress/Files tabs to child detail page; upload/delete UI with attachment list           |
| 2026-07-05 | Frontend: Navbar Phase 2 Links               | Added Resources and Therapists links to Navbar (desktop + mobile)                               |
| 2026-07-10 | Phase 2 E2E Verification                     | Verified all 5 Phase 2 features end-to-end: 19/19 tests pass, DB tables intact, frontend pages render |
| 2026-07-10 | Booking System: AvailabilitySlot + Booking models | Added Prisma models, migration, backend CRUD for therapist availability slots and parent bookings |
| 2026-07-10 | Booking System: Real-time notifications         | Booking create/confirm/cancel triggers notifications via Socket.io to therapist and parent |
| 2026-07-10 | Frontend: Availability + Booking API services    | TypeScript API service layer for availability slot and booking CRUD operations               |
| 2026-07-10 | Frontend: Therapist Availability Page            | `/availability` — therapists manage recurring weekly slots with add/remove UI                |
| 2026-07-10 | Frontend: Booking List Page                      | `/bookings` — role-aware list with confirm/cancel/complete actions                           |
| 2026-07-10 | Frontend: New Booking Wizard                     | `/bookings/new` — 4-step wizard: pick therapist → pick slot → pick child → confirm           |
| 2026-07-10 | Frontend: Navbar Booking Links                   | Added role-aware Bookings link (parent) and Bookings + Availability links (therapist)         |
| 2026-07-10 | Hydration Fix: Booking Pages                     | Fixed hydration mismatch in 3 pages: changed `if (loading) return <spinner>` → `if (!user) return null` |

> Phase 3 — Booking System complete (backend + frontend + hydration fix). Next: Phase 3 — Payments (Paystack integration).
