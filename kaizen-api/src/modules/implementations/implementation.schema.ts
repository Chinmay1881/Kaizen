import { z } from "zod";

/** GET /implementations query params — mirrors kaizen.schema.ts/review.schema.ts's pagination
 * convention. */
export const listImplementationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().trim().max(300).optional(),
  departmentId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
});

/** POST /kaizens/:id/implementation/assign body — matches the API spec's documented shape. */
export const assignImplementationSchema = z
  .object({
    ownerId: z.string().uuid(),
    assignedDepartmentId: z.string().uuid(),
    dueDate: z.coerce.date().optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

/** PATCH /kaizens/:id/implementation body. */
export const updateImplementationSchema = z
  .object({
    progressPercent: z.number().int().min(0).max(100).optional(),
    description: z.string().trim().max(2000).optional(),
    estimatedCost: z.number().min(0).optional(),
    actualCost: z.number().min(0).optional(),
    timeTakenDays: z.number().int().min(0).optional(),
  })
  .strict();

/** POST /kaizens/:id/implementation/complete body. */
export const completeImplementationSchema = z
  .object({
    completionNotes: z.string().trim().max(2000).optional(),
  })
  .strict();

/** POST /kaizens/:id/implementation/verify body. */
export const verifyImplementationSchema = z
  .object({
    status: z.enum(["VERIFIED", "REJECTED"]),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

/** POST /kaizens/:id/implementation/attachments body — matches the Kaizen attachments shape
 * already documented for the analogous (not-yet-built) `POST /kaizens/:id/attachments`. */
export const registerImplementationAttachmentSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    fileType: z.enum(["IMAGE", "VIDEO", "PDF", "DOCUMENT", "SPREADSHEET", "PRESENTATION", "OTHER"]),
    mimeType: z.string().trim().min(1).max(100),
    fileSizeBytes: z.coerce
      .number()
      .int()
      .min(1)
      .max(25 * 1024 * 1024),
    cloudinaryPublicId: z.string().trim().min(1).max(255),
    cloudinarySecureUrl: z.string().trim().url(),
  })
  .strict();

export type ListImplementationsQuerySchema = z.infer<typeof listImplementationsQuerySchema>;
export type AssignImplementationSchema = z.infer<typeof assignImplementationSchema>;
export type UpdateImplementationSchema = z.infer<typeof updateImplementationSchema>;
export type CompleteImplementationSchema = z.infer<typeof completeImplementationSchema>;
export type VerifyImplementationSchema = z.infer<typeof verifyImplementationSchema>;
export type RegisterImplementationAttachmentSchema = z.infer<
  typeof registerImplementationAttachmentSchema
>;
