// Prisma seed script — will be implemented with database models.
// See docs/engineering/01_DATABASE_SCHEMA.md

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed script ready. No models defined yet.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
