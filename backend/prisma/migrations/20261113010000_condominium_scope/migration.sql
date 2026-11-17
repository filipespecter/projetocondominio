BEGIN;
ALTER TABLE "Resident" ADD COLUMN "isSecondary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_single_responsibility_check" CHECK (NOT ("isPrimary" AND "isSecondary"));
CREATE UNIQUE INDEX "Resident_one_active_secondary_per_apartment" ON "Resident" ("condominiumId", "apartmentId") WHERE "isSecondary" AND "deletedAt" IS NULL;
ALTER TYPE "NoticeAudience" ADD VALUE 'INDIVIDUAL';
ALTER TABLE "Notice" ADD COLUMN "recipientUserId" UUID;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_active_slot_valid"
CHECK ("deletedAt" IS NOT NULL OR "status" NOT IN ('PENDING','APPROVED') OR
 ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "startTime" < "endTime"));
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_no_active_overlap" EXCLUDE USING gist (
 "condominiumId" WITH =, "commonAreaId" WITH =, "reservationDate" WITH =,
 (int4range(split_part("startTime", ':', 1)::int * 60 + split_part("startTime", ':', 2)::int,
            split_part("endTime", ':', 1)::int * 60 + split_part("endTime", ':', 2)::int, '[)')) WITH &&
) WHERE ("deletedAt" IS NULL AND "status" IN ('PENDING','APPROVED'));
COMMIT;
