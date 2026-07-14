import type { BadgeProps } from "@/components/ui/badge";
import type { EstimatedImpact, KaizenPriority } from "@/types/enums";

export const PRIORITY_BADGE_VARIANT: Record<KaizenPriority, NonNullable<BadgeProps["variant"]>> = {
  LOW: "outline",
  MEDIUM: "info",
  HIGH: "warning",
  CRITICAL: "destructive",
};

export const IMPACT_BADGE_VARIANT: Record<EstimatedImpact, NonNullable<BadgeProps["variant"]>> = {
  LOW: "outline",
  MEDIUM: "info",
  HIGH: "rewards",
  MAJOR: "achievement",
};

export const IMPACT_LABELS: Record<EstimatedImpact, string> = {
  LOW: "Low Impact",
  MEDIUM: "Medium Impact",
  HIGH: "High Impact",
  MAJOR: "Major Impact",
};
