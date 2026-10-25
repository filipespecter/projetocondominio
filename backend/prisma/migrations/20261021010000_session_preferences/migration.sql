BEGIN;
ALTER TABLE "User" ADD COLUMN "idleTimeoutMinutes" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "User" ADD CONSTRAINT "User_idleTimeoutMinutes_check" CHECK ("idleTimeoutMinutes" IN (15,30,45,60));
ALTER TABLE "AuthSession" ADD COLUMN "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- Existing sessions have no reliable interaction history. Reauthentication is required once.
UPDATE "AuthSession" SET "lastInteractionAt"="createdAt", "revokedAt"=CURRENT_TIMESTAMP,"revokeReason"='SESSION_POLICY_UPGRADE' WHERE "revokedAt" IS NULL;
ALTER TABLE "UserSession" ADD COLUMN "authSessionId" UUID;
CREATE UNIQUE INDEX "UserSession_authSessionId_key" ON "UserSession"("authSessionId");
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_authSessionId_fkey" FOREIGN KEY ("authSessionId") REFERENCES "AuthSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;
