import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";

/**
 * Read-only for now — POST/PATCH/DELETE are Super Admin (Admin Panel) scope and intentionally
 * not implemented yet. This exists only so the Kaizen Wizard's department picker has data.
 */
class DepartmentService {
  async list(isActive?: boolean) {
    return prisma.department.findMany({
      where: isActive === undefined ? undefined : { isActive },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, isActive: true },
    });
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
