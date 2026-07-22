import { clerkClient } from "@clerk/express";
import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { buildPaginationMeta, getSkipTake } from "../../utils/pagination.js";
import { auditService } from "../audit/audit.service.js";
import { authService } from "../auth/auth.service.js";
import { normalizeApiUser } from "../auth/clerk-user.mapper.js";
import type { CreateUserSchema, ListUsersQuerySchema, UpdateUserSchema } from "./admin-user.schema.js";
import type { AdminUserItem, PaginatedAdminUsers } from "./admin-user.types.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
}

const ADMIN_USER_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
} as const;

type AdminUserRow = Prisma.UserGetPayload<{ include: typeof ADMIN_USER_INCLUDE }>;

function toAdminUserItem(user: AdminUserRow): AdminUserItem {
  return {
    id: user.id,
    employeeCode: user.employeeCode,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    role: user.role,
    department: user.department,
    jobTitle: user.jobTitle,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Backs the API spec's "Users (Admin)" section. All writes are Super-Admin-only (route-guarded)
 * and audit-logged; `create` reuses `authService.syncUser` (Milestone 2) for the actual local-row
 * creation rather than duplicating it — this module only adds the Clerk-account creation and the
 * `departmentId` assignment, which are genuinely outside that method's existing scope. */
class AdminUserService {
  /** GET /api/v1/users — Super Admin. */
  async list(query: ListUsersQuerySchema): Promise<PaginatedAdminUsers> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
    const { skip, take } = getSkipTake({ page, pageSize });

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { displayName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: ADMIN_USER_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: rows.map(toAdminUserItem),
      meta: buildPaginationMeta({ page, pageSize }, total),
    };
  }

  /** GET /api/v1/users/:id — "Super Admin, HR, CMD (read only)"; route-guarded via
   * `requireRole("HR")` (hierarchy covers HR/CMD/Super Admin exactly). */
  async getById(id: string): Promise<AdminUserItem> {
    const user = await prisma.user.findUnique({ where: { id }, include: ADMIN_USER_INCLUDE });
    if (!user) {
      throw new ApiError("NOT_FOUND", "User not found.", 404);
    }
    return toAdminUserItem(user);
  }

  /** POST /api/v1/users — "Create user record and invite via Clerk." Creates the Clerk account
   * (`skipPasswordRequirement` — the created user completes their own sign-in via Clerk's normal
   * forgot-password/passwordless flow, which functions as the invite), then syncs it into `users`
   * via the exact same `authService.syncUser` the webhook and JIT-sync fallback already use (no
   * duplicate user-creation logic), then sets `departmentId` — a field outside `syncUser`'s
   * existing scope (it's only ever populated by an admin action, never by Clerk itself). */
  async create(requester: Requester, input: CreateUserSchema): Promise<AdminUserItem> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ApiError("CONFLICT", "A user with this email already exists.", 409, [
        { field: "email", message: "A user with this email already exists." },
      ]);
    }

    if (input.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!department) {
        throw new ApiError("VALIDATION_ERROR", "Department not found.", 400, [
          { field: "departmentId", message: "Department not found." },
        ]);
      }
    }

    let clerkUser;
    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [input.email],
        firstName: input.firstName,
        lastName: input.lastName,
        skipPasswordRequirement: true,
        publicMetadata: { role: input.role },
      });
    } catch {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Could not create the Clerk account for this email — it may already be in use.",
        400,
        [{ field: "email", message: "Could not create a Clerk account for this email." }],
      );
    }

    await authService.syncUser(normalizeApiUser(clerkUser));

    if (input.departmentId) {
      await prisma.user.update({
        where: { clerkId: clerkUser.id },
        data: { departmentId: input.departmentId },
      });
    }

    const created = await prisma.user.findUniqueOrThrow({
      where: { clerkId: clerkUser.id },
      include: ADMIN_USER_INCLUDE,
    });

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "admin.user.create",
      entityType: "User",
      entityId: created.id,
      newValue: { email: created.email, role: created.role, departmentId: created.departmentId },
    });

    return toAdminUserItem(created);
  }

  /** PATCH /api/v1/users/:id — Super Admin. */
  async update(requester: Requester, id: string, input: UpdateUserSchema): Promise<AdminUserItem> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "User not found.", 404);
    }

    if (input.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!department) {
        throw new ApiError("VALIDATION_ERROR", "Department not found.", 400, [
          { field: "departmentId", message: "Department not found." },
        ]);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: ADMIN_USER_INCLUDE,
    });

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "admin.user.update",
      entityType: "User",
      entityId: id,
      previousValue: {
        role: existing.role,
        departmentId: existing.departmentId,
        isActive: existing.isActive,
      },
      newValue: { role: updated.role, departmentId: updated.departmentId, isActive: updated.isActive },
    });

    return toAdminUserItem(updated);
  }

  /** DELETE /api/v1/users/:id — "Soft-delete user." Same `isActive:false, deletedAt` shape as
   * `authService.softDeleteByClerkId` (the webhook's `user.deleted` handler), just entered from an
   * admin action by internal id rather than a Clerk event by `clerkId`. */
  async remove(requester: Requester, id: string): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "User not found.", 404);
    }
    if (existing.id === requester.id) {
      throw new ApiError("FORBIDDEN", "You cannot deactivate your own account.", 403);
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });

    await auditService.record({
      userId: requester.id,
      userRole: requester.role,
      action: "admin.user.delete",
      entityType: "User",
      entityId: id,
      previousValue: { isActive: true },
      newValue: { isActive: false },
    });
  }
}

export const adminUserService = new AdminUserService();
