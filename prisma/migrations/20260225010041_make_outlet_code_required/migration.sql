/*
  Warnings:

  - Made the column `outletCode` on table `outlets` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "outlets" ALTER COLUMN "outletCode" SET NOT NULL;
