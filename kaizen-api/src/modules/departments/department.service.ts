import { prisma } from "../../lib/prisma.js";

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
}

export const departmentService = new DepartmentService();
