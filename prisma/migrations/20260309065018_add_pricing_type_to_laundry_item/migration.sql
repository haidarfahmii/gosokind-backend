-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('WEIGHT', 'ITEM');

-- AlterTable
ALTER TABLE "laundry_items" ADD COLUMN     "pricingType" "PricingType" NOT NULL DEFAULT 'ITEM';

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;
