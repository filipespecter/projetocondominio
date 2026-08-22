-- BLOCO 05A - QR/CODIGO DE RETIRADA + DOCUMENTO DE MORADOR

-- 1) Documento individual do usuario/morador.
ALTER TABLE "User"
ADD COLUMN "document" TEXT;

CREATE INDEX "User_condominiumId_document_idx"
ON "User"("condominiumId", "document");

-- 2) Tipos do fluxo de retirada.
CREATE TYPE "PackagePickupMethod"
AS ENUM ('QR', 'CODE');

CREATE TYPE "PackagePickupPersonType"
AS ENUM (
  'PRIMARY_RESIDENT',
  'DEPENDENT_RESIDENT',
  'OTHER_PERSON'
);

-- 3) Dados seguros da credencial e auditoria da retirada.
ALTER TABLE "Package"
ADD COLUMN "pickupTokenHash" TEXT,
ADD COLUMN "pickupCodeHash" TEXT,
ADD COLUMN "pickupGeneratedAt" TIMESTAMP(3),
ADD COLUMN "pickupUsedAt" TIMESTAMP(3),
ADD COLUMN "pickupMethod" "PackagePickupMethod",
ADD COLUMN "pickupPersonType" "PackagePickupPersonType",
ADD COLUMN "pickupResidentId" UUID,
ADD COLUMN "withdrawnDocument" TEXT,
ADD COLUMN "withdrawnResidentBlock" TEXT,
ADD COLUMN "withdrawnResidentApartment" TEXT;

CREATE INDEX "Package_pickupTokenHash_idx"
ON "Package"("pickupTokenHash");

CREATE INDEX "Package_pickupCodeHash_idx"
ON "Package"("pickupCodeHash");

CREATE INDEX "Package_pickupResidentId_idx"
ON "Package"("pickupResidentId");

ALTER TABLE "Package"
ADD CONSTRAINT "Package_pickupResidentId_fkey"
FOREIGN KEY ("pickupResidentId")
REFERENCES "Resident"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
