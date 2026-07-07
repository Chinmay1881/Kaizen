import { Router } from "express";

import { sendSuccess } from "../../utils/api-response.js";

export const meRouter = Router();

meRouter.get("/", (req, res) => {
  sendSuccess(res, {
    clerkId: req.auth?.clerkId ?? null,
    message: "Authenticated. User profile will be available after database setup.",
  });
});
