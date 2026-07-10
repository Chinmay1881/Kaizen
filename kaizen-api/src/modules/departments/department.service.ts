import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { auditService } from "../audit/audit.service.js";
import type { CreateDepartmentSchema, UpdateDepartmentSchema } from "./department.schema.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
}

const DEPARTMENT_SELECT = {
  id: true,
  name: true,
  code: true,
  managerId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Reads are open to any authenticated user (per the API spec, "Auth: Required, all roles" for
 * `GET /departments`) — writes (Admin Panel, Milestone "Administration Portal") are Super Admin
 * only, route-guarded, and audit-logged. */
class DepartmentService {
  async list(isActive?: boolean) {
    return prisma.department.findMany({
      where: isActive === undefined ? undefined : { isActive },
      orderBy: { name: "asc" },
      select: DEPARTMENT_SELECT,
    });
  }

  /** POST /api/v1/departments — Super Admin. */
  async create(requester: Requester, input: CreateDepartmentSchema) {
    if (input.managerId) {
      await this.assertManagerExists(input.managerId);
    }

    const department = await this.runUniqueSafe(() =>
      prisma.department.create({
        data: { name: input.name, code: input.code, managerId: input.managerId },
        select: DEPARTMENT_SELECT,
      }),
    );

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "admin.department.create",
      entityType: "Department",
      entityId: department.id,
      newValue: { name: department.name, code: department.code, managerId: department.managerId },
    });

    return department;
  }

  /** PATCH /api/v1/departments/:id — Super Admin. */
  async update(requester: Requester, id: string, input: UpdateDepartmentSchema) {
    const existing = await this.findOrThrow(id);

    if (input.managerId) {
      await this.assertManagerExists(input.managerId);
    }

    const updated = await this.runUniqueSafe(() =>
      prisma.department.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.code !== undefined ? { code: input.code } : {}),
          ...(input.managerId !== undefined ? { managerId: input.managerId } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        select: DEPARTMENT_SELECT,
      }),
    );

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "admin.department.update",
      entityType: "Department",
      entityId: id,
      previousValue: { name: existing.name, code: existing.code, managerId: existing.managerId, isActive: existing.isActive },
      newValue: { name: updated.name, code: updated.code, managerId: updated.managerId, isActive: updated.isActive },
    });

    return updated;
  }

  /** DELETE /api/v1/departments/:id — "Soft-delete." Super Admin. Does not reassign or block on
   * existing Kaizens/users still pointing at this department — deactivating (rather than deleting
   * the row) is exactly why `isActive`/`deletedAt` exist, so those references stay valid. */
  async remove(requester: Requester, id: string): Promise<void> {
    await this.findOrThrow(id);

    await prisma.department.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "admin.department.delete",
      entityType: "Department",
      entityId: id,
      previousValue: { isActive: true },
      newValue: { isActive: false },
    });
  }

  private async findOrThrow(id: string) {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new ApiError("NOT_FOUND", "Department not found.", 404);
    }
    return department;
  }

  private async assertManagerExists(managerId: string): Promise<void> {
    const manager = await prisma.user.findUnique({ where: { id: managerId } });
    if (!manager || !manager.isActive) {
      throw new ApiError("VALIDATION_ERROR", "Manager not found.", 400, [
        { field: "managerId", message: "Manager not found or inactive." },
      ]);
    }
  }

  /** `departments.name`/`departments.code` are both `@unique` — turn the raw Prisma P2002 into a
   * friendly 409 rather than a 500. */
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
        throw new ApiError("CONFLICT", "A department with this name or code already exists.", 409);
      }
      throw error;
    }
  }

  /**
   * Active users in a department, for the Implementation "assign owner" picker (Milestone 8) —
   * there's no company-wide user directory endpoint yet (that's Admin Panel scope), and an
   * implementation owner can't be picked from nothing. Narrowly scoped to exactly that need,
   * matching how Milestone 4 bootstrapped a single department for the same "no Admin Panel yet"
   * reason.
   */
  async listUsers(departmentId: string) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      throw new ApiError("NOT_FOUND", "Department not found.", 404);
    }

    return prisma.user.findMany({
      where: { departmentId, isActive: true },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, role: true, jobTitle: true },
    });
  }
}

export const departmentService = new DepartmentService();
