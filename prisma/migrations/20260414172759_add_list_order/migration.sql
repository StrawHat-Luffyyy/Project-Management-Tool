/*
  Warnings:

  - You are about to drop the column `edescription` on the `Workspace` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "listOrder" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "edescription",
ADD COLUMN     "description" TEXT;
