/*
  Warnings:

  - You are about to drop the column `application_id` on the `test_results` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,pre_selection_test_id]` on the table `test_results` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `test_results` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "test_results" DROP CONSTRAINT "test_results_application_id_fkey";

-- DropIndex
DROP INDEX "test_results_application_id_key";

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "testResultId" INTEGER;

-- AlterTable
ALTER TABLE "test_results" DROP COLUMN "application_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "test_results_user_id_pre_selection_test_id_key" ON "test_results"("user_id", "pre_selection_test_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "test_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
