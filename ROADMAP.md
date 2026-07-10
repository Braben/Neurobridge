# Neurobridge — Project Roadmap

> **Target:** Full-stack digital therapy platform for children with special needs  
> **Stack:** Express.js / Prisma / PostgreSQL (Neon) — Next.js / Redux Toolkit / Tailwind CSS  
> **PRD Source:** `neurobridge2.pdf` | **Current Progress:** Phase 0–2 complete → Phase 3

---

## PHASE 0: FOUNDATION (Week 1–2)

Goal: Hardened backend basics — auth, middleware, security, project tooling.

### Week 1 — Auth & Middleware

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 0.1 | Login endpoint — email OR phone (`POST /api/v1/auth/login`) | ✅ | ❌ | Phase 0 |
| 0.2 | Logout endpoint (`POST /api/v1/auth/logout`) | ✅ | ❌ | Phase 0 |
| 0.3 | Token refresh endpoint (`POST /api/v1/auth/refresh`) | ✅ | ❌ | Phase 0 |
| 0.4 | JWT verification middleware (`src/middleware/auth.js`) | ✅ | ❌ | Phase 0 |
| 0.5 | Role-based access middleware (`authorize(ADMIN, THERAPIST, PARENT)`) | ✅ | ❌ | Phase 0 |
| 0.6 | Zod validation schemas for all inputs | ✅ | ❌ | — |
| 0.7 | Enable Helmet in `app.js` | ✅ | ❌ | — |
| 0.8 | Apply Zod validation to register endpoint | ✅ | ❌ | — |
| 0.9 | OTP model + Prisma migration (`OtpCode` table) | ✅ | ❌ | — |
| 0.10 | Email service module (Nodemailer / SendGrid / Resend) | ✅ | ❌ | — |
| 0.11 | Send OTP endpoint (`POST /api/v1/auth/send-otp`) — email verification on register | ✅ | ❌ | — |
| 0.12 | Verify OTP endpoint (`POST /api/v1/auth/verify-otp`) — activates account | ✅ | ❌ | — |
| 0.13 | Resend OTP endpoint (`POST /api/v1/auth/resend-otp`) — rate-limited | ✅ | ❌ | — |

### Week 2 — Profile, Admin Setup & Security

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 0.14 | Profile get/update endpoints (`/api/v1/users/me`) | ✅ | ❌ | Phase 0 |
| 0.15 | Admin seed script (first admin user) | ✅ | ❌ | Phase 0 |
| 0.16 | Rate limiting (`express-rate-limit`) | ✅ | ❌ | — |
| 0.17 | CORS restrict to frontend origin | ✅ | ❌ | — |
| 0.18 | Replace placeholder JWT secrets in `.env` | ✅ | ❌ | — |
| 0.19 | Setup test framework (Jest/Vitest) + first auth tests | ✅ | ❌ | — |
| 0.20 | Update register flow: send OTP on registration, verify before activation | ✅ | ❌ | — |
| 0.21 | Frontend project init — auth pages (login/register) | ❌ | ✅ | Phase 0 |
| 0.22 | Frontend Redux store — auth slice wired up | ❌ | ✅ | Phase 0 |
| 0.23 | Frontend Axios instance with interceptors (JWT attach + refresh) | ❌ | ✅ | Phase 0 |
| 0.24 | Frontend OTP verification page (enter code, resend) | ❌ | ✅ | Phase 0 |

**Milestone:** Secure auth flow end-to-end — register → email OTP verification → login (email or phone) → token refresh → logout.

---

## PHASE 1: MVP LAUNCH (Week 3–7)

Goal: Core clinical workflows — parents, therapists, sessions, behaviour tracking, messaging.

### Week 3 — Parent Dashboard + Child CRUD

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 1.1 | Child CRUD endpoints (`/api/v1/children`) | ✅ | ❌ | Phase 1.1 |
| 1.2 | Child ↔ Parent linking (auto-link on create) | ✅ | ❌ | Phase 1.1 |
| 1.3 | `GET /api/v1/parents/children` — list parent's children | ✅ | ❌ | Phase 1.1 |
| 1.4 | Parent Dashboard page (child list, quick stats) | ❌ | ✅ | Phase 1.1 |
| 1.5 | Add Child form page | ❌ | ✅ | Phase 1.1 |
| 1.6 | Child detail page | ❌ | ✅ | Phase 1.1 |

