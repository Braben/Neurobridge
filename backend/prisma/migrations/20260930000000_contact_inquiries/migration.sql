CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED'); -- Define the inquiry lifecycle.
CREATE TABLE "ContactInquiry" ( -- Store anonymous submissions without inventing user accounts.
  "id" TEXT NOT NULL, -- Prisma supplies the UUID.
  "fullName" TEXT NOT NULL, -- Sender's submitted name.
  "email" TEXT NOT NULL, -- Normalized reply address.
  "phone" TEXT, -- Optional phone number.
  "subject" TEXT, -- Optional inquiry subject.
  "message" TEXT NOT NULL, -- Validated inquiry body.
  "status" "InquiryStatus" NOT NULL DEFAULT 'NEW', -- Default every public submission to untriaged.
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Record receipt time.
  "updatedAt" TIMESTAMP(3) NOT NULL, -- Prisma maintains the update timestamp.
  CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id") -- Uniquely address inquiries.
); -- Finish the inquiry table.
CREATE INDEX "ContactInquiry_status_createdAt_idx" ON "ContactInquiry"("status", "createdAt"); -- Support filtered inbox reads.
CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt"); -- Support chronological inbox reads.
