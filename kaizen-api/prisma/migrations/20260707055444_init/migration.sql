-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'DEPARTMENT_MANAGER', 'HR', 'CMD', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "KaizenStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_CHANGES', 'REJECTED', 'APPROVED', 'IMPLEMENTATION_IN_PROGRESS', 'IMPLEMENTATION_COMPLETED', 'BUSINESS_IMPACT_RECORDED', 'REWARD_ISSUED', 'ARCHIVED', 'PUBLISHED_TO_KNOWLEDGE_BASE');

-- CreateEnum
CREATE TYPE "KaizenPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EstimatedImpact" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'MAJOR');

-- CreateEnum
CREATE TYPE "ReviewRecommendation" AS ENUM ('APPROVE', 'REJECT', 'NEEDS_CHANGES');

-- CreateEnum
CREATE TYPE "ReviewConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'VIDEO', 'PDF', 'DOCUMENT', 'SPREADSHEET', 'PRESENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "AttachmentTag" AS ENUM ('GENERAL', 'BEFORE', 'AFTER', 'EVIDENCE');

-- CreateEnum
CREATE TYPE "ImplementationVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('KAIZEN_SUBMITTED', 'KAIZEN_APPROVED', 'KAIZEN_REJECTED', 'KAIZEN_NEEDS_CHANGES', 'KAIZEN_ASSIGNED', 'IMPLEMENTATION_STARTED', 'IMPLEMENTATION_COMPLETED', 'REWARD_ISSUED', 'ACHIEVEMENT_UNLOCKED', 'KNOWLEDGE_BASE_PUBLISHED', 'ANNOUNCEMENT', 'COMMENT_ADDED', 'MENTION');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('DRAFT_CREATED', 'DRAFT_UPDATED', 'SUBMITTED', 'REVIEW_STARTED', 'COMMENT_ADDED', 'EVALUATION_SUBMITTED', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES', 'RESUBMITTED', 'IMPLEMENTATION_ASSIGNED', 'IMPLEMENTATION_STARTED', 'IMPLEMENTATION_COMPLETED', 'BUSINESS_IMPACT_RECORDED', 'REWARD_ISSUED', 'ARCHIVED', 'KNOWLEDGE_BASE_PUBLISHED', 'PRIORITY_CHANGED', 'STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "AchievementRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'ALL_TIME');

-- CreateEnum
CREATE TYPE "LeaderboardScope" AS ENUM ('COMPANY', 'DEPARTMENT');

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "manager_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "description" VARCHAR(255),
    "icon" VARCHAR(50),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerk_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "avatar_url" TEXT,
    "department_id" UUID,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "job_title" VARCHAR(120),
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_gamification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "ideas_submitted" INTEGER NOT NULL DEFAULT 0,
    "ideas_approved" INTEGER NOT NULL DEFAULT 0,
    "ideas_implemented" INTEGER NOT NULL DEFAULT 0,
    "current_rank" INTEGER,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_gamification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kaizen_number_sequences" (
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kaizen_number_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "kaizens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_number" VARCHAR(20) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "status" "KaizenStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "KaizenPriority" NOT NULL DEFAULT 'MEDIUM',
    "estimated_impact" "EstimatedImpact" NOT NULL DEFAULT 'MEDIUM',
    "location" VARCHAR(120),
    "problem_statement" TEXT,
    "current_process" TEXT,
    "proposed_solution" TEXT,
    "category_id" UUID,
    "department_id" UUID NOT NULL,
    "submitter_id" UUID NOT NULL,
    "assigned_reviewer_id" UUID,
    "assigned_owner_id" UUID,
    "implementation_due_date" DATE,
    "submitted_at" TIMESTAMPTZ,
    "approved_at" TIMESTAMPTZ,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "kaizens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kaizen_5w1h" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "what" TEXT,
    "where_location" TEXT,
    "when_occurs" TEXT,
    "who" TEXT,
    "why" TEXT,
    "how" TEXT,

    CONSTRAINT "kaizen_5w1h_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kaizen_5why" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,

    CONSTRAINT "kaizen_5why_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kaizen_benefits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "benefit_type" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kaizen_benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kaizen_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" "AttachmentType" NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "cloudinary_public_id" VARCHAR(255) NOT NULL,
    "cloudinary_url" TEXT NOT NULL,
    "cloudinary_secure_url" TEXT NOT NULL,
    "tag" "AttachmentTag" NOT NULL DEFAULT 'GENERAL',
    "caption" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kaizen_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_parameters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "guidelines" TEXT NOT NULL,
    "max_score" INTEGER NOT NULL DEFAULT 10,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "scoring_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "recommendation" "ReviewRecommendation" NOT NULL,
    "confidence" "ReviewConfidence",
    "remarks" TEXT,
    "total_score" INTEGER NOT NULL,
    "overall_rating" DECIMAL(3,1) NOT NULL,
    "is_submitted" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_scores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evaluation_id" UUID NOT NULL,
    "parameter_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "evaluation_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_comments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "parent_id" UUID,
    "body" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "review_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "assigned_department_id" UUID NOT NULL,
    "description" TEXT,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "estimated_cost" DECIMAL(12,2),
    "actual_cost" DECIMAL(12,2),
    "time_taken_days" INTEGER,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "completion_notes" TEXT,
    "verification_status" "ImplementationVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by_id" UUID,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "implementations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "implementation_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "implementation_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" "AttachmentType" NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "cloudinary_public_id" VARCHAR(255) NOT NULL,
    "cloudinary_secure_url" TEXT NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "implementation_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_impacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "money_saved" DECIMAL(14,2),
    "hours_saved" DECIMAL(10,2),
    "employees_benefited" INTEGER,
    "customers_benefited" INTEGER,
    "process_improvement" BOOLEAN NOT NULL DEFAULT false,
    "quality_improvement" BOOLEAN NOT NULL DEFAULT false,
    "safety_improvement" BOOLEAN NOT NULL DEFAULT false,
    "productivity_improvement" BOOLEAN NOT NULL DEFAULT false,
    "customer_satisfaction_improvement" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "recorded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "business_impacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_ledger" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "kaizen_id" UUID,
    "issued_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(50) NOT NULL,
    "rarity" "AchievementRarity" NOT NULL DEFAULT 'COMMON',
    "points_awarded" INTEGER NOT NULL DEFAULT 25,
    "criteria" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "earned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "kaizen_id" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "issued_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "period" "LeaderboardPeriod" NOT NULL,
    "scope" "LeaderboardScope" NOT NULL,
    "department_id" UUID,
    "rankings" JSONB NOT NULL,
    "computed_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "department_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published_by_id" UUID NOT NULL,
    "published_at" TIMESTAMPTZ NOT NULL,
    "searchVector" tsvector,

    CONSTRAINT "knowledge_base_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "target_roles" "UserRole"[],
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" VARCHAR(255),
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "event_type" "TimelineEventType" NOT NULL,
    "actor_id" UUID,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "user_role" "UserRole",
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_manager_id_idx" ON "departments"("manager_id");

