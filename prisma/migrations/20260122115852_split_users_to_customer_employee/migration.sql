/*
  Warnings:

  - You are about to drop the column `userId` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryAddressId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAddressId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `customerId` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressId` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('SUPER_ADMIN', 'OUTLET_ADMIN', 'WORKER_WASHING', 'WORKER_IRONING', 'WORKER_PACKING', 'DRIVER');

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_userId_fkey";

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_userId_fkey";

-- DropForeignKey
ALTER TABLE "bypass_requests" DROP CONSTRAINT "bypass_requests_workerId_fkey";

-- DropForeignKey
ALTER TABLE "order_station_processes" DROP CONSTRAINT "order_station_processes_workerId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_customerId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_deliveryAddressId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_deliveryDriverId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_pickupAddressId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_pickupDriverId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_outletId_fkey";

-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "userId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "userId",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "deliveryAddressId",
DROP COLUMN "pickupAddressId",
ADD COLUMN     "addressId" TEXT NOT NULL;

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT,
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "EmployeeRole" NOT NULL,
    "outletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickupDriverId_fkey" FOREIGN KEY ("pickupDriverId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryDriverId_fkey" FOREIGN KEY ("deliveryDriverId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_station_processes" ADD CONSTRAINT "order_station_processes_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bypass_requests" ADD CONSTRAINT "bypass_requests_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
