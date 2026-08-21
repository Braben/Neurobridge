-- Persist the "Extra Notes" field shown in the Figma therapist/parent session-note flow.
ALTER TABLE "SessionNote"
  ADD COLUMN IF NOT EXISTS "extraNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
