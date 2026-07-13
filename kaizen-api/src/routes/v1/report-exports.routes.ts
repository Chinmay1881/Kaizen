import { Router, type Request } from "express";

import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import {
  createExportSchema,
  listExportsQuerySchema,
  type CreateExportSchema,
  type ListExportsQuerySchema,
} from "../../modules/report-exports/report-export.schema.js";
import { reportExportService } from "../../modules/report-exports/report-export.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

/** Same RBAC floor as `reportsRouter` (Chunk 3A) — the finer "Department Manager: Department
 * reports only" rule lives inside `ReportService.assertCanGenerate`, reached via
 * `ReportExportService` -> `reportService.generateReport`, so it's enforced identically for
 * exports without a second copy of the rule (Part 11). */
export const reportExportsRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string") {
    throw new ApiError("VALIDATION_ERROR", `Missing route parameter "${name}".`, 400);
  }
  return value;
}

reportExportsRouter.post(
  "/",
  requireRole("DEPARTMENT_MANAGER"),
  validate(createExportSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const result = await reportExportService.createExport(requester, req.body as CreateExportSchema);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  },
);

reportExportsRouter.get(
  "/",
  requireRole("DEPARTMENT_MANAGER"),
  validate(listExportsQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { items, meta } = await reportExportService.list(requester, req.query as unknown as ListExportsQuerySchema);
      sendSuccess(res, items, 200, meta);
    } catch (error) {
      next(error);
    }
  },
);

reportExportsRouter.get("/:id", requireRole("DEPARTMENT_MANAGER"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await reportExportService.getStatus(requester, requireParam(req, "id"));
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

reportExportsRouter.get("/:id/download", requireRole("DEPARTMENT_MANAGER"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await reportExportService.download(requester, requireParam(req, "id"));
    if ("redirectUrl" in result) {
      res.redirect(302, result.redirectUrl);
      return;
    }
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.setHeader("Content-Length", String(result.buffer.byteLength));
    res.status(200).send(result.buffer);
  } catch (error) {
    next(error);
  }
});

reportExportsRouter.delete("/:id", requireRole("DEPARTMENT_MANAGER"), async (req, res, next) => {
  try {
    const requester = requireUser(req);
    await reportExportService.remove(requester, requireParam(req, "id"));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
