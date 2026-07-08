import { z } from "zod";

export const updateMeSchema = z
  .object({
    jobTitle: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(20).optional(),
  })
  .strict();

export type UpdateMeSchema = z.infer<typeof updateMeSchema>;
