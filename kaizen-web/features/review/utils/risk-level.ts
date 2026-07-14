import type { KaizenPriority } from "@/types/enums";

/** "Risk Level" has no dedicated field in this data model — rather than invent a separate score,
 * this is a direct, documented 1:1 relabeling of the real `priority` field into risk language
 * (a CRITICAL-priority idea genuinely does warrant more scrutiny before approving). Nothing new
 * is computed or fabricated; it's the same value the Priority badge already shows, framed for
 * the Decision Center's "how much attention does this need" context. */
export const RISK_LEVEL_LABEL: Record<KaizenPriority, string> = {
  CRITICAL: "High",
  HIGH: "Elevated",
  MEDIUM: "Moderate",
  LOW: "Low",
};

export const RISK_LEVEL_TONE: Record<KaizenPriority, "destructive" | "warning" | "info" | "outline"> = {
  CRITICAL: "destructive",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "outline",
};
