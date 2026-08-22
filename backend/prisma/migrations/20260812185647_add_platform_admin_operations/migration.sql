-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'PIX', 'BOLETO');

-- CreateEnum
CREATE TYPE "PaymentMethodPriority" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "PaymentMethodStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'FAILED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED', 'REFUNDED', 'CHARGEBACK', 'ERROR');

-- CreateEnum
CREATE TYPE "SupportSessionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "JobExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "BackupTrigger" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "SystemEventSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- AlterEnum
ALTER TYPE "CondominiumStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "supportSessionId" UUID;

-- AlterTable
ALTER TABLE "Condominium" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByUserId" UUID,
ADD COLUMN     "platformNotes" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedByUserId" UUID,
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "autoSuspend" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "billingContactName" TEXT,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "billingPhone" TEXT,
ADD COLUMN     "dueDay" INTEGER,
ADD COLUMN     "gracePeriodDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "lastPaymentAt" TIMESTAMP(3),
ADD COLUMN     "nextDueDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "priority" "PaymentMethodPriority" NOT NULL,
    "status" "PaymentMethodStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" TEXT,
    "providerCustomerId" TEXT,
    "providerPaymentMethodId" TEXT,
    "providerReference" TEXT,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "cardExpirationMonth" INTEGER,
    "cardExpirationYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "paymentMethodId" UUID,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "amountInCents" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "provider" TEXT,
    "providerChargeId" TEXT,
    "requestId" TEXT,
    "paymentUrl" TEXT,
    "boletoBarcode" TEXT,
    "pixCopyPaste" TEXT,
    "paidAt" TIMESTAMP(3),
    "overdueAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL,
    "chargeId" UUID NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amountInCents" INTEGER NOT NULL,
    "provider" TEXT,
    "providerPaymentId" TEXT,
    "requestId" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportSession" (
    "id" UUID NOT NULL,
    "platformAdminUserId" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "status" "SupportSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT NOT NULL,
    "requestId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationLog" (
    "id" UUID NOT NULL,
    "condominiumId" UUID,
    "recipientUserId" UUID,
    "channel" "CommunicationChannel" NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "templateCode" TEXT,
    "contentSnapshot" TEXT,
    "module" TEXT,
    "referenceId" TEXT,
    "requestId" TEXT,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "lastError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" UUID NOT NULL,
    "condominiumId" UUID,
    "jobName" TEXT NOT NULL,
    "status" "JobExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "requestId" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" UUID NOT NULL,
    "createdByUserId" UUID,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "trigger" "BackupTrigger" NOT NULL DEFAULT 'AUTOMATIC',
    "storageProvider" TEXT,
    "storageKey" TEXT,
    "fileName" TEXT,
    "sizeBytes" BIGINT,
    "checksumSha256" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "retentionUntil" TIMESTAMP(3),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemEvent" (
    "id" UUID NOT NULL,
    "condominiumId" UUID,
    "userId" UUID,
    "resolvedByUserId" UUID,
    "severity" "SystemEventSeverity" NOT NULL DEFAULT 'INFO',
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "requestId" TEXT,
    "errorCode" TEXT,
    "httpMethod" TEXT,
    "route" TEXT,
    "statusCode" INTEGER,
    "stack" TEXT,
    "details" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentMethod_condominiumId_type_status_idx" ON "PaymentMethod"("condominiumId", "type", "status");

-- CreateIndex
CREATE INDEX "PaymentMethod_provider_providerCustomerId_idx" ON "PaymentMethod"("provider", "providerCustomerId");

-- CreateIndex
CREATE INDEX "PaymentMethod_deletedAt_idx" ON "PaymentMethod"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_condominiumId_priority_key" ON "PaymentMethod"("condominiumId", "priority");

-- CreateIndex
CREATE INDEX "Charge_condominiumId_status_dueDate_idx" ON "Charge"("condominiumId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Charge_subscriptionId_dueDate_idx" ON "Charge"("subscriptionId", "dueDate");

-- CreateIndex
CREATE INDEX "Charge_paymentMethodId_idx" ON "Charge"("paymentMethodId");

-- CreateIndex
CREATE INDEX "Charge_provider_providerChargeId_idx" ON "Charge"("provider", "providerChargeId");

-- CreateIndex
CREATE INDEX "Charge_requestId_idx" ON "Charge"("requestId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_chargeId_status_createdAt_idx" ON "PaymentTransaction"("chargeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentTransaction_provider_providerPaymentId_idx" ON "PaymentTransaction"("provider", "providerPaymentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_requestId_idx" ON "PaymentTransaction"("requestId");

-- CreateIndex
CREATE INDEX "SupportSession_platformAdminUserId_status_idx" ON "SupportSession"("platformAdminUserId", "status");

-- CreateIndex
CREATE INDEX "SupportSession_condominiumId_status_idx" ON "SupportSession"("condominiumId", "status");

-- CreateIndex
CREATE INDEX "SupportSession_requestId_idx" ON "SupportSession"("requestId");

-- CreateIndex
CREATE INDEX "SupportSession_startedAt_idx" ON "SupportSession"("startedAt");

-- CreateIndex
CREATE INDEX "CommunicationLog_condominiumId_channel_status_createdAt_idx" ON "CommunicationLog"("condominiumId", "channel", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationLog_recipientUserId_createdAt_idx" ON "CommunicationLog"("recipientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationLog_module_referenceId_idx" ON "CommunicationLog"("module", "referenceId");

-- CreateIndex
CREATE INDEX "CommunicationLog_provider_providerMessageId_idx" ON "CommunicationLog"("provider", "providerMessageId");

-- CreateIndex
CREATE INDEX "CommunicationLog_requestId_idx" ON "CommunicationLog"("requestId");

-- CreateIndex
CREATE INDEX "CommunicationLog_status_createdAt_idx" ON "CommunicationLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "JobExecution_jobName_status_createdAt_idx" ON "JobExecution"("jobName", "status", "createdAt");

-- CreateIndex
CREATE INDEX "JobExecution_condominiumId_status_createdAt_idx" ON "JobExecution"("condominiumId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "JobExecution_requestId_idx" ON "JobExecution"("requestId");

-- CreateIndex
CREATE INDEX "JobExecution_scheduledAt_idx" ON "JobExecution"("scheduledAt");

-- CreateIndex
CREATE INDEX "BackupRecord_status_createdAt_idx" ON "BackupRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BackupRecord_trigger_createdAt_idx" ON "BackupRecord"("trigger", "createdAt");

-- CreateIndex
CREATE INDEX "BackupRecord_createdByUserId_idx" ON "BackupRecord"("createdByUserId");

-- CreateIndex
CREATE INDEX "BackupRecord_retentionUntil_idx" ON "BackupRecord"("retentionUntil");

-- CreateIndex
CREATE INDEX "SystemEvent_severity_occurredAt_idx" ON "SystemEvent"("severity", "occurredAt");

-- CreateIndex
CREATE INDEX "SystemEvent_type_occurredAt_idx" ON "SystemEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "SystemEvent_source_occurredAt_idx" ON "SystemEvent"("source", "occurredAt");

-- CreateIndex
CREATE INDEX "SystemEvent_condominiumId_occurredAt_idx" ON "SystemEvent"("condominiumId", "occurredAt");

-- CreateIndex
CREATE INDEX "SystemEvent_userId_occurredAt_idx" ON "SystemEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "SystemEvent_requestId_idx" ON "SystemEvent"("requestId");

-- CreateIndex
CREATE INDEX "SystemEvent_resolvedAt_idx" ON "SystemEvent"("resolvedAt");

-- CreateIndex
CREATE INDEX "AuditLog_supportSessionId_createdAt_idx" ON "AuditLog"("supportSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX "Condominium_approvedAt_idx" ON "Condominium"("approvedAt");

-- CreateIndex
CREATE INDEX "Condominium_rejectedAt_idx" ON "Condominium"("rejectedAt");

-- CreateIndex
CREATE INDEX "Condominium_approvedByUserId_idx" ON "Condominium"("approvedByUserId");

-- CreateIndex
CREATE INDEX "Condominium_rejectedByUserId_idx" ON "Condominium"("rejectedByUserId");

-- CreateIndex
CREATE INDEX "Subscription_nextDueDate_idx" ON "Subscription"("nextDueDate");

-- CreateIndex
CREATE INDEX "Subscription_status_nextDueDate_idx" ON "Subscription"("status", "nextDueDate");

-- AddForeignKey
ALTER TABLE "Condominium" ADD CONSTRAINT "Condominium_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condominium" ADD CONSTRAINT "Condominium_rejectedByUserId_fkey" FOREIGN KEY ("rejectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_supportSessionId_fkey" FOREIGN KEY ("supportSessionId") REFERENCES "SupportSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "Charge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportSession" ADD CONSTRAINT "SupportSession_platformAdminUserId_fkey" FOREIGN KEY ("platformAdminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportSession" ADD CONSTRAINT "SupportSession_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobExecution" ADD CONSTRAINT "JobExecution_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRecord" ADD CONSTRAINT "BackupRecord_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemEvent" ADD CONSTRAINT "SystemEvent_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemEvent" ADD CONSTRAINT "SystemEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemEvent" ADD CONSTRAINT "SystemEvent_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
