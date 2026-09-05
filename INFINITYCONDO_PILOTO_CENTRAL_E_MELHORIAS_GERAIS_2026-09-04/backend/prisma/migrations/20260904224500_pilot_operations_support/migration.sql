CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "condominiumId" UUID NOT NULL,
  "openedByUserId" UUID NOT NULL,
  "assignedToUserId" UUID,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'GERAL',
  "priority" TEXT NOT NULL DEFAULT 'MEDIA',
  "status" TEXT NOT NULL DEFAULT 'ABERTA',
  "impact" TEXT,
  "attachmentUrl" TEXT,
  "response" TEXT,
  "resolutionSummary" TEXT,
  "firstResponseAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_code_key" ON "SupportTicket"("code");
CREATE INDEX IF NOT EXISTS "SupportTicket_condominiumId_status_createdAt_idx" ON "SupportTicket"("condominiumId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_priority_status_createdAt_idx" ON "SupportTicket"("priority", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_openedByUserId_createdAt_idx" ON "SupportTicket"("openedByUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_assignedToUserId_status_idx" ON "SupportTicket"("assignedToUserId", "status");
DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
