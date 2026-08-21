-- Admin Figma alignment fields.
ALTER TABLE "Child"
ADD COLUMN "coExistingConditions" TEXT,
ADD COLUMN "currentMedications" TEXT;

ALTER TABLE "Resource"
ADD COLUMN "thumbnailUrl" TEXT;

ALTER TABLE "Session"
ADD COLUMN "bookingId" TEXT;

CREATE INDEX "Session_bookingId_idx" ON "Session"("bookingId");

ALTER TABLE "Session"
ADD CONSTRAINT "Session_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
