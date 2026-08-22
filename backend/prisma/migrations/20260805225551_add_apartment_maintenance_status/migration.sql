-- AlterEnum
ALTER TYPE "ApartmentStatus" ADD VALUE 'MAINTENANCE';

-- AlterTable
ALTER TABLE "Apartment" ALTER COLUMN "status" SET DEFAULT 'VACANT';
