BEGIN;
CREATE TABLE "AssetMaintenance" (
 "id" UUID NOT NULL, "condominiumId" UUID NOT NULL REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "assetId" UUID NOT NULL REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "recordedByUserId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "description" VARCHAR(2000) NOT NULL, "scheduledAt" TIMESTAMP(3) NOT NULL,
 "completedAt" TIMESTAMP(3), "costInCents" INTEGER CHECK ("costInCents">=0),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY("id"),
 CHECK ("completedAt" IS NULL OR "completedAt">="scheduledAt")
);
CREATE INDEX "AssetMaintenance_condominiumId_scheduledAt_idx" ON "AssetMaintenance"("condominiumId","scheduledAt");
CREATE INDEX "AssetMaintenance_assetId_scheduledAt_idx" ON "AssetMaintenance"("assetId","scheduledAt");
CREATE TABLE "AssemblyRecord" (
 "id" UUID NOT NULL, "condominiumId" UUID NOT NULL REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "noticeId" UUID NOT NULL REFERENCES "Notice"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "apartmentId" UUID NOT NULL REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "recordedByUserId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "present" BOOLEAN NOT NULL, "topic" VARCHAR(160) NOT NULL,
 "vote" VARCHAR(16) CHECK ("vote" IN ('YES','NO','ABSTAIN') OR "vote" IS NULL),
 "evidence" VARCHAR(1000) NOT NULL, "eligibleUnits" INTEGER CHECK("eligibleUnits">0),
 "voteFinalized" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY("id"),
 CHECK("present" OR "vote" IS NULL)
);
CREATE UNIQUE INDEX "AssemblyRecord_noticeId_apartmentId_topic_key" ON "AssemblyRecord"("noticeId","apartmentId","topic");
CREATE INDEX "AssemblyRecord_condominiumId_createdAt_idx" ON "AssemblyRecord"("condominiumId","createdAt");
CREATE INDEX "Package_condominiumId_receivedAt_idx" ON "Package"("condominiumId","receivedAt");
CREATE INDEX "Visitor_condominiumId_createdAt_idx" ON "Visitor"("condominiumId","createdAt");
CREATE INDEX "Reservation_condominiumId_createdAt_idx" ON "Reservation"("condominiumId","createdAt");
COMMIT;
