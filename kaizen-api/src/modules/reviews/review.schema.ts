import { z } from "zod";

import { KAIZEN_PRIORITIES } from "../../constants/kaizen-priority.js";

/** GET /reviews/queue query params — mirrors kaizen.schema.ts's listKaizensQuerySchema shape
 * (same `sort` convention already established there) plus `departmentId` for HR/CMD/Super Admin. */
export const reviewQueueQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().trim().max(300).optional(),
  categoryId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  priority: z.enum(KAIZEN_PRIORITIES).optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.enum(["newest", "oldest", "updated"]).optional(),
});

/** POST /kaizens/:id/review/{approve,reject,needs-changes} body — `notes` matches the API
 * spec's documented shape (`{ "notes": "..." }`) and the `remarks` validation rule (0–2000 chars). */
export const reviewActionSchema = z
  .object({
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

/** POST /kaizens/:id/comments body — matches the API spec's `comment.body` (1–2000 chars) rule
 * and documented `{ body, parentId }` shape. */
export const createCommentSchema = z
  .object({
    body: z.string().trim().min(1).max(2000),
    parentId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type ReviewQueueQuerySchema = z.infer<typeof reviewQueueQuerySchema>;
export type ReviewActionSchema = z.infer<typeof reviewActionSchema>;
export type CreateCommentSchema = z.infer<typeof createCommentSchema>;
