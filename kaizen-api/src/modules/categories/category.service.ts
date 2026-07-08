import { prisma } from "../../lib/prisma.js";

/**
 * Read-only for now — POST/PATCH are Super Admin (Admin Panel) scope and intentionally not
 * implemented yet. This exists only so the Kaizen Wizard's category picker has data.
 */
class CategoryService {
  async list(isActive?: boolean) {
    return prisma.category.findMany({
      where: isActive === undefined ? undefined : { isActive },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, description: true, icon: true, isActive: true },
    });
  }
}

export const categoryService = new CategoryService();
