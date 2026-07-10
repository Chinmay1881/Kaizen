import { z } from "zod";

import { USER_ROLES } from "../../constants/roles.js";

/** GET /api/v1/users query params — matches the API spec exactly (`page`, `pageSize`, `search`,
 * `role`, `departmentId`, `isActive`). */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(200).optional(),
  role: z.enum(USER_ROLES).optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

/** POST /api/v1/users body — matches the API spec's documented shape exactly. */
export const createUserSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    role: z.enum(USER_ROLES),
    departmentId: z.string().uuid().optional(),
  })
  .strict();

/** PATCH /api/v1/users/:id body — matches the API spec's documented shape exactly. */
export const updateUserSchema = z
  .object({
    role: z.enum(USER_ROLES).optional(),
    departmentId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export type ListUsersQuerySchema = z.infer<typeof listUsersQuerySchema>;
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
