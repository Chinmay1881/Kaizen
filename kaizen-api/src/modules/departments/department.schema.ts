import { z } from "zod";

/** POST /api/v1/departments body — matches the API spec's documented shape exactly. */
export const createDepartmentSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    code: z.string().trim().min(1).max(20),
    managerId: z.string().uuid().optional(),
  })
  .strict();

/** PATCH /api/v1/departments/:id body. */
export const updateDepartmentSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    code: z.string().trim().min(1).max(20).optional(),
    managerId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type CreateDepartmentSchema = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentSchema = z.infer<typeof updateDepartmentSchema>;
