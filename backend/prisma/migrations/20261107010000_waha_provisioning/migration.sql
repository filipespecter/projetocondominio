-- Additive only: no condominium or connection is created or modified.
CREATE TABLE "WahaProvisioning" (
 "condominiumId" UUID NOT NULL PRIMARY KEY,
 "enabled" BOOLEAN NOT NULL DEFAULT false,
 "state" VARCHAR(32) NOT NULL DEFAULT 'NOT_ENABLED',
 "operationId" UUID NOT NULL,
 "requestedBy" UUID NOT NULL,
 "leaseId" UUID,
 "leaseExpiresAt" TIMESTAMP(3),
 "attemptCount" INTEGER NOT NULL DEFAULT 0,
 "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "errorCode" VARCHAR(64),
 "preparedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WahaProvisioning_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "WahaProvisioning_state_check" CHECK ("state" IN ('NOT_ENABLED','QUEUED','PREPARING','READY','WAITING_CAPACITY','FAILED')),
 CONSTRAINT "WahaProvisioning_attemptCount_check" CHECK ("attemptCount" >= 0)
);
CREATE UNIQUE INDEX "WahaProvisioning_operationId_key" ON "WahaProvisioning"("operationId");
CREATE INDEX "WahaProvisioning_state_nextAttemptAt_idx" ON "WahaProvisioning"("state", "nextAttemptAt");
