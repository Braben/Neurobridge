# Authentication Handoffs

## Ownership

Route files under `src/app/(public)` compose authentication features in `src/features/auth`. The shared frame lives in `src/components/layouts`; buttons, fields, and OTP cells live in `src/components/ui`. HTTP transport and Redux remain in their existing locations until their separate migration.

## Pending Verification

The registration response supplies `requiresOtp`, `otpIdentifier`, and `otpChannel`. Preserve that response while profile hydration runs. Therapist administrator approval is a separate step: `isApproved: false` does not establish whether the therapist has completed account verification.

`pendingVerification.ts` keeps the pending account ID, target, and channel in tab-scoped session storage. It stores no code, password, or token. Restoration validates the record and matches the current account ID. In-memory state remains available when storage is blocked. Successful verification, explicit OTP-state cleanup, and session cleanup remove the record.

This metadata is a browser workflow aid, not an authorization mechanism. Backend authorization and ownership checks remain responsible for access. The API currently does not expose a distinct verified-contact field for therapists, so cross-device verification enforcement cannot be inferred from `isApproved`; a server-model change needs its own migration and audit.

## Regression Coverage

- `e2e/auth-handoff.spec.ts`: parent email/SMS signup, therapist signup, administrator invitation signup, retained delivery targets, rejected-code feedback, pending-account reload guards, and email/SMS signin retries.
- `e2e/auth-otp.spec.ts`: accessible keyboard editing, paste/autofill, leading zeroes, pending request locks, error recovery, completed-handoff cleanup, and desktop/mobile geometry.
- `e2e/user-flows.spec.ts`: password recovery and parent/admin workspace journeys.

All browser workflows use mocked APIs. Passing them does not verify production email/SMS delivery, database migrations, backend authorization, or complete Figma screen parity.
