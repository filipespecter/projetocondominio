CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED','CLOSED');
CREATE TABLE "SupportTicket" (
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");
CREATE INDEX "SupportTicket_condominiumId_status_openedAt_idx" ON "SupportTicket"("condominiumId","status","openedAt");
CREATE INDEX "SupportTicket_priority_status_openedAt_idx" ON "SupportTicket"("priority","status","openedAt");
CREATE INDEX "SupportTicket_assignedToUserId_status_idx" ON "SupportTicket"("assignedToUserId","status");
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
