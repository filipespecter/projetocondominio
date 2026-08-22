-- BLOCO 07 - REGISTRO OPERACIONAL COMPESA/POCO
CREATE TABLE "OperationalRecord" (
  "id" UUID NOT NULL,
  "condominiumId" UUID NOT NULL,
  "recordDate" DATE NOT NULL,
  "recordTime" TEXT NOT NULL,
  "responsibleName" TEXT NOT NULL,
  "previousReading" DOUBLE PRECISION,
  "currentReading" DOUBLE PRECISION,
  "consumption" DOUBLE PRECISION,
  "wellStatus" TEXT NOT NULL DEFAULT 'Desligado',
  "notes" TEXT,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "OperationalRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OperationalRecord_condominiumId_recordDate_idx" ON "OperationalRecord"("condominiumId", "recordDate");
CREATE INDEX "OperationalRecord_condominiumId_wellStatus_idx" ON "OperationalRecord"("condominiumId", "wellStatus");
CREATE INDEX "OperationalRecord_deletedAt_idx" ON "OperationalRecord"("deletedAt");
ALTER TABLE "OperationalRecord" ADD CONSTRAINT "OperationalRecord_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OperationalRecord" ADD CONSTRAINT "OperationalRecord_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;