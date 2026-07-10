import { z } from "zod";

/** PATCH /api/v1/admin/settings body — matches the API spec's documented shape exactly:
 * `{ "settings": [{ "key": "...", "value": ... }] }`. `value` is intentionally untyped — settings
 * are heterogeneous (numbers for `points.*`, etc.) and stored as JSONB. */
export const updateSettingsSchema = z
  .object({
    settings: z
      .array(
        z.object({
          key: z.string().trim().min(1).max(100),
          value: z.unknown(),
        }),
      )
      .min(1),
  })
  .strict();

export type UpdateSettingsSchema = z.infer<typeof updateSettingsSchema>;
