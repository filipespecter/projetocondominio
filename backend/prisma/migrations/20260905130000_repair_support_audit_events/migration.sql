-- Reparo idempotente do piloto: auditoria, suporte e eventos.
-- Esta migration não remove dados de negócio. Ela apenas garante o schema
-- esperado pela versão do piloto e retira do catálogo comercial recursos
-- que ainda não fazem parte do produto entregue.

DO $$
BEGIN
  CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED','CLOSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" UUID NOT NULL,
  "condominiumId" UUID NOT NULL,
  "openedByUserId" UUID NOT NULL,
  "assignedToUserId" UUID,
  "ticketNumber" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "resolution" TEXT,
  "metadata" JSONB,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "firstResponseAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "assignedToUserId" UUID;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "resolution" TEXT;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "firstResponseAt" TIMESTAMP(3);
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");
CREATE INDEX IF NOT EXISTS "SupportTicket_condominiumId_status_openedAt_idx" ON "SupportTicket"("condominiumId","status","openedAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_priority_status_openedAt_idx" ON "SupportTicket"("priority","status","openedAt");
CREATE INDEX IF NOT EXISTS "SupportTicket_assignedToUserId_status_idx" ON "SupportTicket"("assignedToUserId","status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicket_condominiumId_fkey') THEN
    ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_condominiumId_fkey"
      FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicket_openedByUserId_fkey') THEN
    ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_openedByUserId_fkey"
      FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SupportTicket_assignedToUserId_fkey') THEN
    ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToUserId_fkey"
      FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Campos usados pela auditoria com exclusão lógica. O IF NOT EXISTS corrige
-- bancos de homologação que já marcaram uma migration antiga como aplicada.
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "deletedByUserId" UUID;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT;
CREATE INDEX IF NOT EXISTS "AuditLog_deletedAt_idx" ON "AuditLog"("deletedAt");

-- Resolução profissional de eventos técnicos.
ALTER TABLE "SystemEvent" ADD COLUMN IF NOT EXISTS "resolutionAction" TEXT;
ALTER TABLE "SystemEvent" ADD COLUMN IF NOT EXISTS "resolutionComment" TEXT;

-- IA não faz parte do piloto comercial. Preservamos o registro antigo apenas
-- como dado arquivado e removemos qualquer vínculo com planos visíveis.
DELETE FROM "PlanFeature"
WHERE "featureId" IN (
  SELECT "id" FROM "Feature" WHERE "code" = 'AI_ASSISTANT'
);

UPDATE "Feature"
SET "active" = FALSE,
    "deletedAt" = COALESCE("deletedAt", CURRENT_TIMESTAMP),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'AI_ASSISTANT';
