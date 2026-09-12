-- Melhorias 2026-09-12: prestadores particulares solicitados por moradores,
-- supervisão de sessões da portaria e flexibilização de fornecedores/contratos.
-- Migration incremental: preserva todos os dados existentes.

CREATE TYPE "PrivateServiceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');
CREATE TYPE "UserSessionEndReason" AS ENUM ('LOGOUT', 'NEW_LOGIN', 'ADMIN_END', 'EXPIRED');

ALTER TABLE "Supplier"
  ADD COLUMN "entityType" TEXT NOT NULL DEFAULT 'COMPANY';

ALTER TABLE "Contract"
  ADD COLUMN "contractKind" TEXT NOT NULL DEFAULT 'CONTRACT',
  ALTER COLUMN "endDate" DROP NOT NULL;

CREATE TABLE "PrivateServiceRequest" (
  "id" UUID NOT NULL,
  "condominiumId" UUID NOT NULL,
  "residentId" UUID NOT NULL,
  "apartmentId" UUID NOT NULL,
  "requesterUserId" UUID NOT NULL,
  "reviewedByUserId" UUID,
  "serviceProviderId" UUID,
  "providerAccessId" UUID,
  "providerName" TEXT NOT NULL,
  "providerDocument" TEXT,
  "providerPhone" TEXT,
  "providerCompany" TEXT,
  "serviceType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "scheduledDate" DATE NOT NULL,
  "scheduledStartTime" TEXT NOT NULL,
  "scheduledEndTime" TEXT,
  "notes" TEXT,
  "status" "PrivateServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewNotes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PrivateServiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrivateServiceRequest_providerAccessId_key"
  ON "PrivateServiceRequest"("providerAccessId");
CREATE INDEX "PrivateServiceRequest_condominiumId_status_scheduledDate_idx"
  ON "PrivateServiceRequest"("condominiumId", "status", "scheduledDate");
CREATE INDEX "PrivateServiceRequest_residentId_createdAt_idx"
  ON "PrivateServiceRequest"("residentId", "createdAt");
CREATE INDEX "PrivateServiceRequest_apartmentId_scheduledDate_idx"
  ON "PrivateServiceRequest"("apartmentId", "scheduledDate");
CREATE INDEX "PrivateServiceRequest_requesterUserId_createdAt_idx"
  ON "PrivateServiceRequest"("requesterUserId", "createdAt");
CREATE INDEX "PrivateServiceRequest_deletedAt_idx"
  ON "PrivateServiceRequest"("deletedAt");

ALTER TABLE "PrivateServiceRequest"
  ADD CONSTRAINT "PrivateServiceRequest_condominiumId_fkey"
  FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrivateServiceRequest"
  ADD CONSTRAINT "PrivateServiceRequest_residentId_fkey"
  FOREIGN KEY ("residentId") REFERENCES "Resident"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrivateServiceRequest"
  ADD CONSTRAINT "PrivateServiceRequest_apartmentId_fkey"
  FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrivateServiceRequest"
  ADD CONSTRAINT "PrivateServiceRequest_requesterUserId_fkey"
  FOREIGN KEY ("requesterUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PrivateServiceRequest"
  ADD CONSTRAINT "PrivateServiceRequest_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrivateServiceRequest"
  ADD CONSTRAINT "PrivateServiceRequest_serviceProviderId_fkey"
  FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PrivateServiceRequest"
  ADD CONSTRAINT "PrivateServiceRequest_providerAccessId_fkey"
  FOREIGN KEY ("providerAccessId") REFERENCES "ProviderAccess"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "UserSession" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "condominiumId" UUID,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "endReason" "UserSessionEndReason",
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserSession_userId_startedAt_idx" ON "UserSession"("userId", "startedAt");
CREATE INDEX "UserSession_condominiumId_startedAt_idx" ON "UserSession"("condominiumId", "startedAt");
CREATE INDEX "UserSession_userId_endedAt_idx" ON "UserSession"("userId", "endedAt");
ALTER TABLE "UserSession"
  ADD CONSTRAINT "UserSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSession"
  ADD CONSTRAINT "UserSession_condominiumId_fkey"
  FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
