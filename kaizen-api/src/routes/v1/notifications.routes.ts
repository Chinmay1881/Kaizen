import { Router, type Request } from "express";

import { validate } from "../../middleware/validate.js";
import {
  listNotificationsQuerySchema,
  type ListNotificationsQuerySchema,
} from "../../modules/notifications/notification.schema.js";
import { notificationService } from "../../modules/notifications/notification.service.js";
import { ApiError } from "../../utils/api-error.js";
import { sendSuccess } from "../../utils/api-response.js";

export const notificationsRouter = Router();

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError("UNAUTHORIZED", "Authentication required.", 401);
  }
  return req.user;
}

notificationsRouter.get(
  "/",
  validate(listNotificationsQuerySchema, "query"),
  async (req, res, next) => {
    try {
      const requester = requireUser(req);
      const { items, meta } = await notificationService.list(
        requester.id,
        req.query as unknown as ListNotificationsQuerySchema,
      );
      sendSuccess(res, items, 200, meta);
    } catch (error) {
      next(error);
    }
  },
);

notificationsRouter.get("/unread-count", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await notificationService.getUnreadCount(requester.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

notificationsRouter.post("/read-all", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const result = await notificationService.markAllRead(requester.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

notificationsRouter.patch("/:id/read", async (req, res, next) => {
  try {
    const requester = requireUser(req);
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new ApiError("VALIDATION_ERROR", 'Missing route parameter "id".', 400);
    }
    const notification = await notificationService.markRead(id, requester.id);
    sendSuccess(res, notification);
  } catch (error) {
    next(error);
  }
});
