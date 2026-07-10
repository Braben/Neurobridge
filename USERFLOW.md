# Neurobridge — User Flows

> End-to-end user scenarios covering the platform's core workflows.

---

## 1. Registration & Onboarding

```
Guest ──► /register ──► Fill form ──► OTP sent to email
  │                                    │
  │                              ┌─────┘
  │                              ▼
  │                         Enter OTP ──► Verified ──► Login
  │                                              │
  │                                    ┌─────────┘
  │                                    ▼
  │                               Dashboard
  │                          (pending approval if therapist)
```

**Roles:**

- **PARENT** — auto-approved, can immediately add children
- **THERAPIST** — pending admin approval, limited access until approved

---

## 2. Login & Session Management

```
User ──► /login ──► Email/Phone + Password ──► Authenticated
  │                                                    │
  │                                          ┌─────────┘
  │                                          ▼
  │                                     Dashboard
  │                                    (role-aware)
  │                                          │
  │                                    ┌─────┴─────┐
  │                                    ▼           ▼
  │                              Parent View   Therapist View
  │                              - My Children  - Assigned Children
  │                              - Quick Stats   - Recent Sessions
```

**Token Lifecycle:**

```
Login ──► accessToken (15m) + refreshToken (7d cookie)
  │
  │  401 on any API call
  ▼
Axios interceptor ──► POST /auth/refresh ──► New token pair
```

---

## 3. Parent Flow — Child Management

```
Dashboard ──► /children ──► Child List
  │                              │
  │                    ┌─────────┼─────────┐
  │                    ▼         ▼         ▼
  │               Add Child   View Child  Edit Child
  │                    │         │
  │                    │    ┌────┴─────────────────────┐
  │                    │    │       │         │        │
  │                    │    ▼       ▼         ▼        ▼
  │                    │  Profile  Sessions  Intake  Behaviours
  │                    │                     Form
  │                    ▼
  │            Form → Created → Back to list
```

---

## 4. Therapist Flow — Sessions & Notes

```
Dashboard ──► Assigned Children
  │                              │
  │                    ┌─────────┘
  │                    ▼
  │              Child Profile
  │                    │
  │           ┌────────┴────────┐
  │           ▼                 ▼
  │      Log Session      View History
  │           │                 │
  │           ▼                 ▼
  │   Session Form          Past Sessions
  │   (date, duration)      (with notes)
  │           │
  │           ▼
  │   Session Note (upsert)
  │   - Goals Worked On
  │   - Observations
  │   - Recommendations
  │           │
  │           ▼
  │  Real-time: session:created ──► Parent notified
```

---

## 5. Real-Time Messaging

```
Therapist Dashboard          Parent Dashboard
      │                            │
      │   ┌──────────────────┐     │
      │   │  /messages       │     │
      │   │  Conversation    │     │
      │   │  List            │     │
      │   └────────┬─────────┘     │
      │            │               │
      │            ▼               │
      │   ┌──────────────────┐     │
      │   │  /messages/[id]  │     │
      │   │  Chat UI         │     │
      │   └────────┬─────────┘     │
      │            │               │
      │    Send message            │
      │            │               │
      │            ▼               │
      │   Socket.io ───────────────► message:new event
      │   "message:new"            │
      │                            │
      │                     ┌──────┴──────┐
      │                     │             │
      │                     ▼             ▼
      │              Redux addLive   Toast notification
      │              (liveMessages)  (sender preview)
```

---

## 6. Real-Time Notifications

```
Trigger                    Backend                          Frontend
─────────                  ──────────────────────────────   ──────────────────────────
Session created  ──►  createNotification()                SocketManager
Session updated  ──►    │                                    │
Session note     ──►    ├── DB insert (persisted)            ├── dispatch(addNotification)
Therapist        ──►    └── emitToUser(notification:new) ───►├── toast.success(title)
  assigned                                                      │
                                                       ┌──────┘
                                                       ▼
                                                 Navbar bell badge
                                                 (unreadCount from Redux)
                                                       │
                                               ┌───────┴────────┐
                                               ▼                ▼
                                         Bell dropdown     /notifications
                                         (last 10)        (full list)
                                               │                │
                                               ▼                ▼
                                         Mark all read    Mark single read
```

