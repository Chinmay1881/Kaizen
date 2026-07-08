// Prisma seed script.
// Categories are the 12 fixed values from docs/product/02_PRODUCT_REQUIREMENTS.md (KAIZEN-001),
// which also describes the Step 1 category cards as needing an icon + short description each.
// Icon names are Lucide component names (matches docs/design/01_DESIGN_SYSTEM.md: "Lucide React").
// Scoring parameters / achievements / platform settings are deliberately NOT seeded here yet —
// they belong to the Review & Scoring and Gamification milestones, which haven't started.
//
// The single "General" department is a pragmatic bootstrap, not something the docs asked for:
// kaizens.department_id is NOT NULL, but real department management is Admin Panel scope (not
// built yet), so without this every Kaizen submission would be permanently blocked on a required
// field with no way to populate it. Real departments should eventually replace/supersede this
// once the Admin Panel exists.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
