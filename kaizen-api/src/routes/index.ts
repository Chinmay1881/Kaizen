import { Router } from "express";

import { attachUser, clerkAuth, requireAuth } from "../middleware/auth.js";
import { categoriesRouter } from "./v1/categories.routes.js";
import { departmentsRouter } from "./v1/departments.routes.js";
import { kaizensRouter } from "./v1/kaizens.routes.js";
import { meRouter } from "./v1/me.routes.js";
import { reviewsRouter } from "./v1/reviews.routes.js";

export const v1Router = Router();

v1Router.use(clerkAuth);

v1Router.use("/me", requireAuth, attachUser, meRouter);
v1Router.use("/departments", requireAuth, attachUser, departmentsRouter);
v1Router.use("/categories", requireAuth, attachUser, categoriesRouter);
v1Router.use("/kaizens", requireAuth, attachUser, kaizensRouter);
v1Router.use("/reviews", requireAuth, attachUser, reviewsRouter);
