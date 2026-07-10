// Prisma seed script.
// Categories are the 12 fixed values from docs/product/02_PRODUCT_REQUIREMENTS.md (KAIZEN-001),
// which also describes the Step 1 category cards as needing an icon + short description each.
// Icon names are Lucide component names (matches docs/design/01_DESIGN_SYSTEM.md: "Lucide React").
// Scoring parameters are the 5 fixed MVP defaults from SCORE-001 / docs/engineering/01_DATABASE_SCHEMA.md
// (Milestone 7). Achievements (10) and platform settings (8) are the MVP gamification reference data
// from docs/engineering/01_DATABASE_SCHEMA.md (Milestone 9) — criteria JSON shapes are evaluated by
// GamificationService.meetsCriteria.
//
// The single "General" department is a pragmatic bootstrap, not something the docs asked for:
// kaizens.department_id is NOT NULL, but real department management is Admin Panel scope (not
// built yet), so without this every Kaizen submission would be permanently blocked on a required
// field with no way to populate it. Real departments should eventually replace/supersede this
// once the Admin Panel exists.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** The 5 MVP evaluation parameters from SCORE-001. Guidelines follow the same 4-band pattern
 * SCORE-001 gives as a worked example for Problem Identification ("Every parameter should include
 * similar guidance") — reused verbatim for that one, authored analogously for the other 4. */
const SCORING_PARAMETERS: Array<{
  name: string;
  description: string;
  guidelines: string;
}> = [
  {
    name: "Problem Identification",
    description: "How clearly the problem is identified and articulated.",
    guidelines:
      "0-2: Problem unclear. 3-5: Minor issue. 6-8: Important operational issue. 9-10: Critical business problem.",
  },
  {
    name: "Creative Thinking",
    description: "How original and inventive the proposed solution is.",
    guidelines:
      "0-2: Minimal originality. 3-5: Some creativity. 6-8: Innovative approach. 9-10: Highly original, breakthrough thinking.",
  },
  {
    name: "Implementation",
    description: "How feasible the proposed solution is to actually execute.",
    guidelines:
      "0-2: Impractical. 3-5: Challenging, significant barriers. 6-8: Feasible with reasonable effort. 9-10: Straightforward to implement.",
  },
  {
    name: "Usefulness",
    description: "The practical value and benefit the solution delivers.",
    guidelines:
      "0-2: Minimal value. 3-5: Limited benefit. 6-8: Clear, meaningful benefit. 9-10: Significant organizational value.",
  },
  {
    name: "Maintenance / Sustainability",
    description: "How easily the improvement can be sustained over time.",
    guidelines:
      "0-2: Unsustainable without constant effort. 3-5: Needs ongoing attention. 6-8: Mostly self-sustaining. 9-10: Fully self-sustaining and institutionalized.",
  },
];

const CATEGORIES: Array<{ name: string; icon: string; description: string }> = [
  {
    name: "Store Operations",
    icon: "Store",
    description: "Day-to-day store floor and till operations",
  },
  { name: "Inventory", icon: "Package", description: "Stock counting, storage, and supply chain" },
  {
    name: "Customer Service",
    icon: "Headset",
    description: "Customer-facing interactions and support",
  },
  { name: "Technology", icon: "Laptop", description: "Software, hardware, and IT systems" },
  { name: "Marketing", icon: "Megaphone", description: "Promotions, campaigns, and branding" },
  {
    name: "Finance",
    icon: "IndianRupee",
    description: "Billing, accounts, and financial processes",
  },
  { name: "Security", icon: "Shield", description: "Physical and information security" },
  { name: "HR", icon: "Users", description: "People, hiring, and workplace policies" },
  {
    name: "Administration",
    icon: "ClipboardList",
    description: "Office administration and paperwork",
  },
  { name: "Maintenance", icon: "Wrench", description: "Equipment, facilities, and upkeep" },
  { name: "Quality", icon: "BadgeCheck", description: "Quality control and process standards" },
  { name: "Other", icon: "MoreHorizontal", description: "Anything that doesn't fit elsewhere" },
];

/** The 10 MVP achievements from docs/engineering/01_DATABASE_SCHEMA.md. `criteria` shapes are
 * consumed by GamificationService.meetsCriteria — keep the two in sync if either changes. */
const ACHIEVEMENTS: Array<{
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  criteria: Record<string, unknown>;
}> = [
  {
    code: "FIRST_KAIZEN",
    name: "First Kaizen",
    description: "Submit your first Kaizen idea.",
    icon: "Lightbulb",
    rarity: "COMMON",
    criteria: { type: "IDEAS_SUBMITTED", threshold: 1 },
  },
  {
    code: "FIVE_SUBMISSIONS",
    name: "Idea Machine",
    description: "Submit 5 Kaizen ideas.",
    icon: "FileStack",
    rarity: "COMMON",
    criteria: { type: "IDEAS_SUBMITTED", threshold: 5 },
  },
  {
    code: "FIRST_APPROVAL",
    name: "First Approval",
    description: "Get your first Kaizen idea approved.",
    icon: "CheckCircle2",
    rarity: "COMMON",
    criteria: { type: "IDEAS_APPROVED", threshold: 1 },
  },
  {
    code: "FIVE_APPROVALS",
    name: "Proven Improver",
    description: "Get 5 Kaizen ideas approved.",
    icon: "CheckCheck",
    rarity: "RARE",
    criteria: { type: "IDEAS_APPROVED", threshold: 5 },
  },
  {
    code: "IMPLEMENTER",
    name: "Implementer",
    description: "Have one of your ideas fully implemented.",
    icon: "Rocket",
    rarity: "RARE",
    criteria: { type: "IDEAS_IMPLEMENTED", threshold: 1 },
  },
  {
    code: "IMPACT_MAKER",
    name: "Impact Maker",
    description: "Have business impact recorded for one of your ideas.",
    icon: "TrendingUp",
    rarity: "RARE",
    criteria: { type: "BUSINESS_IMPACT_COUNT", threshold: 1 },
  },
  {
    code: "TOP_CONTRIBUTOR",
    name: "Top Contributor",
    description: "Rank in the top 10 of the monthly company leaderboard.",
    icon: "Trophy",
    rarity: "EPIC",
    criteria: { type: "LEADERBOARD_RANK", maxRank: 10 },
  },
  {
    code: "INNOVATION_CHAMPION",
    name: "Innovation Champion",
    description: "Get 10 Kaizen ideas approved.",
    icon: "Sparkles",
    rarity: "EPIC",
    criteria: { type: "IDEAS_APPROVED", threshold: 10 },
  },
  {
    code: "DEPARTMENT_HERO",
    name: "Department Hero",
    description: "Have the most points in your department this month.",
    icon: "Crown",
    rarity: "EPIC",
    criteria: { type: "DEPARTMENT_TOP_RANK" },
  },
  {
    code: "QUALITY_EXPERT",
    name: "Quality Expert",
    description: "Average an evaluation score of 8.0+ across 3 or more approved ideas.",
    icon: "Star",
    rarity: "LEGENDARY",
    criteria: { type: "AVG_EVALUATION_SCORE", minScore: 8.0, minCount: 3 },
  },
];

/** The 8 MVP platform settings from docs/engineering/01_DATABASE_SCHEMA.md. Point values match
 * the "MVP point values" table there; upload/pagination defaults match existing hardcoded
 * behavior elsewhere in the codebase (kept here as the single documented source of truth). */
const PLATFORM_SETTINGS: Array<{ key: string; value: number; description: string }> = [
  { key: "points.kaizen_submitted", value: 10, description: "Points awarded when a Kaizen is submitted." },
  { key: "points.idea_approved", value: 50, description: "Points awarded when a Kaizen is approved." },
  {
    key: "points.implementation_completed",
    value: 100,
    description: "Points awarded when a Kaizen's implementation is completed.",
  },
  {
    key: "points.business_impact_verified",
    value: 150,
    description: "Points awarded when a Kaizen's business impact is recorded and its reward issued.",
  },
  {
    key: "points.achievement_unlocked",
    value: 25,
    description: "Default points awarded when an achievement is unlocked.",
  },
  {
    key: "upload.max_file_size_bytes",
    value: 25 * 1024 * 1024,
    description: "Maximum file size accepted for attachment uploads.",
  },
  {
    key: "upload.max_files_per_kaizen",
    value: 10,
    description: "Maximum number of attachments allowed per Kaizen.",
  },
  { key: "pagination.default_page_size", value: 25, description: "Default page size for list endpoints." },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  for (const [index, category] of CATEGORIES.entries()) {
    const slug = slugify(category.name);
    await prisma.category.upsert({
      where: { slug },
      update: {
        name: category.name,
        icon: category.icon,
        description: category.description,
        sortOrder: index,
      },
      create: {
        name: category.name,
        slug,
        icon: category.icon,
        description: category.description,
        sortOrder: index,
      },
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  await prisma.department.upsert({
    where: { code: "GEN" },
    update: {},
    create: { name: "General", code: "GEN" },
  });
  console.log("Seeded bootstrap department (General / GEN).");

  for (const [index, parameter] of SCORING_PARAMETERS.entries()) {
    const slug = slugify(parameter.name);
    await prisma.scoringParameter.upsert({
      where: { slug },
      update: {
        name: parameter.name,
        description: parameter.description,
        guidelines: parameter.guidelines,
        sortOrder: index,
      },
      create: {
        name: parameter.name,
        slug,
        description: parameter.description,
        guidelines: parameter.guidelines,
        maxScore: 10,
        sortOrder: index,
      },
    });
  }
  console.log(`Seeded ${SCORING_PARAMETERS.length} scoring parameters.`);

  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        criteria: achievement.criteria,
      },
      create: {
        code: achievement.code,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        criteria: achievement.criteria,
      },
    });
  }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievements.`);

  for (const setting of PLATFORM_SETTINGS) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: { key: setting.key, value: setting.value, description: setting.description },
    });
  }
  console.log(`Seeded ${PLATFORM_SETTINGS.length} platform settings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
