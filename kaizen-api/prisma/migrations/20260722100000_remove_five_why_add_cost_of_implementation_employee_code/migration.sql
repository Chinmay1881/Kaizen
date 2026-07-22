-- Widen kaizen_number to fit the new "KZN-{employeeCode}-{year}-{seq}" format. Existing rows keep
-- their current "KZN-{year}-{seq}" value unchanged — only new Kaizens get the longer format.
ALTER TABLE "kaizens" ALTER COLUMN "kaizen_number" TYPE VARCHAR(40);

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('ONE_TIME', 'RECURRING');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('DAYS', 'WEEKS');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "employee_code_sequence" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "employee_code_sequence_pkey" PRIMARY KEY ("id")
);

-- AddColumn (nullable first — existing users have none yet)
ALTER TABLE "users" ADD COLUMN "employee_code" VARCHAR(20);

-- Backfill: assign every existing user a permanent EMP{NNN} code in signup order. Zero-padded to
-- 3 digits to match the EMP001-style examples; a company with over 999 employees simply gets
-- EMP1000 and up — padding is cosmetic, not a hard width limit.
UPDATE "users" u
SET "employee_code" = 'EMP' || LPAD(t.rn::text, 3, '0')
FROM (
    SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at" ASC) AS rn
    FROM "users"
) t
WHERE u."id" = t."id";

-- Seed the sequence so the next signup continues from the last backfilled number, not from 0.
INSERT INTO "employee_code_sequence" ("id", "last_value")
VALUES (1, (SELECT COUNT(*) FROM "users"))
ON CONFLICT ("id") DO UPDATE SET "last_value" = EXCLUDED."last_value";

-- Now safe to enforce NOT NULL + UNIQUE — every row has a value.
ALTER TABLE "users" ALTER COLUMN "employee_code" SET NOT NULL;
CREATE UNIQUE INDEX "users_employee_code_key" ON "users"("employee_code");

-- DropForeignKey
ALTER TABLE "kaizen_5why" DROP CONSTRAINT "kaizen_5why_kaizen_id_fkey";

-- DropTable — 5 Whys is removed as a feature; any submitted answers are intentionally not
-- migrated anywhere (there is no replacement field for this content, per the product change).
DROP TABLE "kaizen_5why";

-- CreateTable
CREATE TABLE "kaizen_cost_of_implementation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kaizen_id" UUID NOT NULL,
    "cost_type" "CostType",
    "estimated_cost" DECIMAL(12,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "estimated_duration_value" INTEGER,
    "estimated_duration_unit" "DurationUnit",
    "employees_required" INTEGER,
    "department_ids" TEXT[],
    "materials_required" TEXT,
    "machines_required" TEXT,
    "vendor_required" BOOLEAN NOT NULL DEFAULT false,
    "vendor_details" VARCHAR(1000),
    "estimated_annual_savings" DECIMAL(12,2),
    "time_saved_hours_per_day" DECIMAL(6,2),
    "quality_improvement" "ImpactLevel",
    "safety_improvement" "ImpactLevel",
    "customer_satisfaction_improvement" "ImpactLevel",
    "waste_reduction_improvement" "ImpactLevel",
    "expected_payback_period" VARCHAR(100),
    "additional_notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "kaizen_cost_of_implementation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kaizen_cost_of_implementation_kaizen_id_key" ON "kaizen_cost_of_implementation"("kaizen_id");

-- AddForeignKey
ALTER TABLE "kaizen_cost_of_implementation" ADD CONSTRAINT "kaizen_cost_of_implementation_kaizen_id_fkey" FOREIGN KEY ("kaizen_id") REFERENCES "kaizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
