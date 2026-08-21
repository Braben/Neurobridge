-- Add user sign-up fields and allow the design's single email/phone identifier.
ALTER TABLE "User" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;
