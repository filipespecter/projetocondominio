BEGIN;
ALTER TABLE "Resident" ADD COLUMN "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "TenantMessagingConfig" (
 "condominiumId" UUID PRIMARY KEY REFERENCES "Condominium"("id") ON DELETE CASCADE,
 "channel" TEXT NOT NULL DEFAULT 'EMAIL', "enabled" BOOLEAN NOT NULL DEFAULT false,
 "phoneNumberId" TEXT, "displayPhone" TEXT, "templateName" TEXT,
 "languageCode" TEXT NOT NULL DEFAULT 'pt_BR', "apiVersion" TEXT NOT NULL DEFAULT 'v23.0',
 "secrets" TEXT, "verifiedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "PackagePickupSecret" (
 "packageId" UUID PRIMARY KEY REFERENCES "Package"("id") ON DELETE CASCADE,
 "condominiumId" UUID NOT NULL REFERENCES "Condominium"("id") ON DELETE CASCADE,
 "encrypted" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PackagePickupSecret_condominiumId_idx" ON "PackagePickupSecret"("condominiumId");

UPDATE "Condominium" SET settings = settings #- '{whatsapp,token}' WHERE settings IS NOT NULL;
CREATE UNIQUE INDEX "Package_active_pickupCode_unique" ON "Package" ("condominiumId", "pickupCodeHash") WHERE "status"='RECEIVED' AND "deletedAt" IS NULL AND "pickupUsedAt" IS NULL AND "pickupCodeHash" IS NOT NULL;

COMMIT;
