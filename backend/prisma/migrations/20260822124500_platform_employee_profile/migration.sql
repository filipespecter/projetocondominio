-- Central Star: ficha interna dos colaboradores da plataforma
ALTER TABLE "User"
  ADD COLUMN "platformEmployeeCode" TEXT,
  ADD COLUMN "platformJobTitle" TEXT,
  ADD COLUMN "platformDepartment" TEXT,
  ADD COLUMN "platformEmploymentType" TEXT,
  ADD COLUMN "platformStartDate" TIMESTAMP(3),
  ADD COLUMN "platformNotes" TEXT;

CREATE INDEX "User_platformEmployeeCode_idx"
  ON "User"("platformEmployeeCode");
