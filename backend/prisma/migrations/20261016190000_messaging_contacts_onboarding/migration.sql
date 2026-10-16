BEGIN;
-- Nenhum cadastro existente é removido ou preenchido artificialmente.
-- Interrompe com segurança se o mesmo remetente já estiver associado a dois condomínios.
UPDATE "TenantMessagingConfig" SET "phoneNumberId"=NULL WHERE btrim("phoneNumberId")='';
CREATE UNIQUE INDEX "TenantMessagingConfig_phoneNumberId_key" ON "TenantMessagingConfig"("phoneNumberId");
ALTER TABLE "TenantMessagingConfig" ADD COLUMN "wabaId" TEXT,
 ADD COLUMN "onboardingStatus" TEXT NOT NULL DEFAULT 'MANUAL',
 ADD COLUMN "templateStatus" TEXT,
 ADD COLUMN "webhookSubscribed" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "Apartment_id_condominiumId_key" ON "Apartment"("id","condominiumId");
CREATE TABLE "ApartmentContact" (
 "id" UUID PRIMARY KEY, "condominiumId" UUID NOT NULL, "apartmentId" UUID NOT NULL,
 "name" TEXT NOT NULL, "email" TEXT NOT NULL, "phone" TEXT NOT NULL, "relationship" TEXT NOT NULL,
 "receiveNotices" BOOLEAN NOT NULL DEFAULT true, "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
 "canPickup" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "deletedAt" TIMESTAMP(3),
 CONSTRAINT "ApartmentContact_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT,
 CONSTRAINT "ApartmentContact_apartmentId_fkey" FOREIGN KEY ("apartmentId","condominiumId") REFERENCES "Apartment"("id","condominiumId") ON DELETE RESTRICT
);
CREATE INDEX "ApartmentContact_condominiumId_apartmentId_deletedAt_idx" ON "ApartmentContact"("condominiumId","apartmentId","deletedAt");
CREATE TABLE "MessagingConnectionAttempt" (
 "stateHash" TEXT PRIMARY KEY, "condominiumId" UUID NOT NULL REFERENCES "Condominium"("id") ON DELETE CASCADE,
 "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "expiresAt" TIMESTAMP(3) NOT NULL, "consumedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "MessagingConnectionAttempt_expiresAt_idx" ON "MessagingConnectionAttempt"("expiresAt");
COMMIT;
