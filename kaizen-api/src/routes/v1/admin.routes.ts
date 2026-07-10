import { Router, type Request } from "express";

import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { updateSettingsSchema } from "../../modules/admin/platform-settings.schema.js";
import { platformSettingsService } from "../../modules/admin/platform-settings.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

/** Only `GET/PATCH /admin/settings`, matching this module's explicit scope (Platform Settings).
 * `admin/scoring-parameters`, `admin/audit-logs`, `admin/announcements` are documented under the
 * same "Admin" API-spec section but were not part of the requested Administration Portal scope
 * (User/Role/Department/Category Management, Platform Settings) — left for a future module. */
export const adminRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

adminRouter.get("/settings", requireRole("SUPER_ADMIN"), async (_req, res, next) => {
  try {
    const settings = await platformSettingsService.list();
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch(
  "/settings",
  requireRole("SUPER_ADMIN"),
  validate(updateSettingsSchema),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const settings = await platformSettingsService.update(requester, req.body);
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  },
);
