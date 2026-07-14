/** Shared `bg-<tone>/opacity text-<tone>` class map for icon dots/badges on a timeline or feed —
 * was independently duplicated (as a subset) in the Dashboard's Activity Timeline and the Review
 * Workspace's Timeline; this is the one copy both import. */
export const TONE_DOT_CLASS: Record<string, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info",
  achievement: "bg-achievement/20 text-achievement-foreground",
  rewards: "bg-rewards/15 text-rewards",
};
