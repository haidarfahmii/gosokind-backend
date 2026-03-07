/*
  Warnings:

  - A unique constraint covering the columns `[outletCode]` on the table `outlets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pickupAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "outlets" ADD COLUMN     "outletCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "outlets_outletCode_key" ON "outlets"("outletCode");
