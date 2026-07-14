import type { CorsOptions } from "cors";

import { env } from "./env.js";

/** `cors`'s array-form `origin` does an exact string match against the request's `Origin` header
 * — a trailing slash in `CORS_ORIGIN` (e.g. `https://frontend.up.railway.app/`, easy to paste in
 * a deployment dashboard) silently fails to match `https://frontend.up.railway.app` and the
 * browser blocks every cross-origin request with no server-side error at all. Stripped here so
 * the env var works with or without one. */
const allowedOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