-- CreateIndex
CREATE INDEX "departments_is_active_idx" ON "departments"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_department_id_idx" ON "users"("department_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_gamification_user_id_key" ON "user_gamification"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "kaizens_kaizen_number_key" ON "kaizens"("kaizen_number");

-- CreateIndex
CREATE INDEX "kaizens_status_idx" ON "kaizens"("status");

-- CreateIndex
CREATE INDEX "kaizens_department_id_idx" ON "kaizens"("department_id");

-- CreateIndex
CREATE INDEX "kaizens_submitter_id_idx" ON "kaizens"("submitter_id");

-- CreateIndex
CREATE INDEX "kaizens_category_id_idx" ON "kaizens"("category_id");

-- CreateIndex
CREATE INDEX "kaizens_assigned_reviewer_id_idx" ON "kaizens"("assigned_reviewer_id");

-- CreateIndex
CREATE INDEX "kaizens_submitted_at_idx" ON "kaizens"("submitted_at");

-- CreateIndex
CREATE INDEX "kaizens_status_department_id_idx" ON "kaizens"("status", "department_id");

-- CreateIndex
CREATE INDEX "kaizens_submitter_id_status_idx" ON "kaizens"("submitter_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "kaizen_5w1h_kaizen_id_key" ON "kaizen_5w1h"("kaizen_id");

-- CreateIndex
CREATE UNIQUE INDEX "kaizen_5why_kaizen_id_level_key" ON "kaizen_5why"("kaizen_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_parameters_slug_key" ON "scoring_parameters"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_kaizen_id_reviewer_id_key" ON "evaluations"("kaizen_id", "reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_scores_evaluation_id_parameter_id_key" ON "evaluation_scores"("evaluation_id", "parameter_id");

-- CreateIndex
CREATE UNIQUE INDEX "implementations_kaizen_id_key" ON "implementations"("kaizen_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_impacts_kaizen_id_key" ON "business_impacts"("kaizen_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_snapshots_period_scope_department_id_key" ON "leaderboard_snapshots"("period", "scope", "department_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_entries_kaizen_id_key" ON "knowledge_base_entries"("kaizen_id");

-- CreateIndex
CREATE INDEX "knowledge_base_entries_tags_idx" ON "knowledge_base_entries" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- CreateIndex
CREATE INDEX "timeline_events_kaizen_id_created_at_idx" ON "timeline_events"("kaizen_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_gamification" ADD CONSTRAINT "user_gamification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizens" ADD CONSTRAINT "kaizens_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizens" ADD CONSTRAINT "kaizens_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizens" ADD CONSTRAINT "kaizens_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizens" ADD CONSTRAINT "kaizens_assigned_reviewer_id_fkey" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizens" ADD CONSTRAINT "kaizens_assigned_owner_id_fkey" FOREIGN KEY ("assigned_owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizen_5w1h" ADD CONSTRAINT "kaizen_5w1h_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizen_5why" ADD CONSTRAINT "kaizen_5why_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizen_benefits" ADD CONSTRAINT "kaizen_benefits_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizen_attachments" ADD CONSTRAINT "kaizen_attachments_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kaizen_attachments" ADD CONSTRAINT "kaizen_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "scoring_parameters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "review_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementations" ADD CONSTRAINT "implementations_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementations" ADD CONSTRAINT "implementations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementations" ADD CONSTRAINT "implementations_assigned_department_id_fkey" FOREIGN KEY ("assigned_department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementations" ADD CONSTRAINT "implementations_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_attachments" ADD CONSTRAINT "implementation_attachments_implementation_id_fkey" FOREIGN KEY ("implementation_id") REFERENCES "implementations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "implementation_attachments" ADD CONSTRAINT "implementation_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_impacts" ADD CONSTRAINT "business_impacts_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_impacts" ADD CONSTRAINT "business_impacts_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_snapshots" ADD CONSTRAINT "leaderboard_snapshots_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_entries" ADD CONSTRAINT "knowledge_base_entries_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_entries" ADD CONSTRAINT "knowledge_base_entries_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_entries" ADD CONSTRAINT "knowledge_base_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_entries" ADD CONSTRAINT "knowledge_base_entries_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
