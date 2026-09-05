ALTER TABLE "Package" ADD COLUMN "deliveryProofFilePath" TEXT;
ALTER TABLE "Package" ADD COLUMN "deliveryProofMimeType" TEXT;

CREATE TABLE "ExpenseCategory" (
  "id" UUID NOT NULL,
  "condominiumId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Expense" (
  "id" UUID NOT NULL,
  "condominiumId" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  "expenseDate" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "supplier" TEXT,
  "paymentMethod" TEXT,
  "amountInCents" INTEGER NOT NULL,
  "notes" TEXT,
  "receiptFilePath" TEXT,
  "receiptMimeType" TEXT,
  "createdByUserId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExpenseCategory_condominiumId_name_key" ON "ExpenseCategory"("condominiumId", "name");
CREATE INDEX "ExpenseCategory_condominiumId_active_idx" ON "ExpenseCategory"("condominiumId", "active");
CREATE INDEX "ExpenseCategory_deletedAt_idx" ON "ExpenseCategory"("deletedAt");
CREATE INDEX "Expense_condominiumId_expenseDate_idx" ON "Expense"("condominiumId", "expenseDate");
CREATE INDEX "Expense_condominiumId_categoryId_idx" ON "Expense"("condominiumId", "categoryId");
CREATE INDEX "Expense_deletedAt_idx" ON "Expense"("deletedAt");
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
