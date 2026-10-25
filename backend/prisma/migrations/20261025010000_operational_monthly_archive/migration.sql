ALTER TABLE "Package" ADD COLUMN "operationalArchivedAt" TIMESTAMP(3);
ALTER TABLE "Visitor" ADD COLUMN "operationalArchivedAt" TIMESTAMP(3);
CREATE INDEX "Package_condominiumId_operationalArchivedAt_createdAt_idx" ON "Package"("condominiumId", "operationalArchivedAt", "createdAt");
CREATE INDEX "Visitor_condominiumId_operationalArchivedAt_createdAt_idx" ON "Visitor"("condominiumId", "operationalArchivedAt", "createdAt");
