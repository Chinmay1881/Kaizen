import { Router } from "express";

import { env } from "../config/env.js";
import { sendSuccess } from "../utils/api-response.js";

export const clerkWebhookRouter = Router();

clerkWebhookRouter.post("/", (req, res) => {
  if (!env.CLERK_WEBHOOK_SECRET) {
    res.status(503).json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Clerk webhook is not configured.",
      },
    });
    return;
  }

  // Webhook signature verification and user sync will be implemented with the database layer.
  sendSuccess(res, { received: true });
});
