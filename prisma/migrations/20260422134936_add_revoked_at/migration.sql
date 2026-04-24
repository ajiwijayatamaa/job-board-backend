-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "revoked_at" BOOLEAN NOT NULL DEFAULT false;
