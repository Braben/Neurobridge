CREATE TYPE "OtpChannel" AS ENUM ('EMAIL', 'SMS');

ALTER TABLE "OtpCode"
ADD COLUMN "identifier" TEXT;

UPDATE "OtpCode"
SET "identifier" = "email"
WHERE "identifier" IS NULL;

ALTER TABLE "OtpCode"
ALTER COLUMN "identifier" SET NOT NULL;

ALTER TABLE "OtpCode"
ADD COLUMN "channel" "OtpChannel" NOT NULL DEFAULT 'EMAIL';

ALTER TABLE "OtpCode"
ALTER COLUMN "email" DROP NOT NULL;

CREATE INDEX "OtpCode_identifier_idx" ON "OtpCode"("identifier");
CREATE INDEX "OtpCode_identifier_channel_type_idx" ON "OtpCode"("identifier", "channel", "type");