**Notification Events:**
| Event | Trigger | Recipients |
|-------|---------|------------|
| `notification:new` | Any notification created | Targeted user |
| `message:new` | Message sent in conversation | All participants (except sender) |
| `conversation:new` | Conversation created | All participants (except creator) |
| `session:created` | Session logged | Therapist owner |
| `session:updated` | Session updated | Therapist owner |
| `assignment:new` | Therapist assigned | Therapist |

---

## 7. Admin Flow

```
/login ──► /admin
  │
  ├── Dashboard Stats (total users, therapists, children)
  ├── Users List (filterable by role, approve/reject therapists)
  └── Therapist Assignments (assign therapists to children)
```

---

## 8. Complete Data Pipeline

```
User Action
  │
  ▼
API Controller
  │
  ├── Prisma DB operation (CRUD)
  │
  ├── Socket.io emit (real-time event)
  │     │
  │     ▼
  │   Frontend SocketManager
  │     │
  │     ├── Redux dispatch (state update)
  │     └── Toast notification (user alert)
  │
  └── JSON response (API reply)
        │
        ▼
      Frontend caller
        │
        ├── Optimistic UI update (if needed)
        └── Error handling
```

---

## 9. Socket Lifecycle

```
App Start
  │
  ▼
Providers.tsx ──► SocketManager rendered (returns null, no UI)
  │                    │
  │                    ▼
  │              ┌─── isAuthenticated? ───┐
  │              │                        │
  │              ▼                        ▼
  │          connectSocket()         disconnectSocket()
  │              │                        │
  │              ▼                        │
  │        socket.io-client              │
  │        ┌──────────┐                  │
  │        │ Auth with │                  │
  │        │ JWT token │                  │
  │        └────┬─────┘                  │
  │             │                        │
  │             ▼                        │
  │      Server validates JWT            │
  │             │                        │
  │             ▼                        │
  │      socket joins `user:<id>` room   │
  │             │                        │
  │             ▼                        │
  │      Global listeners registered:    │
  │      - notification:new              │
  │      - message:new                   │
  │                                      │
  │      Page-specific listeners:        │
  │      /messages/[id] ──► message:new  │
  │                                      │
  │      On logout ──────────────────────┘
  │
  ▼
Socket removedAllListeners + disconnect
```

---

## 10. Notification Badge Sync

```
SocketManager                    Navbar                  Notifications Page
  │                               │                           │
  │  ┌── notification:new         │                           │
  │  │                            │                           │
  │  ▼                            │                           │
  │  dispatch(addNotification)    │                           │
  │  toast.success()              │                           │
  │                               │                           │
  │                               │  useSelector(unreadCount) │
  │                               │  ──► badge updates        │
  │                               │                           │
  │                               │  Click bell               │
  │                               │  ──► dropdown (10 items)  │
  │                               │                           │
  │                               │  "Mark all read"          │
  │                               │  ──► PATCH /read-all      │
  │                               │  ──► dispatch(markAllRead)│
  │                               │                           │
  │                               │                           │  Mount
  │                               │                           │  ──► GET /notifications
  │                               │                           │  ──► dispatch(setNotifications)
  │                               │                           │
  │                               │                           │  Click notification
  │                               │                           │  ──► PATCH /:id/read
  │                               │                           │  ──► dispatch(setNotifications)
  │                               │                           │
  │                               │                           │  "Mark all read"
  │                               │                           │  ──► PATCH /read-all
  │                               │                           │  ──► dispatch(markAllRead)
```

---

## Test Coverage (19 tests)

| Test File                         | Tests | What It Covers                                                                                                                                                       |
| --------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/auth.test.js`              | 11    | Register (success, duplicate, invalid), Login (email, phone, wrong pw, missing), Refresh, Profile (auth, unauth), Logout                                             |
| `tests/notifications.e2e.test.js` | 8     | Assignment notifications, session notifications, unread count, mark read, mark all read, auth guard, `notification:new` socket event, `session:created` socket event |

opencode -s ses_0cc3116bbffej3n1RWDoqBP70M
