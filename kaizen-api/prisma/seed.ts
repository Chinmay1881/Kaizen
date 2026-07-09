// Prisma seed script.
// Categories are the 12 fixed values from docs/product/02_PRODUCT_REQUIREMENTS.md (KAIZEN-001),
// which also describes the Step 1 category cards as needing an icon + short description each.
// Icon names are Lucide component names (matches docs/design/01_DESIGN_SYSTEM.md: "Lucide React").
// Scoring parameters are the 5 fixed MVP defaults from SCORE-001 / docs/engineering/01_DATABASE_SCHEMA.md
// (Milestone 7). Achievements / platform settings are still deliberately NOT seeded — Gamification
// hasn't started.
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
