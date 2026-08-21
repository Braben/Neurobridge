# Neurobridge — Database Design

> **Database:** PostgreSQL (Neon Serverless)  
> **ORM:** Prisma 7  
> **Schema:** `backend/prisma/schema.prisma`  
> **Migrations Applied:** 3 (Initial: Firebase-based → Rewrite: all domain models → Fix: nullable areaofexpertise)

---

## Entity-Relationship Overview

```
User ──┬── ChildParent ──── Child
       ├── TherapistAssignment ── Child
       ├── Session ────────────── Child
       ├── Goal ──────────────── Child
       ├── Message ───────────── Conversation ── ConversationParticipant ── User
       ├── Notification
       └── createdGoals (Goal)

Child ──┬── IntakeForm
        ├── Goal
        ├── Session ─── SessionNote
        ├── Behaviour ─── BehaviourLog
        ├── ChildParent ──── User (Parent)
        └── TherapistAssignment ── User (Therapist)
```

---

## Enums

### UserRole
| Value | Description |
|-------|-------------|
| `ADMIN` | Platform administrator (Live Well team) |
| `PARENT` | Parent/guardian of a child |
| `THERAPIST` | Therapist providing services |

### Gender
| Value | Description |
|-------|-------------|
| `MALE` | — |
| `FEMALE` | — |
| `OTHER` | — |

### GoalStatus
| Value | Description |
|-------|-------------|
| `NOT_STARTED` | Goal created but work hasn't begun |
| `IN_PROGRESS` | Actively being worked on |
| `ACHIEVED` | Goal successfully met |
| `ARCHIVED` | No longer relevant/deprecated |

### OtpType
| Value | Description |
|-------|-------------|
| `EMAIL_VERIFICATION` | Sent during registration to verify email ownership |
| `PASSWORD_RESET` | Sent for forgotten password recovery |

---

## Models

### User

Core identity for all platform roles (Admin, Parent, Therapist).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| firstName | String | required | — |
| lastName | String | required | — |
| email | String | **unique**, required | Login identifier |
| phone | String | **unique**, required | Ghana phone number |
| areaofexpertise | String? | nullable | Required for THERAPIST; ignored for PARENT/ADMIN. Enforced at application layer |
| password | String | required | bcrypt hashed |
| refreshToken | String? | nullable | JWT refresh token (opaque) |
| role | UserRole | required | ADMIN / PARENT / THERAPIST |
| avatar | String? | nullable | Cloudinary URL |
| isApproved | Boolean | default false | Auto-approved for PARENT; Therapists need admin approval |
| createdAt | DateTime | default now() | — |
| updatedAt | DateTime | @updatedAt | Auto-managed by Prisma |
| deletedAt | DateTime? | nullable | Soft delete |

**Indexes:** `email`, `role`

**Relations:**
- `children` → ChildParent[] (as parent)
- `therapistAssignments` → TherapistAssignment[] (as therapist)
- `sessions` → Session[] (as therapist, relation name "TherapistSessions")
- `createdGoals` → Goal[] (as creator, relation name "GoalCreator")
- `sentMessages` → Message[] (as sender, relation name "UserMessages")
- `conversationParticipants` → ConversationParticipant[]
- `notifications` → Notification[]

---

### Child

A child receiving therapy services. This is the central entity that most features revolve around.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| firstName | String | required | — |
| lastName | String | required | — |
| dateOfBirth | DateTime | required | Used for age calculation |
| gender | Gender | required | MALE / FEMALE / OTHER |
| diagnosis | String? | nullable | Medical/developmental diagnosis |
| school | String? | nullable | School the child attends |
| notes | String? | nullable | Free-text notes |
| createdAt | DateTime | default now() | — |
| updatedAt | DateTime | @updatedAt | — |
| deletedAt | DateTime? | nullable | Soft delete |

**Indexes:** `lastName`

**Relations:**
- `parents` → ChildParent[]
- `therapists` → TherapistAssignment[]
- `intakeForm` → IntakeForm? (one-to-one)
- `goals` → Goal[]
- `sessions` → Session[]
- `behaviours` → Behaviour[]

