-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'CONDOMINIUM_ADMIN', 'MANAGER', 'DOORMAN', 'RESIDENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING');

-- CreateEnum
CREATE TYPE "CondominiumStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'OVERDUE', 'SUSPENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "FeatureValueType" AS ENUM ('BOOLEAN', 'LIMIT', 'CONFIGURATION');

-- CreateEnum
CREATE TYPE "ApartmentStatus" AS ENUM ('OCCUPIED', 'VACANT', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ResidentType" AS ENUM ('OWNER', 'TENANT', 'DEPENDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkShift" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT', 'TWELVE_BY_THIRTY_SIX', 'OTHER');

-- CreateEnum
CREATE TYPE "VisitorStatus" AS ENUM ('WAITING', 'AUTHORIZED', 'INSIDE', 'EXITED', 'DENIED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('EXPECTED', 'RECEIVED', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CANCELED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NoticeAudience" AS ENUM ('ALL', 'RESIDENTS', 'DOORMEN', 'MANAGERS', 'APARTMENT');

-- CreateEnum
CREATE TYPE "OccurrenceOrigin" AS ENUM ('RESIDENT', 'DOORMAN', 'MANAGER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "OccurrenceType" AS ENUM ('OCCURRENCE', 'COMPLAINT', 'SUGGESTION', 'REQUEST');

-- CreateEnum
CREATE TYPE "OccurrencePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('NEW', 'FORWARDED', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ServiceProviderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ProviderAccessStatus" AS ENUM ('SCHEDULED', 'INSIDE', 'EXITED', 'CANCELED');

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPriceInCents" INTEGER NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "valueType" "FeatureValueType" NOT NULL DEFAULT 'BOOLEAN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFeature" (
    "planId" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "limitValue" INTEGER,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("planId","featureId")
);

-- CreateTable
CREATE TABLE "Condominium" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "postalCode" TEXT,
    "addressLine" TEXT,
    "addressNumber" TEXT,
    "addressExtra" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "logoUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Recife',
    "rules" TEXT,
    "settings" JSONB,
    "status" "CondominiumStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Condominium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "priceInCents" INTEGER NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "condominiumId" UUID,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLogoutAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apartment" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "block" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floor" INTEGER,
    "status" "ApartmentStatus" NOT NULL DEFAULT 'OCCUPIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Apartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "apartmentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "residentType" "ResidentType" NOT NULL DEFAULT 'OWNER',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canReserve" BOOLEAN NOT NULL DEFAULT true,
    "canOpenOccurrence" BOOLEAN NOT NULL DEFAULT true,
    "canViewPackages" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doorman" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "shift" "WorkShift" NOT NULL,
    "customShift" TEXT,
    "lastDutyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Doorman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "apartmentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "phone" TEXT,
    "visitType" TEXT,
    "vehicle" TEXT,
    "plate" TEXT,
    "notes" TEXT,
    "status" "VisitorStatus" NOT NULL DEFAULT 'WAITING',
    "expectedAt" TIMESTAMP(3),
    "enteredAt" TIMESTAMP(3),
    "exitedAt" TIMESTAMP(3),
    "authorizedAt" TIMESTAMP(3),
    "deniedAt" TIMESTAMP(3),
    "registeredByUserId" UUID,
    "authorizedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "apartmentId" UUID NOT NULL,
    "expectedByResidentId" UUID,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "carrier" TEXT,
    "trackingCode" TEXT,
    "status" "PackageStatus" NOT NULL DEFAULT 'RECEIVED',
    "withdrawnBy" TEXT,
    "notes" TEXT,
    "expectedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "receivedByUserId" UUID,
    "deliveredByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonArea" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER,
    "openingTime" TEXT,
    "closingTime" TEXT,
    "reservationRequired" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommonArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "commonAreaId" UUID NOT NULL,
    "apartmentId" UUID NOT NULL,
    "requestedByUserId" UUID NOT NULL,
    "reviewedByUserId" UUID,
    "reservationDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "guestsCount" INTEGER,
    "purpose" TEXT,
    "notes" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "apartmentId" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "audience" "NoticeAudience" NOT NULL DEFAULT 'ALL',
    "status" "NoticeStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occurrence" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "apartmentId" UUID,
    "createdByUserId" UUID,
    "assignedToUserId" UUID,
    "origin" "OccurrenceOrigin" NOT NULL,
    "type" "OccurrenceType" NOT NULL,
    "category" TEXT NOT NULL,
    "priority" "OccurrencePriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "OccurrenceStatus" NOT NULL DEFAULT 'NEW',
    "shift" TEXT,
    "dutyDate" DATE,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "readByManagerAt" TIMESTAMP(3),
    "readByDoormanAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Occurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccurrenceReply" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "occurrenceId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OccurrenceReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "recipientUserId" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "origin" TEXT,
    "targetRole" "UserRole",
    "module" TEXT,
    "referenceId" TEXT,
    "apartmentLabel" TEXT,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "condominiumId" UUID,
    "userId" UUID,
    "userName" TEXT,
    "userRole" "UserRole",
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT,
    "referenceId" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceProvider" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "document" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "serviceType" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ServiceProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAccess" (
    "id" UUID NOT NULL,
    "condominiumId" UUID NOT NULL,
    "serviceProviderId" UUID NOT NULL,
    "apartmentId" UUID,
    "serviceDescription" TEXT,
    "scheduledDate" DATE,
    "scheduledStartTime" TEXT,
    "scheduledEndTime" TEXT,
    "status" "ProviderAccessStatus" NOT NULL DEFAULT 'SCHEDULED',
    "enteredAt" TIMESTAMP(3),
    "exitedAt" TIMESTAMP(3),
    "entryRegisteredByUserId" UUID,
    "exitRegisteredByUserId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "Plan_active_idx" ON "Plan"("active");

-- CreateIndex
CREATE INDEX "Plan_displayOrder_idx" ON "Plan"("displayOrder");

-- CreateIndex
CREATE INDEX "Plan_deletedAt_idx" ON "Plan"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_code_key" ON "Feature"("code");

-- CreateIndex
CREATE INDEX "Feature_active_idx" ON "Feature"("active");

-- CreateIndex
CREATE INDEX "Feature_deletedAt_idx" ON "Feature"("deletedAt");

-- CreateIndex
CREATE INDEX "PlanFeature_featureId_idx" ON "PlanFeature"("featureId");

-- CreateIndex
CREATE INDEX "PlanFeature_planId_enabled_idx" ON "PlanFeature"("planId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Condominium_code_key" ON "Condominium"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Condominium_document_key" ON "Condominium"("document");

-- CreateIndex
CREATE INDEX "Condominium_status_idx" ON "Condominium"("status");

-- CreateIndex
CREATE INDEX "Condominium_createdAt_idx" ON "Condominium"("createdAt");

-- CreateIndex
CREATE INDEX "Condominium_deletedAt_idx" ON "Condominium"("deletedAt");

-- CreateIndex
CREATE INDEX "Subscription_condominiumId_status_idx" ON "Subscription"("condominiumId", "status");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "User_condominiumId_role_status_idx" ON "User"("condominiumId", "role", "status");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_condominiumId_username_key" ON "User"("condominiumId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "User_condominiumId_email_key" ON "User"("condominiumId", "email");

-- CreateIndex
CREATE INDEX "Apartment_condominiumId_status_idx" ON "Apartment"("condominiumId", "status");

-- CreateIndex
CREATE INDEX "Apartment_condominiumId_number_idx" ON "Apartment"("condominiumId", "number");

-- CreateIndex
CREATE INDEX "Apartment_deletedAt_idx" ON "Apartment"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Apartment_condominiumId_block_number_key" ON "Apartment"("condominiumId", "block", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_userId_key" ON "Resident"("userId");

-- CreateIndex
CREATE INDEX "Resident_condominiumId_apartmentId_idx" ON "Resident"("condominiumId", "apartmentId");

-- CreateIndex
CREATE INDEX "Resident_condominiumId_isPrimary_idx" ON "Resident"("condominiumId", "isPrimary");

-- CreateIndex
CREATE INDEX "Resident_deletedAt_idx" ON "Resident"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Doorman_userId_key" ON "Doorman"("userId");

-- CreateIndex
CREATE INDEX "Doorman_condominiumId_shift_idx" ON "Doorman"("condominiumId", "shift");

-- CreateIndex
CREATE INDEX "Doorman_deletedAt_idx" ON "Doorman"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Doorman_condominiumId_code_key" ON "Doorman"("condominiumId", "code");

-- CreateIndex
CREATE INDEX "Visitor_condominiumId_status_idx" ON "Visitor"("condominiumId", "status");

-- CreateIndex
CREATE INDEX "Visitor_condominiumId_apartmentId_createdAt_idx" ON "Visitor"("condominiumId", "apartmentId", "createdAt");

-- CreateIndex
CREATE INDEX "Visitor_document_idx" ON "Visitor"("document");

-- CreateIndex
CREATE INDEX "Visitor_deletedAt_idx" ON "Visitor"("deletedAt");

-- CreateIndex
CREATE INDEX "Package_condominiumId_status_idx" ON "Package"("condominiumId", "status");

-- CreateIndex
CREATE INDEX "Package_condominiumId_apartmentId_status_idx" ON "Package"("condominiumId", "apartmentId", "status");

-- CreateIndex
CREATE INDEX "Package_trackingCode_idx" ON "Package"("trackingCode");

-- CreateIndex
CREATE INDEX "Package_createdAt_idx" ON "Package"("createdAt");

-- CreateIndex
CREATE INDEX "Package_deletedAt_idx" ON "Package"("deletedAt");

-- CreateIndex
CREATE INDEX "CommonArea_condominiumId_active_idx" ON "CommonArea"("condominiumId", "active");

-- CreateIndex
CREATE INDEX "CommonArea_deletedAt_idx" ON "CommonArea"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommonArea_condominiumId_name_key" ON "CommonArea"("condominiumId", "name");

-- CreateIndex
CREATE INDEX "Reservation_condominiumId_reservationDate_status_idx" ON "Reservation"("condominiumId", "reservationDate", "status");

-- CreateIndex
CREATE INDEX "Reservation_condominiumId_commonAreaId_reservationDate_idx" ON "Reservation"("condominiumId", "commonAreaId", "reservationDate");

-- CreateIndex
CREATE INDEX "Reservation_apartmentId_reservationDate_idx" ON "Reservation"("apartmentId", "reservationDate");

-- CreateIndex
CREATE INDEX "Reservation_deletedAt_idx" ON "Reservation"("deletedAt");

-- CreateIndex
CREATE INDEX "Notice_condominiumId_status_publishedAt_idx" ON "Notice"("condominiumId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "Notice_condominiumId_audience_idx" ON "Notice"("condominiumId", "audience");

-- CreateIndex
CREATE INDEX "Notice_apartmentId_idx" ON "Notice"("apartmentId");

-- CreateIndex
CREATE INDEX "Notice_deletedAt_idx" ON "Notice"("deletedAt");

-- CreateIndex
CREATE INDEX "Occurrence_condominiumId_status_priority_idx" ON "Occurrence"("condominiumId", "status", "priority");

-- CreateIndex
CREATE INDEX "Occurrence_condominiumId_type_createdAt_idx" ON "Occurrence"("condominiumId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Occurrence_apartmentId_idx" ON "Occurrence"("apartmentId");

-- CreateIndex
CREATE INDEX "Occurrence_createdByUserId_idx" ON "Occurrence"("createdByUserId");

-- CreateIndex
CREATE INDEX "Occurrence_deletedAt_idx" ON "Occurrence"("deletedAt");

-- CreateIndex
CREATE INDEX "OccurrenceReply_condominiumId_occurrenceId_createdAt_idx" ON "OccurrenceReply"("condominiumId", "occurrenceId", "createdAt");

-- CreateIndex
CREATE INDEX "OccurrenceReply_authorUserId_idx" ON "OccurrenceReply"("authorUserId");

-- CreateIndex
CREATE INDEX "OccurrenceReply_deletedAt_idx" ON "OccurrenceReply"("deletedAt");

-- CreateIndex
CREATE INDEX "Notification_condominiumId_recipientUserId_readAt_idx" ON "Notification"("condominiumId", "recipientUserId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_condominiumId_targetRole_readAt_idx" ON "Notification"("condominiumId", "targetRole", "readAt");

-- CreateIndex
CREATE INDEX "Notification_module_referenceId_idx" ON "Notification"("module", "referenceId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_condominiumId_createdAt_idx" ON "AuditLog"("condominiumId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_condominiumId_module_createdAt_idx" ON "AuditLog"("condominiumId", "module", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_referenceId_idx" ON "AuditLog"("referenceId");

-- CreateIndex
CREATE INDEX "ServiceProvider_condominiumId_status_idx" ON "ServiceProvider"("condominiumId", "status");

-- CreateIndex
CREATE INDEX "ServiceProvider_condominiumId_document_idx" ON "ServiceProvider"("condominiumId", "document");

-- CreateIndex
CREATE INDEX "ServiceProvider_deletedAt_idx" ON "ServiceProvider"("deletedAt");

-- CreateIndex
CREATE INDEX "ProviderAccess_condominiumId_status_scheduledDate_idx" ON "ProviderAccess"("condominiumId", "status", "scheduledDate");

-- CreateIndex
CREATE INDEX "ProviderAccess_serviceProviderId_createdAt_idx" ON "ProviderAccess"("serviceProviderId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderAccess_apartmentId_idx" ON "ProviderAccess"("apartmentId");

-- CreateIndex
CREATE INDEX "ProviderAccess_deletedAt_idx" ON "ProviderAccess"("deletedAt");

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apartment" ADD CONSTRAINT "Apartment_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doorman" ADD CONSTRAINT "Doorman_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doorman" ADD CONSTRAINT "Doorman_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_registeredByUserId_fkey" FOREIGN KEY ("registeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_authorizedByUserId_fkey" FOREIGN KEY ("authorizedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_expectedByResidentId_fkey" FOREIGN KEY ("expectedByResidentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_receivedByUserId_fkey" FOREIGN KEY ("receivedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_deliveredByUserId_fkey" FOREIGN KEY ("deliveredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommonArea" ADD CONSTRAINT "CommonArea_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_commonAreaId_fkey" FOREIGN KEY ("commonAreaId") REFERENCES "CommonArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Occurrence" ADD CONSTRAINT "Occurrence_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrenceReply" ADD CONSTRAINT "OccurrenceReply_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrenceReply" ADD CONSTRAINT "OccurrenceReply_occurrenceId_fkey" FOREIGN KEY ("occurrenceId") REFERENCES "Occurrence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccurrenceReply" ADD CONSTRAINT "OccurrenceReply_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProvider" ADD CONSTRAINT "ServiceProvider_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAccess" ADD CONSTRAINT "ProviderAccess_condominiumId_fkey" FOREIGN KEY ("condominiumId") REFERENCES "Condominium"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAccess" ADD CONSTRAINT "ProviderAccess_serviceProviderId_fkey" FOREIGN KEY ("serviceProviderId") REFERENCES "ServiceProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAccess" ADD CONSTRAINT "ProviderAccess_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAccess" ADD CONSTRAINT "ProviderAccess_entryRegisteredByUserId_fkey" FOREIGN KEY ("entryRegisteredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAccess" ADD CONSTRAINT "ProviderAccess_exitRegisteredByUserId_fkey" FOREIGN KEY ("exitRegisteredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
