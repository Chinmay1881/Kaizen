/** Shared by prisma/seed.ts (categories) and category.service.ts (admin-created categories) so
 * both produce slugs the same way. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
