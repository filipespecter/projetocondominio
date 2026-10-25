BEGIN;
CREATE TABLE "ShiftHandover" (
"id" UUID PRIMARY KEY, "condominiumId" UUID NOT NULL REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"createdByUserId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"title" VARCHAR(160) NOT NULL,"notes" VARCHAR(4000) NOT NULL,"priority" VARCHAR(10) NOT NULL DEFAULT 'NORMAL',
"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"resolvedAt" TIMESTAMP(3),"resolvedByUserId" UUID REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
CONSTRAINT "ShiftHandover_priority_check" CHECK ("priority" IN ('NORMAL','HIGH')));
CREATE INDEX "ShiftHandover_condominiumId_createdAt_idx" ON "ShiftHandover"("condominiumId","createdAt");
CREATE INDEX "ShiftHandover_condominiumId_resolvedAt_idx" ON "ShiftHandover"("condominiumId","resolvedAt");
CREATE TABLE "ShiftHandoverAck" ("id" UUID PRIMARY KEY,"handoverId" UUID NOT NULL REFERENCES "ShiftHandover"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
"userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,"acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "ShiftHandoverAck_handoverId_userId_key" ON "ShiftHandoverAck"("handoverId","userId");
COMMIT;
