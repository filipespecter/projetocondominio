ALTER TABLE "User" ADD COLUMN "securityVersion" INTEGER NOT NULL DEFAULT 1;
CREATE TABLE "AuthSession" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "tokenFamilyId" UUID NOT NULL,
  "refreshTokenHash" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3), "revokeReason" TEXT, "ipAddress" TEXT, "userAgent" TEXT,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AuthSession_refreshTokenHash_key" ON "AuthSession"("refreshTokenHash");
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");
CREATE INDEX "AuthSession_tokenFamilyId_idx" ON "AuthSession"("tokenFamilyId");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
