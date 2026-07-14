import multer, { MulterError } from "multer";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

/** Memory storage — files are held as an in-process `Buffer` (never written to disk) and streamed
 * straight to Cloudinary by the caller. `limits.fileSize` reuses the same `MAX_FILE_SIZE_BYTES`
 * config the Kaizen Wizard's frontend already enforces client-side (`step-6-attachments.tsx`), so
 * both sides agree on the same 25 MB default without duplicating the number. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_BYTES },
});

/** Wraps `multer.single(fieldName)` so a `MulterError` (oversized file, wrong field name, etc.)
 * becomes a normal `ApiError` handled by the existing global `errorHandler` — otherwise it falls
 * through as an unhandled 500 with no useful message. */
export function uploadSingleFile(fieldName: string): RequestHandler {
  const middleware = upload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (error: unknown) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof MulterError) {
        const message =
          error.code === "LIMIT_FILE_SIZE"
            ? `File is larger than ${Math.round(env.MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB.`
            : error.message;
        next(new ApiError("VALIDATION_ERROR", message, 400, [{ field: fieldName, message }]));
        return;
      }

      next(error);
    });
  };
}
