-- Pacote funcional 2026-09-10: Documentos, convites QR de visitantes,
-- ativos/equipamentos, fornecedores, contratos e assembleias em Avisos.
-- Migration incremental: não remove nem recria dados existentes.

CREATE TYPE "NoticeType" AS ENUM ('NOTICE', 'ASSEMBLY');
CREATE TYPE "DocumentVisibility" AS ENUM ('MANAGERS_ONLY', 'RESIDENTS', 'DOORMEN', 'ALL');
CREATE TYPE "VisitorInvitationStatus" AS ENUM ('WAITING', 'AUTHORIZED', 'USED', 'EXPIRED', 'CANCELED');
CREATE TYPE "AssetStatus" AS ENUM ('OPERATIONAL', 'MAINTENANCE', 'DEFECTIVE', 'INACTIVE', 'REPLACED');
CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRES_SOON', 'EXPIRED', 'CLOSED', 'CANCELED');

ALTER TABLE "Visitor"
  ADD COLUMN "invitedByResidentId" UUID,
  ADD COLUMN "invitationTokenHash" TEXT,
  ADD COLUMN "invitationGeneratedAt" TIMESTAMP(3),
  ADD COLUMN "invitationValidFrom" TIMESTAMP(3),
  ADD COLUMN "invitationValidUntil" TIMESTAMP(3),
  ADD COLUMN "invitationUsedAt" TIMESTAMP(3),
  ADD COLUMN "invitationCanceledAt" TIMESTAMP(3),
  ADD COLUMN "invitationStatus" "VisitorInvitationStatus";

CREATE UNIQUE INDEX "Visitor_invitationTokenHash_key" ON "Visitor"("invitationTokenHash");
CREATE INDEX "Visitor_condominiumId_invitationStatus_invitationValidUntil_idx"
  ON "Visitor"("condominiumId", "invitationStatus", "invitationValidUntil");
CREATE INDEX "Visitor_invitedByResidentId_createdAt_idx"
  ON "Visitor"("invitedByResidentId", "createdAt");

ALTER TABLE "Visitor"
  ADD CONSTRAINT "Visitor_invitedByResidentId_fkey"
  FOREIGN KEY ("invitedByResidentId") REFERENCES "Resident"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notice"
  ADD COLUMN "type" "NoticeType" NOT NULL DEFAULT 'NOTICE',
  ADD COLUMN "agenda" TEXT,
  ADD COLUMN "eventDate" DATE,
  ADD COLUMN "eventTime" TEXT,
  ADD COLUMN "eventLocation" TEXT,
  ADD COLUMN "eventModality" TEXT,
  ADD COLUMN "attachments" JSONB;

CREATE INDEX "Notice_condominiumId_type_eventDate_idx"
  ON "Notice"("condominiumId", "type", "eventDate");

CREATE TABLE "CondominiumDocument" (
  "id" UUID NOT NULL,
  "condominiumId" UUID NOT NULL,
  "uploadedByUserId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "visibility" "DocumentVisibility" NOT NULL DEFAULT 'MANAGERS_ONLY',
  "documentDate" DATE,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CondominiumDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CondominiumDocument_condominiumId_visibility_createdAt_idx"
  ON "CondominiumDocument"("condominiumId", "visibility", "createdAt");
CREATE INDEX "CondominiumDocument_condominiumId_category_idx"
  ON "CondominiumDocument"("condominiumId", "category");
CREATE INDEX "CondominiumDocument_uploadedByUserId_idx"
  ON "CondominiumDocument"("uploadedByUserId");
CREATE INDEX "CondominiumDocument_deletedAt_idx"
  ON "CondominiumDocument"("deletedAt");

ALTER TABLE "CondominiumDocument"
  ADD CONSTRAINT "CondominiumDocument_condominiumId_fkey"
  FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CondominiumDocument"
  ADD CONSTRAINT "CondominiumDocument_uploadedByUserId_fkey"
  FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Supplier" (
  "id" UUID NOT NULL,
  "condominiumId" UUID NOT NULL,
  "legalName" TEXT NOT NULL,
  "tradeName" TEXT,
  "document" TEXT,
  "contactName" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "email" TEXT,
  "address" TEXT,
  "serviceType" TEXT,
  "notes" TEXT,
  "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Supplier_condominiumId_document_key"
  ON "Supplier"("condominiumId", "document");
CREATE INDEX "Supplier_condominiumId_status_idx"
  ON "Supplier"("condominiumId", "status");
CREATE INDEX "Supplier_condominiumId_legalName_idx"
  ON "Supplier"("condominiumId", "legalName");
CREATE INDEX "Supplier_deletedAt_idx" ON "Supplier"("deletedAt");
ALTER TABLE "Supplier"
  ADD CONSTRAINT "Supplier_condominiumId_fkey"
  FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Asset" (
  "id" UUID NOT NULL,
  "condominiumId" UUID NOT NULL,
  "supplierId" UUID,
  "responsibleUserId" UUID,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "assetTag" TEXT,
  "manufacturer" TEXT,
  "model" TEXT,
  "serialNumber" TEXT,
  "location" TEXT,
  "acquiredAt" DATE,
  "warrantyUntil" DATE,
  "status" "AssetStatus" NOT NULL DEFAULT 'OPERATIONAL',
  "notes" TEXT,
  "attachmentFileName" TEXT,
  "attachmentFilePath" TEXT,
  "attachmentMimeType" TEXT,
  "attachmentFileSize" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Asset_condominiumId_assetTag_key"
  ON "Asset"("condominiumId", "assetTag");
CREATE INDEX "Asset_condominiumId_status_idx" ON "Asset"("condominiumId", "status");
CREATE INDEX "Asset_condominiumId_category_idx" ON "Asset"("condominiumId", "category");
CREATE INDEX "Asset_supplierId_idx" ON "Asset"("supplierId");
CREATE INDEX "Asset_deletedAt_idx" ON "Asset"("deletedAt");
ALTER TABLE "Asset"
  ADD CONSTRAINT "Asset_condominiumId_fkey"
  FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asset"
  ADD CONSTRAINT "Asset_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Asset"
  ADD CONSTRAINT "Asset_responsibleUserId_fkey"
  FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Contract" (
  "id" UUID NOT NULL,
  "condominiumId" UUID NOT NULL,
  "supplierId" UUID NOT NULL,
  "responsibleUserId" UUID,
  "serviceType" TEXT NOT NULL,
  "reference" TEXT,
  "description" TEXT NOT NULL,
  "valueInCents" INTEGER,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "autoRenew" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "expirationAlertSentAt" TIMESTAMP(3),
  "documentFileName" TEXT,
  "documentFilePath" TEXT,
  "documentMimeType" TEXT,
  "documentFileSize" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Contract_condominiumId_status_endDate_idx"
  ON "Contract"("condominiumId", "status", "endDate");
CREATE INDEX "Contract_condominiumId_supplierId_idx"
  ON "Contract"("condominiumId", "supplierId");
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");
CREATE INDEX "Contract_condominiumId_expirationAlertSentAt_endDate_idx"
  ON "Contract"("condominiumId", "expirationAlertSentAt", "endDate");
CREATE INDEX "Contract_deletedAt_idx" ON "Contract"("deletedAt");
ALTER TABLE "Contract"
  ADD CONSTRAINT "Contract_condominiumId_fkey"
  FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract"
  ADD CONSTRAINT "Contract_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract"
  ADD CONSTRAINT "Contract_responsibleUserId_fkey"
  FOREIGN KEY ("responsibleUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
