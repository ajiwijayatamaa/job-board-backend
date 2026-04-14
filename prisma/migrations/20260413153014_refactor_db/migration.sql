/*
  Warnings:

  - You are about to drop the column `testResultId` on the `applications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[test_result_id]` on the table `applications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,job_id]` on the table `applications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `jobs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_testResultId_fkey";

-- AlterTable
ALTER TABLE "applications" DROP COLUMN "testResultId",
ADD COLUMN     "test_result_id" INTEGER;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "category" VARCHAR(100) NOT NULL,
ADD COLUMN     "tags" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "applications_test_result_id_key" ON "applications"("test_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_job_id_key" ON "applications"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_test_result_id_fkey" FOREIGN KEY ("test_result_id") REFERENCES "test_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;