### Week 4 — Therapist Dashboard + Session Notes

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 1.7 | `GET /api/v1/therapists/children` — list assigned children | ✅ | ❌ | Phase 1.2 |
| 1.8 | Session CRUD endpoints (`/api/v1/sessions`) | ✅ | ❌ | Phase 1.2 |
| 1.9 | SessionNote create/update endpoints | ✅ | ❌ | Phase 1.3 |
| 1.10 | Session Notes form (date, goals, observations, recommendations) | ❌ | ✅ | Phase 1.3 |
| 1.11 | Therapist Dashboard page (assigned children, recent sessions) | ❌ | ✅ | Phase 1.2 |
| 1.12 | Therapist — Add Session Note UI | ❌ | ✅ | Phase 1.3 |

### Week 5 — Intake Form + Goal Tracking

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 1.13 | IntakeForm CRUD endpoints (`/api/v1/intake`) | ✅ | ❌ | Phase 1.4 |
| 1.14 | Goal CRUD endpoints (`/api/v1/goals`) | ✅ | ❌ | Phase 1.2 |
| 1.15 | Goal status update workflow | ✅ | ❌ | Phase 1.2 |
| 1.16 | Intake Form page (developmental history, concerns, goals) | ❌ | ✅ | Phase 1.4 |
| 1.17 | Goal tracking UI (create, view, update status) | ❌ | ✅ | Phase 1.2 |

### Week 6 — Behaviour Tracking + Admin Panel

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 1.18 | Behaviour CRUD endpoints (`/api/v1/behaviours`) | ✅ | ❌ | Phase 1.5 |
| 1.19 | BehaviourLog CRUD endpoints | ✅ | ❌ | Phase 1.5 |
| 1.20 | Admin endpoints: list users, approve therapists, assign therapist↔child | ✅ | ❌ | Phase 1.6 |
| 1.21 | Behaviour tracking UI (select behaviour, frequency, notes) | ❌ | ✅ | Phase 1.5 |
| 1.22 | Admin Panel pages (users list, approvals, assignments) | ❌ | ✅ | Phase 1.6 |
| 1.23 | Admin — Therapist approval workflow UI | ❌ | ✅ | Phase 1.6 |

