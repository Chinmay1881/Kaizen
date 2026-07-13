-- CreateEnum
CREATE TYPE "ReportExportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV');

-- CreateEnum
CREATE TYPE "ReportExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReportScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REPORT_READY';

-- CreateTable
CREATE TABLE "report_exports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "format" "ReportExportFormat" NOT NULL,
    "filters" JSONB NOT NULL,
    "filters_hash" VARCHAR(64) NOT NULL,
    "status" "ReportExportStatus" NOT NULL DEFAULT 'PENDING',
    "file_name" VARCHAR(255) NOT NULL,
    "file_size_bytes" INTEGER,
    "cloudinary_url" TEXT,
    "cloudinary_public_id" TEXT,
    "file_data" BYTEA,
    "error_message" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "schedule_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "filters" JSONB NOT NULL,
    "format" "ReportExportFormat" NOT NULL DEFAULT 'PDF',
    "frequency" "ReportScheduleFrequency" NOT NULL,
    "recipient_ids" TEXT[],
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMPTZ(6),
    "next_run_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "filters" JSONB NOT NULL,
    "charts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "columns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_exports_user_id_created_at_idx" ON "report_exports"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "report_exports_filters_hash_status_created_at_idx" ON "report_exports"("filters_hash", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "report_schedules_is_enabled_next_run_at_idx" ON "report_schedules"("is_enabled", "next_run_at");

-- CreateIndex
CREATE INDEX "report_schedules_user_id_created_at_idx" ON "report_schedules"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "report_templates_user_id_is_pinned_idx" ON "report_templates"("user_id", "is_pinned");

-- CreateIndex
CREATE INDEX "report_templates_user_id_is_favorite_idx" ON "report_templates"("user_id", "is_favorite");

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "report_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
