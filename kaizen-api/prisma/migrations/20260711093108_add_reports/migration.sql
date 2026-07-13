-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('EXECUTIVE_SUMMARY', 'MONTHLY', 'DEPARTMENT', 'EMPLOYEE_PERFORMANCE', 'KAIZEN_PERFORMANCE', 'REVIEW_PERFORMANCE', 'IMPLEMENTATION', 'BUSINESS_IMPACT', 'REWARD', 'LEADERBOARD');

-- AlterEnum
ALTER TYPE "SavedViewEntityType" ADD VALUE 'REPORTS';

-- CreateTable
CREATE TABLE "report_generations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "filters" JSONB NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_generations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_generations_user_id_created_at_idx" ON "report_generations"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "report_generations" ADD CONSTRAINT "report_generations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