### Week 7 — Messaging + Dashboard + Polish

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 1.24 | Conversation endpoints (create, list user's conversations) | ✅ | ❌ | Phase 1.7 |
| 1.25 | Message endpoints (send, list messages in conversation) | ✅ | ❌ | Phase 1.7 |
| 1.26 | Socket.io setup — real-time message delivery | ✅ | ❌ | Phase 1.7 |
| 1.27 | Chat UI (conversation list, message thread) | ❌ | ✅ | Phase 1.7 |
| 1.28 | Simple Dashboard view (session list, basic progress) | ❌ | ✅ | Phase 1.8 |
| 1.29 | Frontend role-based routing (redirects by role) | ❌ | ✅ | Phase 0 |
| 1.30 | MVP end-to-end integration testing | ✅ | ✅ | — |

**Milestone:** Platform is usable — parents add children, therapists log sessions, behaviour is tracked, admin manages users, parent↔therapist chat works.

---

## PHASE 2: PRODUCT IMPROVEMENT (Week 8–10)

Goal: More powerful clinical tools, file uploads, notifications, resource library.

### Week 8 — Progress Tracking + Reports

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 2.1 | Progress aggregation endpoints (behaviour trends, session counts) | ✅ | ❌ | Phase 2.1 |
| 2.2 | Goal mastery calculations | ✅ | ❌ | Phase 2.1 |
| 2.3 | Progress charts (behaviour trends, skill mastery %) | ✅ | ✅ | Phase 2.1 |

### Week 9 — File Uploads + Notifications

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 2.4 | File upload endpoint (Cloudinary) — reports, assessments, videos | ✅ | ❌ | Phase 2.3 |
| 2.5 | Notification CRUD + real-time push (Socket.io) | ✅ | ❌ | Phase 2.4 |
| 2.6 | File upload UI (drag & drop, linked to child/session) | ✅ | ✅ | Phase 2.3 |
| 2.7 | Notification UI (bell icon, dropdown, mark read) | ❌ | ✅ | Phase 2.4 |

### Week 10 — Resource Library + Therapist Profiles

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 2.8 | Resource model + CRUD endpoints (articles, videos, PDFs) | ✅ | ❌ | Phase 2.6 |
| 2.9 | Therapist public profile endpoint | ✅ | ❌ | Phase 2.5 |
| 2.10 | Resource Library UI (browse, search, view) | ✅ | ✅ | Phase 2.6 |
| 2.11 | Therapist profile page (public, specialization, experience) | ✅ | ✅ | Phase 2.5 |

**Milestone:** Platform feels professional — progress charts, file uploads, real-time notifications, resource library.

---

## PHASE 3: BUSINESS FEATURES (Week 11–13)

Goal: Revenue generation — booking, payments, subscription plans, reports.

### Week 11 — Booking System

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 3.1 | Availability slots model + endpoints | ✅ | ❌ | Phase 3.1 |
| 3.2 | Booking CRUD endpoints | ✅ | ❌ | Phase 3.1 |
| 3.3 | Calendar view — therapist availability + book session | ✅ | ✅ | Phase 3.1 |

### Week 12 — Payments + Subscriptions

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 3.4 | Paystack integration — initialize transaction, verify | ✅ | ✅ | Phase 3.2 |
| 3.5 | Subscription plans model + endpoints | ✅ | ✅ | Phase 3.3 |
| 3.6 | Webhook handler for payment confirmations | ✅ | ❌ | Phase 3.2 |
| 3.7 | Checkout/payment UI (mobile money + card) | ✅ | ✅ | Phase 3.2 |
| 3.8 | Subscription plan selection UI | ✅ | ✅ | Phase 3.3 |

### Week 13 — Reports Generator

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 3.9 | Report generation endpoint (aggregate child data → PDF) | ✅ | ❌ | Phase 3.4 |
| 3.10 | Transaction history + revenue dashboard endpoints | ✅ | ❌ | Phase 3.2 |
| 3.11 | Reports UI (generate, preview, download PDF) | ❌ | ✅ | Phase 3.4 |
| 3.12 | Revenue dashboard (admin) | ❌ | ✅ | Phase 3.2 |

**Milestone:** Platform generates revenue — parents book and pay, system auto-generates reports.

---

## PHASE 4: SCALE & DIFFERENTIATION (Week 14–18)

Goal: Competitive moat — schools, AI, teletherapy, mobile.

### Week 14 — School Dashboard

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 4.1 | Teacher role + school model | ✅ | ❌ | Phase 4.1 |
| 4.2 | Classroom tracking endpoints | ✅ | ❌ | Phase 4.1 |
| 4.3 | School Dashboard UI (teacher input, classroom view) | ❌ | ✅ | Phase 4.1 |

### Week 15–16 — AI Features

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 4.4 | AI service module — session note suggestions | ✅ | ❌ | Phase 4.2 |
| 4.5 | Behaviour insight generation | ✅ | ❌ | Phase 4.2 |
| 4.6 | Goal recommendation engine | ✅ | ❌ | Phase 4.2 |
| 4.7 | AI-powered UI components (suggested notes, insights) | ❌ | ✅ | Phase 4.2 |

### Week 17 — Teletherapy

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 4.8 | WebRTC/Video call integration (Daily, LiveKit, or similar) | ✅ | ❌ | Phase 4.3 |
| 4.9 | Video session scheduling + room management | ✅ | ❌ | Phase 4.3 |
| 4.10 | In-app video call UI | ❌ | ✅ | Phase 4.3 |

### Week 18 — Multi-language + Mobile

| # | Task | Backend | Frontend | PRD Ref |
|---|------|---------|----------|---------|
| 4.11 | i18n setup (English + Twi + other local languages) | ✅ | ✅ | Phase 4.4 |
| 4.12 | React Native / Expo mobile app (parent + therapist portals) | ✅ | ✅ | Phase 4.5 |

**Milestone:** Full platform with AI-powered tools, teletherapy, multi-language, and mobile apps.

---

## Effort Summary

| Phase | Weeks | Backend Tasks | Frontend Tasks | Total |
|-------|-------|---------------|----------------|-------|
| 0 — Foundation | 2 | 11 | 3 | 14 |
| 1 — MVP Launch | 5 | 14 | 16 | 30 |
| 2 — Improvement | 3 | 6 | 6 | 12 |
| 3 — Business | 3 | 9 | 6 | 15 |
| 4 — Scale | 5 | 9 | 6 | 15 |
| **Total** | **18** | **49** | **37** | **86** |

---

## Key Dependencies

- **Critical path:** Phase 0 → Phase 1 → rest (sequential; each phase depends on previous auth/middleware)
- **Phase 1 sub-tasks** can run in parallel per week (backend + frontend concurrently)
- **Phase 2 File Upload** depends on Cloudinary setup
- **Phase 3 Payments** depends on Paystack merchant account
- **Phase 4 AI** depends on OpenAI / Anthropic API keys
- **Phase 4 Teletherapy** depends on third-party video SDK (Daily, LiveKit, etc.)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| JWT secrets in `.env` are placeholders | Rotate before any public deployment |
| No tests yet | Add Jest/Vitest in Phase 0 before building features |
| CORS is fully open | Restrict to frontend origin in Phase 0 |
| Neon free tier has compute limits | Monitor usage; upgrade plan if needed |
| No CI/CD pipeline | Add GitHub Actions for lint + test in Phase 0 |
| Mobile app in Phase 4 is large effort | Consider React Native Expo for faster initial ship |