---

### ChildParent

Join table linking a Child to their Parent(s). Supports multiple parents/guardians.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| childId | String | FK → Child.id | — |
| parentId | String | FK → User.id | Must be role=PARENT |
| relationship | String? | nullable | e.g., "Mother", "Father", "Guardian" |

**Unique constraint:** `[childId, parentId]` — prevents duplicate assignments

---

### TherapistAssignment

Join table linking a Child to a Therapist. Supports multiple therapists per child.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| childId | String | FK → Child.id | — |
| therapistId | String | FK → User.id | Must be role=THERAPIST |
| assignedAt | DateTime | default now() | Timestamp of assignment |

**Unique constraint:** `[childId, therapistId]` — prevents duplicate assignments

---

### IntakeForm

One-time intake assessment for a child. One-to-one with Child.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| childId | String | **unique**, FK → Child.id | One form per child |
| developmentalHistory | String | required | Child's developmental milestones/concerns |
| behaviourConcerns | String | required | Observed behavioural issues |
| parentGoals | String | required | What the parent hopes to achieve |

---

### Goal

Therapeutic goal set for a child, tracked through to completion.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| childId | String | FK → Child.id | — |
| title | String | required | Short goal statement |
| description | String | required | Detailed goal description |
| status | GoalStatus | default NOT_STARTED | IN_PROGRESS → ACHIEVED → ARCHIVED |
| createdById | String | FK → User.id | Who created the goal |
| createdAt | DateTime | default now() | — |

**Indexes:** `childId`

---

### Session

A therapy session conducted with a child by a therapist.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| childId | String | FK → Child.id | — |
| therapistId | String | FK → User.id | Session therapist |
| sessionDate | DateTime | required | When the session occurred |
| duration | Int? | nullable | Duration in minutes |
| createdAt | DateTime | default now() | Record creation timestamp |

**Indexes:** `childId`, `therapistId`, `sessionDate`

---

### SessionNote

Clinical notes attached to a therapy session. One-to-one with Session.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| sessionId | String | **unique**, FK → Session.id | One note per session |
| goalsWorkedOn | String | required | Which goals were addressed |
| observations | String | required | Therapist observations |
| recommendations | String | required | Next steps / recommendations |

---

### Behaviour

A tracked behaviour for a child (e.g., "Aggression", "Self-stimulation", "Eye contact").

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| childId | String | FK → Child.id | — |
| name | String | required | Behaviour name |
| description | String? | nullable | Optional description/definition |

**Indexes:** `childId`

---

### BehaviourLog

A frequency log entry for a specific behaviour at a specific time.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| behaviourId | String | FK → Behaviour.id | — |
| frequency | Int | required | Count/frequency value |
| notes | String? | nullable | Contextual notes |
| recordedAt | DateTime | required | When the observation was made |

**Indexes:** `recordedAt`

---

### Conversation

A chat thread between participants (typically Parent ↔ Therapist).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| createdAt | DateTime | default now() | — |

---

### ConversationParticipant

Join table linking Users to Conversations. Supports group conversations.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| conversationId | String | FK → Conversation.id | — |
| userId | String | FK → User.id | — |

**Unique constraint:** `[conversationId, userId]`

---

### Message

Individual message within a conversation.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| conversationId | String | FK → Conversation.id | — |
| senderId | String | FK → User.id | Message author |
| content | String | required | Message body |
| isRead | Boolean | default false | Read receipt |
| createdAt | DateTime | default now() | — |

**Indexes:** `conversationId`, `senderId`

---

### OtpCode

One-time password for email verification and password reset flows.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| email | String | required | Email address the OTP was sent to |
| code | String | required | 6-digit numeric OTP (or alphanumeric) |
| type | OtpType | required | EMAIL_VERIFICATION / PASSWORD_RESET |
| expiresAt | DateTime | required | Typically TTL = 10 minutes |
| isUsed | Boolean | default false | Mark true once consumed |
| createdAt | DateTime | default now() | — |
| usedAt | DateTime? | nullable | Timestamp of consumption |

