# Neurobridge — Comprehensive User Flows

> End-to-end user scenarios covering all platform features for **PARENT**, **THERAPIST**, and **ADMIN** roles.
>
> **Stack:** Express.js + Prisma + PostgreSQL (Neon) | Next.js + Redux Toolkit + Tailwind CSS | Socket.io | Paystack

---

## Table of Contents

1. [Registration & Onboarding](#1-registration--onboarding)
2. [Login & Session Management](#2-login--session-management)
3. [Global Navigation](#3-global-navigation)
4. [Parent Flows](#4-parent-flows)
   - 4.1 Child Management
   - 4.2 Booking a Session
   - 4.3 Paying for a Booking
   - 4.4 Subscriptions
   - 4.5 Therapy Reports
   - 4.6 Resource Library
   - 4.7 Progress Charts
   - 4.8 Messaging
5. [Therapist Flows](#5-therapist-flows)
   - 5.1 Managing Availability
   - 5.2 Managing Bookings
   - 5.3 Logging Sessions & Notes
   - 5.4 Behaviour Tracking
   - 5.5 Goals Management
   - 5.6 Progress Charts
   - 5.7 Resource Library
   - 5.8 Messaging
6. [Admin Flows](#6-admin-flows)
   - 6.1 User Management & Approvals
   - 6.2 Revenue Dashboard
   - 6.3 Subscription Plan Management
7. [Shared Infrastructure](#7-shared-infrastructure)
   - 7.1 Real-Time Messaging
   - 7.2 Real-Time Notifications
   - 7.3 File Uploads (Cloudinary)
8. [Complete Data Pipeline](#8-complete-data-pipeline)
9. [Socket Lifecycle](#9-socket-lifecycle)
10. [Payment & Subscription Lifecycle](#10-payment--subscription-lifecycle)
11. [Booking Lifecycle](#11-booking-lifecycle)

---

## 1. Registration & Onboarding

```
Guest ──► /register ──► Fill form ──► OTP sent to email
  │                                    │
  │                              ┌─────┘
  │                              ▼
  │                         /verify-otp
  │                         Enter OTP ──► Verified ──► Login
  │                                              │
  │                                    ┌─────────┘
  │                                    ▼
  │                               Dashboard
  │                          (role-aware landing)
```

**Roles:**

| Role | Approval | First-Seen Experience |
|------|----------|-----------------------|
| **PARENT** | Auto-approved | Dashboard with children overview → prompt to add child |
| **THERAPIST** | Pending admin approval | Limited dashboard — can browse resources, cannot access children or sessions until approved |

**Key Pages:** `/register`, `/verify-otp`, `/login`, `/dashboard`

**OTP Flow:**
```
Register ──► POST /auth/register ──► OTP sent via email
  │
  ▼
/verify-otp ──► Enter 6-digit code ──► POST /auth/verify-otp
  │                                        │
  │                                  ┌─────┘
  │                                  ▼
  │                            Account activated
  │                            ──► Redirect to /login
```

---

## 2. Login & Session Management

```
User ──► /login ──► Email + Password ──► POST /auth/login
  │                                              │
  │                                        ┌─────┘
  │                                        ▼
  │                                  Dashboard
  │                                 (role-aware)
```

**Token Lifecycle:**
```
Login ──► accessToken (15m, localStorage) + refreshToken (7d, httpOnly cookie)
  │
  │  On any 401 API response:
  ▼
Axios interceptor ──► POST /auth/refresh (cookie sent automatically)
  │                        │
  │                  ┌─────┘
  │                  ▼
  │            New accessToken stored
  │            Retry original request
  │
  │  If refresh also fails (401):
  ▼
Clear token ──► Redirect to /login
```

**Hydration Safety:** All `"use client"` pages use `if (!user) return null;` before the main JSX return, ensuring server and client render the same initial HTML (user starts as `null` in Redux on both sides). This pattern is used across all 10+ authenticated pages.

**Key Files:** `frontend/src/app/services/api.ts` (interceptor), `frontend/src/app/store/slices/authSlice.ts`, `frontend/src/app/components/Navbar.tsx`

---

## 3. Global Navigation

The Navbar (`components/Navbar.tsx`) renders role-aware links. Links shown depend on `user.role`:

```
                        PARENT              THERAPIST            ADMIN
                      ──────────           ──────────          ──────────
Dashboard                  ✅                   ✅                  ✅
Children                   ✅                   ✅                  —
Messages                   ✅                   ✅                  —
Resources                  ✅                   ✅                  —
Therapists                 ✅                   —                   —
Bookings                   ✅                   ✅                  —
Availability               —                   ✅                  —
Subscriptions              ✅                   ✅                  —
Reports                    ✅                   ✅                  —
Notifications              ✅                   ✅                  ✅
Admin                      —                   —                   ✅
Revenue                    —                   —                   ✅
```

The Navbar is hydration-safe: `if (!isAuthenticated || !user) return null;`

---

## 4. Parent Flows

### 4.1 Child Management

```
/children ──► GET /api/v1/children ──► List of children
  │
  ├── "Add Child" ──► /children/add
  │                       │
  │                       ▼
  │                   Form: name, DOB, gender, diagnosis, school
  │                       │
  │                       ▼
  │                   POST /api/v1/children
  │                       │
  │                       ▼
  │                   Redirect to /children
  │
  └── Click child ──► /children/[id]
                          │
                    ┌─────┴────────────────────────────┐
                    │           │           │           │
                    ▼           ▼           ▼           ▼
                Profile     Sessions    Intake Form  Behaviours
                  │            │            │           │
                  │      /children/[id]   /children/  /children/
                  │      /sessions        [id]/intake  [id] (Goals &
                  │                                      Behaviours tab)
                  │
                  ├── "Edit" ──► /children/[id]/edit ──► PATCH /api/v1/children/:id
                  │
                  └── File Upload (Progress/Files tabs)
                        │
                        ▼
                    POST /api/v1/upload (Cloudinary)
```

**Key Pages:** `/children`, `/children/add`, `/children/[id]`, `/children/[id]/edit`, `/children/[id]/intake`

**Key Backend:** `child.route.js` — CRUD + assign therapist

---

### 4.2 Booking a Session

```
/bookings/new ──► 4-Step Wizard
  │
  ├── Step 1: Select Therapist
  │       │
  │       ▼
  │   GET /api/v1/therapists ──► List of approved therapists
  │       │
  │       ▼
  │   Click therapist ──► Next step
  │
  ├── Step 2: Select Time Slot
  │       │
  │       ▼
  │   GET /api/v1/availability?therapistId=X
  │   ──► Weekly recurring slots grouped by day
  │       │
  │       ▼
  │   Click time slot ──► Next step
  │
  ├── Step 3: Select Child
  │       │
  │       ▼
  │   GET /api/v1/children ──► Parent's children
  │       │
  │       ▼
  │   Click child ──► Next step
  │
  └── Step 4: Confirm
          │
          ▼
      Review details + optional notes
          │
          ▼
      POST /api/v1/bookings ──► Booking created (PENDING)
          │
          ├── Socket.io notification ──► Therapist alerted
          └── Redirect to /bookings
```

**Key Pages:** `/bookings/new`, `/bookings`
**Key Backend:** `booking.route.js`, `availability.route.js`

---

### 4.3 Paying for a Booking

```
/bookings (list)
  │
  └── PENDING booking ──► "Pay Now" button
                              │
                              ▼
                          /bookings/[id]/payment
                              │
                              ▼
                          Review: therapist, child, time, amount
                              │
                              ▼
                          Click "Pay GHS 150.00 with Paystack"
                              │
                              ▼
                          POST /api/v1/payments/initialize
                            { amount: 15000, bookingId }
                              │
                              ▼
                          Redirect to Paystack Checkout
                          (authorization_url)
                              │
                    ┌─────────┴────────────┐
                    ▼                      ▼
                Card Payment          Mobile Money
                (Visa, Mastercard)    (MTN, Vodafone, AirtelTigo)
                    │                      │
                    └──────────┬───────────┘
                               ▼
                    Paystack redirects back
                    ?reference=NB-XXXX
                               │
                               ▼
                    /bookings/[id]/payment?reference=NB-XXXX
                               │
                               ▼
                    GET /api/v1/payments/verify/:reference
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
                SUCCESS                FAILED
                    │                     │
                    ▼                     ▼
            Booking → CONFIRMED    Show error message
            Redirect to /bookings
```

**Key Pages:** `/bookings/[id]/payment`
**Key Backend:** `payment.route.js` — initialize, verify, webhook

**Webhook (Server-to-Server):**
```
Paystack ──► POST /api/v1/payments/webhook
  event: "charge.success"
  │
  ├── Update Transaction → SUCCESS
  ├── Update Booking → CONFIRMED (if bookingId in metadata)
  ├── Create UserSubscription → ACTIVE (if subscriptionId in metadata)
  └── Create notifications for parent + therapist
```

---

### 4.4 Subscriptions

```
/subscriptions
  │
  ├── Show current active subscription (if any)
  │     └── GET /api/v1/subscriptions/my
  │
  └── Plan grid:
        ┌─────────────┬────────────┬──────────┐
        │   Basic     │  Premium   │  Family  │
        │  GHS 50/mo  │ GHS 120/mo │GHS 250/mo│
        │ 2 sess/wk   │ 4 sess/wk  │6 sess/wk │
        │ Tracking    │ Priority   │3 children│
        └─────────────┴────────────┴──────────┘
              │              │            │
              └──────┬───────┘            │
                     ▼                    ▼
              "Subscribe" button
                     │
                     ▼
              POST /api/v1/subscriptions/subscribe
                { planId }
                     │
                     ▼
              Redirect to Paystack → Pay → Webhook activates sub
```

**Key Pages:** `/subscriptions`
**Key Backend:** `subscription.route.js` — plans CRUD, subscribe, my subscription

---

### 4.5 Therapy Reports

```
/reports
  │
  ├── GET /api/v1/children ──► List of parent's children
  │
  └── For each child:
        │
        └── "Download PDF" button
              │
              ▼
          GET /api/v1/reports/:childId
          (returns PDF file as download)
              │
              ▼
          Browser downloads: report-{FirstName}-{LastName}.pdf

PDF Contents:
  ┌─────────────────────────────────────┐
  │     Neurobridge Therapy Report      │
  │                                     │
  │  Child Information                  │
  │  • Name, DOB, Gender, Diagnosis     │
  │                                     │
  │  Parent / Guardian                  │
  │                                     │
  │  Intake Summary                     │
  │  • Developmental History            │
  │  • Behaviour Concerns               │
  │  • Parent Goals                     │
  │                                     │
  │  Session Summary                    │
  │  • Total Sessions, Duration, Avg    │
  │  • Recent 5 Sessions (date, time,   │
  │    therapist)                       │
  │                                     │
  │  Goals Progress                     │
  │  • Not Started / In Progress /      │
  │    Achieved / Archived counts       │
  │  • Full goal list with status       │
  │                                     │
  │  Behaviour Tracking                 │
  │  • Per behaviour: log count, avg    │
  │    frequency                        │
  │                                     │
  │  Notes                              │
  └─────────────────────────────────────┘
```

**Key Pages:** `/reports`
**Key Backend:** `report.route.js` — PDF generation via PDFKit

---

### 4.6 Resource Library

```
/resources
  │
  ├── GET /api/v1/resources
  │   (supports ?type=ARTICLE|VIDEO|PDF & ?search=keyword)
  │
  ├── Filter by type (tabs: All, Articles, Videos, PDFs)
  │
  ├── Search by keyword
  │
  └── Resource cards:
        ┌─────────────────────────────────┐
        │ 📄 Title                        │
        │ Description of the resource...  │
        │ [Type badge] [Open link →]      │
        └─────────────────────────────────┘
```

**Key Pages:** `/resources`
**Key Backend:** `resource.route.js` — CRUD with type/search filtering

---

### 4.7 Progress Charts

```
/progress/[childId]
  │
  ├── GET /api/v1/progress/:childId
  │
  ├── Summary Cards:
  │   ┌──────────┬───────────┬──────────┐
  │   │ Sessions │ Duration  │ Goals    │
  │   │   12     │ 480 min   │ 3/5 done │
  │   └──────────┴───────────┴──────────┘
  │
  ├── Session Duration Bar Chart (Recharts)
  │   └── X: session dates, Y: minutes
  │
  ├── Goal Status Pie Chart
  │   └── Segments: Not Started, In Progress, Achieved, Archived
  │
  └── Behaviour Frequency Line Chart
      └── Per behaviour: date vs frequency
```

**Key Pages:** `/progress/[childId]`
**Key Backend:** `progress.route.js` — aggregated data endpoint

---

## 5. Therapist Flows

### 5.1 Managing Availability

```
/availability
  │
  ├── GET /api/v1/availability?therapistId=X
  │   ──► Existing recurring slots, grouped by day
  │
  ├── Add Recurring Slot form:
  │     Day (dropdown: Sun-Sat)
  │     Start Time (time picker)
  │     End Time (time picker)
  │     ──► POST /api/v1/availability
  │           { dayOfWeek, startTime, endTime, isRecurring: true }
  │
  └── Remove Slot:
        ──► DELETE /api/v1/availability/:id
```

**Key Pages:** `/availability`
**Key Backend:** `availability.route.js` — CRUD

---

### 5.2 Managing Bookings

```
/bookings
  │
  ├── GET /api/v1/bookings (auto-filtered by therapistId)
  │
  ├── Booking cards:
  │     ┌─────────────────────────────────────┐
  │     │ Child Name     Status: PENDING      │
  │     │ with Therapist Name                 │
  │     │ Mon 10:00 — 11:00                   │
  │     │                                     │
  │     │ [Confirm] [Cancel]                  │
  │     └─────────────────────────────────────┘
  │
  │  Status workflow:
  │    PENDING ──► CONFIRMED ──► COMPLETED
  │       │                        │
  │       └── CANCELLED            └── (terminal)
  │
  ├── Confirm: PATCH /api/v1/bookings/:id/status { status: "CONFIRMED" }
  │     └── Socket.io notification ──► Parent alerted
  │
  ├── Complete: PATCH /api/v1/bookings/:id/status { status: "COMPLETED" }
  │
  └── Cancel: PATCH /api/v1/bookings/:id/status { status: "CANCELLED" }
```

**Key Pages:** `/bookings`
**Key Backend:** `booking.route.js` — list, get, create, updateStatus

---

### 5.3 Logging Sessions & Notes

```
/children/[id]/sessions/new
  │
  ├── Form:
  │     Session Date (date picker)
  │     Duration (minutes)
  │     ──► POST /api/v1/sessions
  │
  └── On create:
        └── Redirect to session note form (upsert)
              Goals Worked On (textarea)
              Observations (textarea)
              Recommendations (textarea)
              ──► PUT /api/v1/sessions/:sessionId/note
              │
              └── Socket.io: notification:new ──► Parent notified
```

**Key Pages:** `/children/[id]/sessions`, `/children/[id]/sessions/new`
**Key Backend:** `session.route.js` — CRUD + note upsert

---

### 5.4 Behaviour Tracking

```
Accessed from /children/[id] (under Behaviours tab)
  │
  ├── Add Behaviour:
  │     Name, Description
  │     ──► POST /api/v1/behaviours
  │
  ├── Log Behaviour:
  │     Frequency, Notes, Date
  │     ──► POST /api/v1/behaviours/:behaviourId/logs
  │
  └── View logs over time (table/chart)
```

**Key Backend:** `behaviour.route.js` — CRUD + logs

---

### 5.5 Goals Management

```
Accessed from /children/[id] (under Goals tab)
  │
  ├── Add Goal:
  │     Title, Description
  │     ──► POST /api/v1/goals
  │
  ├── Update Status:
  │     NOT_STARTED → IN_PROGRESS → ACHIEVED → ARCHIVED
  │     ──► PATCH /api/v1/goals/:id
  │
  └── View all goals with status badges
```

**Key Backend:** `goal.route.js` — CRUD

---

### 5.6 Progress Charts (Read-Only)

```
/progress/[childId]
  │
  ├── Same view as parent — therapist can see assigned children's progress
  │
  ├── Summary cards (sessions, duration, goals)
  ├── Bar/Pie/Line charts via Recharts
  └── Read-only access enforced by backend (user must be assigned therapist)
```

**Key Pages:** `/progress/[childId]`

---

### 5.7 Resource Library (Create & Browse)

```
/resources
  │
  ├── Browse (same as parent) — view resources
  │
  └── Therapists can also CREATE resources:
        └── Form: Title, Description, Type (ARTICLE|VIDEO|PDF), URL
              ──► POST /api/v1/resources
```

**Key Backend:** `resource.route.js` — role-based access (therapists + admins can create)

---

## 6. Admin Flows

### 6.1 User Management & Approvals

```
/admin
  │
  ├── GET /api/v1/admin/stats ──► Dashboard stats:
  │     ┌──────────┬───────────┬───────────┬──────────┐
  │     │ Children │  Parents  │Therapists │  Pending │
  │     │   42     │    18     │    12     │    2     │
  │     └──────────┴───────────┴───────────┴──────────┘
  │
  ├── Users table (filterable by role):
  │     ┌────────┬───────┬──────────┬────────┬─────────┐
  │     │  Name  │ Email │  Role    │Status  │ Actions │
  │     ├────────┼───────┼──────────┼────────┼─────────┤
  │     │ Sarah  │ s@... │ PARENT   │ ✅     │   —     │
  │     │ Lisa   │ l@... │ THERAPIST│ ⏳     │[Approve]│
  │     └────────┴───────┴──────────┴────────┴─────────┘
  │
  │  Approve therapist:
  │    ──► PATCH /api/v1/admin/users/:userId/approve
  │    ──► Therapist can now access children/sessions
  │
  └── Assign therapist to child:
        ──► POST /api/v1/children/:childId/assign { therapistId }
        ──► Socket.io notification ──► Therapist notified
```

**Key Pages:** `/admin`
**Key Backend:** `admin.route.js` — stats, list users, approve

---

### 6.2 Revenue Dashboard

```
/admin/revenue
  │
  ├── GET /api/v1/payments/revenue
  │
  ├── KPI Cards:
  │     ┌─────────────┬────────────┬────────────┬──────────┐
  │     │  Total      │   Monthly  │  Active    │  Total   │
  │     │  Revenue    │   Revenue  │  Subscribers│ Users    │
  │     │ GHS 12,500  │ GHS 3,200  │    8       │   42     │
  │     └─────────────┴────────────┴────────────┴──────────┘
  │
  └── Recent Transactions Table:
        ┌──────────┬──────────┬────────┬────────┬──────────┐
        │   User   │ Reference│ Amount │ Status │   Date   │
        ├──────────┼──────────┼────────┼────────┼──────────┤
        │ Sarah J  │ NB-...   │GHS 150 │  ✅    │ 10 Jul   │
        │ Michael  │ NB-...   │GHS 120 │  ✅    │ 09 Jul   │
        └──────────┴──────────┴────────┴────────┴──────────┘
```

**Key Pages:** `/admin/revenue`
**Key Backend:** `payment.route.js` — revenue dashboard endpoint

---

## 7. Shared Infrastructure

### 7.1 Real-Time Messaging

```
/messages ──► GET /api/v1/messages ──► Conversation list
  │
  └── Click conversation ──► /messages/[id]
        │
        ├── Load messages: GET /api/v1/messages/:conversationId
        │
        ├── Send message:
        │     ──► POST /api/v1/messages
        │     ──► Socket.io emit "message:new" to conversation room
        │     ──► Other participants receive via SocketManager:
        │           ├── Redux dispatch (liveMessages)
        │           └── Toast notification
        │
        └── Real-time updates:
              SocketManager listens for "message:new"
              ──► Appends to Redux liveMessages[]
              ──► Updates conversation list (last message preview)
```

**Key Pages:** `/messages`, `/messages/[id]`
**Key Backend:** `message.route.js` — conversations, messages, create

**Key Socket Events:**
| Event | Direction | Payload |
|-------|-----------|---------|
| `message:new` | Server → Client | `{ conversationId, message }` |
| `conversation:new` | Server → Client | `{ conversation }` |

---

### 7.2 Real-Time Notifications

```
Trigger                    Backend                          Frontend
─────────                  ──────────────────────────────   ──────────────────────────
Session created  ──►  createNotification(userId, title, body)
Session note     ──►    │
Booking created  ──►    ├── DB insert (persisted)
Booking confirm  ──►    ├── emitToUser(userId, "notification:new", notif)
Payment success  ──►    │                                    │
Therapist assign ──►    │                          SocketManager
                         │                           │
                         │                           ├── dispatch(addNotification)
                         │                           ├── toast.success(title)
                         │                           │
                         │                     Navbar bell badge
                         │                     (unreadCount from Redux)
                         │                           │
                         │                   ┌───────┴────────┐
                         │                   ▼                ▼
                         │             Bell dropdown     /notifications
                         │             (last 10)        (full list)
                         │                   │                │
                         │                   ▼                ▼
                         │             Mark all read    Mark single read
                         │             PATCH /read-all  PATCH /:id/read
```

**Notification Events:**
| Event | Trigger | Recipients |
|-------|---------|------------|
| `notification:new` | Any notification created | Targeted user |
| `message:new` | Message sent in conversation | Participants (except sender) |
| `session:created` | Session logged | Parent |
| `booking:created` | Booking requested | Therapist |
| `booking:confirmed` | Booking confirmed | Parent |
| `payment:success` | Payment completed | Parent + Therapist |
| `assignment:new` | Therapist assigned | Therapist |

**Key Pages:** `/notifications`, Navbar bell dropdown
**Key Backend:** `notification.route.js` — list, unread count, mark read, mark all read
**Key Components:** `SocketManager.tsx`, `Navbar.tsx` (bell + dropdown), Redux `notificationSlice`

---

### 7.3 File Uploads (Cloudinary)

```
Upload flow (from child detail page or session):
  │
  ├── User selects file (max 10MB)
  │
  ├── POST /api/v1/upload ──► multer receives file
  │     └── Fields: file, childId?, sessionId?
  │
  ├── multer-storage-cloudinary uploads to Cloudinary
  │
  ├── Prisma: FileAttachment record created
  │     { fileName, url, publicId, mimeType, size, uploadedById }
  │
  └── Response: { fileAttachment } with Cloudinary URL

Delete flow:
  ──► DELETE /api/v1/upload/:id
  ──► Cloudinary API destroys by publicId
  ──► Prisma record deleted
```

**Key Backend:** `upload.route.js` — Cloudinary + multer

---

## 8. Complete Data Pipeline

```
User Action (click, form submit, etc.)
  │
  ▼
Frontend API Service (e.g., bookingsApi.create())
  │
  ▼
Axios instance ──► Request interceptor attaches JWT
  │
  ▼
HTTP Request ──► Express.js Route ──► Auth Middleware (verifyToken)
  │                                               │
  │                                         ┌─────┘
  │                                         ▼
  │                                   Controller
  │                                         │
  │                                    ┌────┴────┐
  │                                    │         │
  │                                    ▼         ▼
  │                              Prisma ORM   Socket.io emit
  │                              (CRUD)       (real-time event)
  │                                    │         │
  │                                    ▼         ▼
  │                              PostgreSQL   SocketManager
  │                              (Neon)       (frontend)
  │                                    │         │
  │                                    │    ┌────┴────┐
  │                                    │    │         │
  │                                    │    ▼         ▼
  │                                    │ Redux     Toast
  │                                    │ dispatch  notification
  │                                    │
  │                                    ▼
  │                              HTTP Response (JSON)
  │                                    │
  └────────────────────────────────────┘
                                       ▼
                              Frontend caller processes response
                                       │
                                  ┌────┴────┐
                                  │         │
                                  ▼         ▼
                            Optimistic UI  Error handling
                            update         (show message)
```

---

## 9. Socket Lifecycle

```
App renders Providers.tsx
  │
  ▼
SocketManager mounts (returns null — no UI)
  │
  ├── Watches `isAuthenticated` from Redux
  │
  ├── When authenticated:
  │     │
  │     ├── connectSocket(token)
  │     │     │
  │     │     ├── socket = io(SOCKET_URL, { auth: { token } })
  │     │     │
  │     │     ├── Server verifies JWT
  │     │     │     └── socket.join(`user:${userId}`)
  │     │     │
  │     │     └── Register global listeners:
  │     │           ├── "notification:new" → dispatch + toast
  │     │           └── "message:new" → dispatch
  │     │
  │     └── On disconnect (logout):
  │           ├── socket.removeAllListeners()
  │           └── socket.disconnect()
  │
  └── When not authenticated:
        └── disconnectSocket() if previously connected

Page-specific listeners (e.g., /messages/[id]):
  Component mounts → adds "message:new" listener scoped to conversation
  Component unmounts → removes that specific listener
```

**Key Components:** `SocketManager.tsx` (global lifecycle), individual page effects

---

## 10. Payment & Subscription Lifecycle

```
Payment Initiation (User-facing):
  │
  ├── Parent clicks "Pay Now" on booking OR "Subscribe" on plan
  │
  ├── POST /api/v1/payments/initialize (or /subscriptions/subscribe)
  │     └── Transaction created in DB (status: PENDING)
  │
  └── Redirect to Paystack Checkout URL
        │
        ├── User pays via Card or Mobile Money
        │
        └── Paystack redirects back with ?reference=XXXX

Payment Verification (User-facing):
  │
  ├── Frontend calls GET /api/v1/payments/verify/:reference
  │
  ├── Backend queries Paystack API:
  │     GET https://api.paystack.co/transaction/verify/:reference
  │
  ├── If success:
  │     ├── Transaction → SUCCESS
  │     ├── If booking: Booking → CONFIRMED
  │     ├── If subscription: UserSubscription → ACTIVE
  │     └── Notifications sent
  │
  └── Frontend shows success and redirects

Payment Webhook (Server-to-Server, async fallback):
  │
  ├── Paystack POSTs to /api/v1/payments/webhook
  │     event: "charge.success"
  │
  └── Same logic as verify — ensures delivery even if user closes browser

State Transitions:
  Transaction: PENDING ──► SUCCESS | FAILED
  Booking (via payment): PENDING ──► (unpaid) or ──► CONFIRMED (paid)
  UserSubscription: PENDING ──► ACTIVE ──► EXPIRED | CANCELLED
```

---

## 11. Booking Lifecycle

```
           ┌─────────────────────────────────────────────────────────┐
           │                  FULL BOOKING LIFECYCLE                 │
           └─────────────────────────────────────────────────────────┘

PARENT creates booking          THERAPIST confirms     THERAPIST completes
via 4-step wizard              or cancels              session
       │                            │                       │
       ▼                            ▼                       ▼
   ┌────────┐              ┌──────────────┐          ┌───────────┐
   │PENDING │─────────────►│  CONFIRMED   │─────────►│ COMPLETED │
   └───┬────┘              └──────┬───────┘          └───────────┘
       │                          │                      (terminal)
       │  PARENT cancels          │  THERAPIST cancels
       ▼                          ▼
   ┌──────────┐              ┌──────────┐
   │CANCELLED │              │CANCELLED │
   └──────────┘              └──────────┘
   (terminal)                (terminal)

Payment integration:
  PENDING (unpaid) ──► Parent pays ──► CONFIRMED
  PENDING (unpaid) ──► No payment ──► Remains PENDING

Notifications at each transition:
  PENDING → CONFIRMED: "Your booking is confirmed" → Parent
  PENDING → CANCELLED: "Booking cancelled" → Both parties
  CONFIRMED → COMPLETED: "Session completed" → Parent
```

---

## Page Directory (26 Frontend Pages)

| Path | Role(s) | Description |
|------|---------|-------------|
| `/` | All | Landing page |
| `/login` | Guest | Email/password login |
| `/register` | Guest | Registration form |
| `/verify-otp` | Guest | Email OTP verification |
| `/dashboard` | All | Role-aware dashboard |
| `/children` | Parent, Therapist | Child list |
| `/children/add` | Parent | Add child form |
| `/children/[id]` | Parent, Therapist | Child detail (profile, sessions, intake, behaviours) |
| `/children/[id]/edit` | Parent | Edit child info |
| `/children/[id]/intake` | Parent | Intake form |
| `/children/[id]/sessions` | Parent, Therapist | Session history |
| `/children/[id]/sessions/new` | Therapist | Log new session |
| `/progress/[childId]` | Parent, Therapist | Charts (Recharts) |
| `/bookings` | Parent, Therapist | Booking list (role-aware actions) |
| `/bookings/new` | Parent | 4-step booking wizard |
| `/bookings/[id]/payment` | Parent | Paystack checkout |
| `/availability` | Therapist | Manage weekly slots |
| `/subscriptions` | All authenticated | Plan selection & subscribe |
| `/reports` | Parent, Therapist | Generate/download PDF reports |
| `/resources` | All authenticated | Resource library |
| `/therapists/[id]` | All | Therapist public profile |
| `/messages` | All authenticated | Conversation list |
| `/messages/[id]` | All authenticated | Chat UI |
| `/notifications` | All authenticated | Full notification list |
| `/admin` | Admin | User management & approvals |
| `/admin/revenue` | Admin | Revenue dashboard |

---

## Route Directory (20 Backend Route Files)

| Route File | Prefix | Key Endpoints | Auth |
|-----------|--------|---------------|------|
| `auth.route.js` | `/api/v1/auth` | register, login, logout, refresh, send-otp, verify-otp, resend-otp | Mixed |
| `user.route.js` | `/api/v1/users` | GET/PATCH /me | JWT |
| `child.route.js` | `/api/v1/children` | CRUD, assign therapist | JWT |
| `session.route.js` | `/api/v1/sessions` | CRUD, note upsert | JWT |
| `intake.route.js` | `/api/v1/intake` | CRUD per child | JWT |
| `goal.route.js` | `/api/v1/goals` | CRUD per child | JWT |
| `behaviour.route.js` | `/api/v1/behaviours` | CRUD + log entries | JWT |
| `message.route.js` | `/api/v1/messages` | Conversations, messages, create | JWT |
| `notification.route.js` | `/api/v1/notifications` | List, unread-count, mark-read, read-all | JWT |
| `resource.route.js` | `/api/v1/resources` | CRUD with type/search filter | JWT |
| `upload.route.js` | `/api/v1/upload` | Upload (Cloudinary), delete | JWT |
| `progress.route.js` | `/api/v1/progress/:childId` | Aggregated progress data | JWT |
| `therapist.route.js` | `/api/v1/therapists` | List, public profile | JWT |
| `admin.route.js` | `/api/v1/admin` | Stats, list users, approve therapist | JWT + Admin |
| `availability.route.js` | `/api/v1/availability` | CRUD recurring slots | JWT |
| `booking.route.js` | `/api/v1/bookings` | CRUD, status transitions | JWT |
| `payment.route.js` | `/api/v1/payments` | Initialize, verify, webhook, transactions, revenue | JWT + Webhook |
| `subscription.route.js` | `/api/v1/subscriptions` | Plans CRUD, subscribe, my subscription | JWT |
| `report.route.js` | `/api/v1/reports/:childId` | PDF report generation | JWT |

---

## Test Coverage (19 tests)

| Test File | Tests | What It Covers |
|-----------|-------|-----------------|
| `tests/auth.test.js` | 11 | Register (success, duplicate, invalid), Login (email, phone, wrong pw, missing), Refresh, Profile (auth, unauth), Logout |
| `tests/notifications.e2e.test.js` | 8 | Assignment notifications, session notifications, unread count, mark read, mark all read, auth guard, `notification:new` socket event, `session:created` socket event |
