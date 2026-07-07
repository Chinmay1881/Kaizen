import "dotenv/config";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initializeEvents } from "./events/index.js";
import { startBackgroundJobs } from "./jobs/leaderboard-refresh.job.js";

initializeEvents();
startBackgroundJobs();

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[kaizen-api] Server running on http://localhost:${env.PORT}`);
  console.log(`[kaizen-api] Environment: ${env.NODE_ENV}`);
});
