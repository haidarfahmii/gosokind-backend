-- CreateEnum
CREATE TYPE "OutletStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "laundry_items" ADD COLUMN     "basePrice" DOUBLE PRECISION,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "outlets" ADD COLUMN     "city" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "status" "OutletStatus" NOT NULL DEFAULT 'AVAILABLE';

-- CreateIndex
CREATE INDEX "outlets_status_idx" ON "outlets"("status");

-- CreateIndex
CREATE INDEX "outlets_province_city_idx" ON "outlets"("province", "city");
