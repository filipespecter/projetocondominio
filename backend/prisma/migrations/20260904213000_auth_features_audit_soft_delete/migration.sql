-- Recuperacao segura de senha por codigo temporario
CREATE TABLE IF NOT EXISTS "PasswordResetCode" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetCode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PasswordResetCode_userId_expiresAt_idx" ON "PasswordResetCode"("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "PasswordResetCode_createdAt_idx" ON "PasswordResetCode"("createdAt");

-- Auditoria nao e destruida fisicamente: exclusao na Central apenas arquiva/oculta, preservando rastreabilidade.
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "deletedByUserId" UUID;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT;
CREATE INDEX IF NOT EXISTS "AuditLog_deletedAt_idx" ON "AuditLog"("deletedAt");
