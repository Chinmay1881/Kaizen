import { Router } from "express";

import { attachUser, clerkAuth, requireAuth } from "../middleware/auth.js";
import { meRouter } from "./v1/me.routes.js";

export const v1Router = Router();

v1Router.use(clerkAuth);

v1Router.use("/me", requireAuth, attachUser, meRouter);
