import { z } from "zod";

/** GET /notifications query params — matches the API spec's `isRead` filter + standard pagination. */
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  isRead: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export type ListNotificationsQuerySchema = z.infer<typeof listNotificationsQuerySchema>;
