# Neurobridge — Progress Tracker

> **Last Updated:** 2026-07-04  
> **Current Phase:** Phase 0 (Foundation) — Week 2 complete

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

## Feature Roadmap (Not Yet Started)

| Phase | Features                                                                                                                        | Est. Weeks | Status     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- |
| 0     | Profile management, rate limiting, CORS lockdown, JWT secrets, test framework, register+OTP integration                         | Week 2     | 🔴 Pending |
| 1     | Parent/therapist dashboards, child CRUD, session notes, intake forms, goal tracking, behaviour tracking, admin panel, messaging | Week 3–7   | 🔴 Pending |
| 2     | Progress charts, file uploads, notifications, resource library, therapist profiles                                              | Week 8–10  | 🔴 Pending |
| 3     | Booking system, payments (Paystack), subscriptions, reports generator                                                           | Week 11–13 | 🔴 Pending |
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

> Continue Neurobridge. Phase 0 complete. Ready to start Phase 1 MVP Launch (Week 3 — Child CRUD and Parent Dashboard).
