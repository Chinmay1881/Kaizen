import { verifyWebhook } from "@clerk/express/webhooks";
import { Router } from "express";

import { env } from "../config/env.js";
import { authService } from "../modules/auth/auth.service.js";
import { normalizeWebhookUser } from "../modules/auth/clerk-user.mapper.js";
import { sendError, sendSuccess } from "../utils/api-response.js";

export const clerkWebhookRouter = Router();

clerkWebhookRouter.post("/", async (req, res) => {
  if (!env.CLERK_WEBHOOK_SECRET) {
    sendError(res, "SERVICE_UNAVAILABLE", "Clerk webhook is not configured.", 503);
    return;
  }

  let event;
  try {
    event = await verifyWebhook(req, { signingSecret: env.CLERK_WEBHOOK_SECRET });
  } catch (error) {
    console.error("[kaizen-api] Clerk webhook signature verification failed:", error);
    sendError(res, "INVALID_SIGNATURE", "Webhook signature verification failed.", 400);
    return;
  }

  try {
    switch (event.type) {
      case "user.created":
      case "user.updated":
        await authService.syncUser(normalizeWebhookUser(event.data));
        break;
      case "user.deleted":
        if (event.data.id) {
          await authService.softDeleteByClerkId(event.data.id);
        }
        break;
      default:
        // Not a user lifecycle event — nothing for the auth module to do with it.
        break;
    }

    sendSuccess(res, { received: true });
  } catch (error) {
    console.error("[kaizen-api] Clerk webhook handling failed:", error);
    sendError(res, "WEBHOOK_HANDLER_ERROR", "Failed to process webhook event.", 500);
  }
});
