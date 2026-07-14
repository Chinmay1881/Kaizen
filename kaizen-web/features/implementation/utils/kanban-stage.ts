import type { Implementation } from "@/features/implementation/types/implementation";

export type KanbanStage = "PLANNED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";

export const KANBAN_STAGE_LABEL: Record<KanbanStage, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

export const KANBAN_STAGE_BADGE_CLASS: Record<KanbanStage, string> = {
  PLANNED: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-info/15 text-info",
  BLOCKED: "bg-destructive/15 text-destructive",
  COMPLETED: "bg-success/15 text-success",
};

/**
 * There's no `stage`/`isBlocked` field in the data model — this app's real Kanban-relevant
 * fields are `progressPercent`, `dueDate`, and `completedAt`. "Blocked" specifically is an
 * honest overdue proxy (same one the Review Workspace's Mission Critical section uses for
 * overdue implementations), not a fabricated flag: past due and not yet complete is a
 * defensible, disclosed stand-in for "needs attention," computed purely from real fields.
 */
export function getKanbanStage(implementation: Implementation): KanbanStage {
  if (implementation.completedAt) return "COMPLETED";

  const isOverdue = Boolean(implementation.dueDate && new Date(implementation.dueDate).getTime() < Date.now());
  if (isOverdue) return "BLOCKED";

  if (implementation.progressPercent > 0) return "IN_PROGRESS";

  return "PLANNED";
}
