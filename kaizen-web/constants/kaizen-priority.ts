import type { KaizenPriority } from "@/types/enums";

export const KAIZEN_PRIORITIES: KaizenPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const KAIZEN_PRIORITY_LABELS: Record<KaizenPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};
