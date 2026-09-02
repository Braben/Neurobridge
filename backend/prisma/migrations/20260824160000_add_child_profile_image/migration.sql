-- Add a persisted profile image URL for child profiles created from the
-- parent dashboard onboarding flow.
ALTER TABLE "Child" ADD COLUMN "profileImage" TEXT;
