import { gamificationService } from "../modules/gamification/gamification.service.js";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/** Matches the "refreshed on reward events and every 5 minutes (cron)" note on
 * `leaderboard_snapshots` in docs/engineering/01_DATABASE_SCHEMA.md. Implemented with a plain
 * `setInterval` rather than a cron library (no scheduler dependency is installed in this
 * codebase) — this process runs as a single long-lived Node server, so an interval timer covers
 * the same "periodic background refresh" need without a new dependency. Reads
 * (`GamificationService.getLeaderboard`) don't depend on this running — they recompute inline —
 * so a missed or delayed tick never surfaces stale data to a caller. */
export function startBackgroundJobs() {
  setInterval(() => {
    void gamificationService.recomputeAllLeaderboards().catch((error: unknown) => {
      console.error("[kaizen-api] Leaderboard refresh job failed:", error);
    });
  }, REFRESH_INTERVAL_MS);
}