**Indexes:** `email`, `code` (for lookup), `[email, type]`

### Notification

In-app notification for a user.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid() | — |
| userId | String | FK → User.id | Notification recipient |
| title | String | required | Notification title |
| body | String | required | Notification body |
| isRead | Boolean | default false | Read status |
| createdAt | DateTime | default now() | — |

**Indexes:** `userId`

---

## Relationships Summary

| Type | Count | Examples |
|------|-------|---------|
| One-to-One | 2 | Child ↔ IntakeForm, Session ↔ SessionNote |
| One-to-Many | 8 | Child → Goal, Child → Session, Child → Behaviour, Behaviour → BehaviourLog, User → Notification, Conversation → Message, User → Message (sender), User → Goal (creator) |
| Many-to-Many | 3 | Child ↔ User (Parent) via ChildParent, Child ↔ User (Therapist) via TherapistAssignment, User ↔ Conversation via ConversationParticipant |

---

## Planned Schema Additions

The following model needs to be added to `schema.prisma` (pending implementation):

### OtpCode (to be added)

```prisma
// Enum: defines the purpose of an OTP code
enum OtpType {
  EMAIL_VERIFICATION // Sent during registration to verify email ownership
  PASSWORD_RESET     // Sent for forgotten password recovery
}

// Model: tracks one-time passwords sent for email verification and password reset
model OtpCode {
  id        String   @id @default(uuid()) // Primary key
  email     String                        // Recipient email address
  code      String                        // 6-digit OTP code (stored as hashed value)
  type      OtpType                       // Purpose: EMAIL_VERIFICATION or PASSWORD_RESET
  expiresAt DateTime                      // TTL — codes expire after 10 minutes
  isUsed    Boolean  @default(false)      // Whether the code has been consumed
  createdAt DateTime @default(now())      // Timestamp when the code was generated
  usedAt    DateTime?                      // Timestamp when the code was consumed (nullable)

  @@index([email])          // Fast lookup of all codes sent to an email
  @@index([code])           // Fast lookup by code value during verification
  @@index([email, type])    // Composite index for "get latest unused code of type X for email Y"
}
```

---

## Key Design Decisions

1. **UUID primary keys** — avoids sequential ID enumeration, better for distributed systems and Neon branching
2. **Soft delete** (`deletedAt`) — on User and Child — data is clinically sensitive, hard deletes are risky
3. **isApproved on User** — Therapists require admin approval before they can interact; Parents auto-approved
4. **Refresh token in DB** — enables server-side token revocation; stored opaque (not JWT) for security
5. **Login by email OR phone** — the login endpoint accepts either `email` or `phone` as the identifier. The backend detects which was provided and queries the `User` model by the matching unique field. Both are unique (`@unique`) so lookup is O(1).
6. **Email OTP verification** — on registration, an OTP code is sent to the user's email. The account (`isApproved`) is set to `true` only after OTP verification succeeds. OTP codes are 6 digits, expire in 10 minutes, and are consumed on use. Separate `OtpType` for password reset flow.
7. **areaofexpertise role-gated** — this field is `required` when registering as THERAPIST but entirely `ignored` for PARENT/ADMIN. Enforced at the application layer (controller validation) rather than the database, since Prisma's `String?` allows null. This avoids needing separate schemas per role.
9. **Separate Behaviour + BehaviourLog** — behaviours are defined once and logged many times, enabling trend analysis
10. **SessionNote separate from Session** — notes may be added/edited independently of session metadata; keeps querying lightweight
11. **Conversation model** — designed for extensibility (future group chats: parent + multiple therapists)

---

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| `20260604032830_init` | Jun 4 | Firebase-based User model (firebaseId, etc.) |
| `20260619171421_init` | Jun 19 | Full rewrite: removed Firebase, added password auth, all domain models |
| `20260619173024_init` | Jun 19 | Fixed areaofexpertise to be nullable |
