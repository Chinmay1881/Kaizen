import { Router } from "express";

import { attachUser, clerkAuth, requireAuth } from "../middleware/auth.js";
import { adminRouter } from "./v1/admin.routes.js";
import { analyticsRouter } from "./v1/analytics.routes.js";
import { categoriesRouter } from "./v1/categories.routes.js";
import { departmentsRouter } from "./v1/departments.routes.js";
import { gamificationRouter } from "./v1/gamification.routes.js";
import { implementationsRouter } from "./v1/implementations.routes.js";
import { kaizensRouter } from "./v1/kaizens.routes.js";
import { meRouter } from "./v1/me.routes.js";
import { notificationsRouter } from "./v1/notifications.routes.js";
import { reviewsRouter } from "./v1/reviews.routes.js";
import { savedViewsRouter } from "./v1/saved-views.routes.js";
import { scoringRouter } from "./v1/scoring.routes.js";
import { searchRouter } from "./v1/search.routes.js";
import { usersRouter } from "./v1/users.routes.js";

export const v1Router = Router();

v1Router.use(clerkAuth);

v1Router.use("/me", requireAuth, attachUser, meRouter);
v1Router.use("/departments", requireAuth, attachUser, departmentsRouter);
v1Router.use("/categories", requireAuth, attachUser, categoriesRouter);
v1Router.use("/kaizens", requireAuth, attachUser, kaizensRouter);
v1Router.use("/reviews", requireAuth, attachUser, reviewsRouter);
v1Router.use("/scoring", requireAuth, attachUser, scoringRouter);
v1Router.use("/implementations", requireAuth, attachUser, implementationsRouter);
v1Router.use("/notifications", requireAuth, attachUser, notificationsRouter);
v1Router.use("/users", requireAuth, attachUser, usersRouter);
v1Router.use("/admin", requireAuth, attachUser, adminRouter);
v1Router.use("/analytics", requireAuth, attachUser, analyticsRouter);
v1Router.use("/search", requireAuth, attachUser, searchRouter);
v1Router.use("/saved-views", requireAuth, attachUser, savedViewsRouter);
// Mounted at root: resolves to the API spec's unprefixed `/leaderboard` and `/achievements` paths.
v1Router.use("/", requireAuth, attachUser, gamificationRouter);
