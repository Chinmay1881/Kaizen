import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { slugify } from "../../utils/slugify.js";
import { auditService } from "../audit/audit.service.js";
import type { CreateCategorySchema, UpdateCategorySchema } from "./category.schema.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
}

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  icon: true,
  sortOrder: true,
  isActive: true,
} as const;

/** Reads are open to any authenticated user (per the API spec, "Auth: Required" for
 * `GET /categories`) — writes (Admin Panel) are Super Admin only, route-guarded, and
 * audit-logged. No DELETE is documented for categories — `isActive` is the only retirement path,
 * matching `updateCategorySchema`. */
class CategoryService {
  async list(isActive?: boolean) {
    return prisma.category.findMany({
      where: isActive === undefined ? undefined : { isActive },
      orderBy: { sortOrder: "asc" },
      select: CATEGORY_SELECT,
    });
  }

  /** POST /api/v1/categories — Super Admin. New categories sort after every existing one unless
   * `sortOrder` is given explicitly. */
  async create(requester: Requester, input: CreateCategorySchema) {
    const slug = slugify(input.name);

    const sortOrder =
      input.sortOrder ??
      (await prisma.category
        .aggregate({ _max: { sortOrder: true } })
        .then((result) => (result._max.sortOrder ?? -1) + 1));

    const category = await this.runUniqueSafe(() =>
      prisma.category.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          icon: input.icon,
          sortOrder,
        },
        select: CATEGORY_SELECT,
      }),
    );

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "admin.category.create",
      entityType: "Category",
      entityId: category.id,
      newValue: { name: category.name, slug: category.slug },
    });

    return category;
  }

  /** PATCH /api/v1/categories/:id — Super Admin. Re-slugs from `name` on rename, matching
   * `create`'s slug derivation exactly. */
  async update(requester: Requester, id: string, input: UpdateCategorySchema) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Category not found.", 404);
    }

    const updated = await this.runUniqueSafe(() =>
      prisma.category.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name, slug: slugify(input.name) } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.icon !== undefined ? { icon: input.icon } : {}),
          ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        select: CATEGORY_SELECT,
      }),
    );

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "admin.category.update",
      entityType: "Category",
      entityId: id,
      previousValue: { name: existing.name, isActive: existing.isActive },
      newValue: { name: updated.name, isActive: updated.isActive },
    });

    return updated;
  }

  /** `categories.name`/`categories.slug` are both `@unique` — turn the raw Prisma P2002 into a
   * friendly 409 rather than a 500 (same convention as `department.service.ts`). */
  private async runUniqueSafe<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        throw new ApiError("CONFLICT", "A category with this name already exists.", 409);
      }
      throw error;
    }
  }
}

export const categoryService = new CategoryService();
