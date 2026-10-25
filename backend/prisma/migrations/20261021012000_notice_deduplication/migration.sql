BEGIN;
ALTER TABLE "CommunicationLog" ADD COLUMN "deduplicationKey" VARCHAR(64);
CREATE UNIQUE INDEX "CommunicationLog_deduplicationKey_key" ON "CommunicationLog"("deduplicationKey");
COMMIT;
