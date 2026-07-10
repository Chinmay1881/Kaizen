import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";
import type { KaizenStatus } from "@/types/enums";

export const KAIZEN_STATUS_LABELS: Record<KaizenStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  NEEDS_CHANGES: "Needs Changes",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  IMPLEMENTATION_IN_PROGRESS: "Implementation In Progress",
  IMPLEMENTATION_COMPLETED: "Implementation Completed",
  BUSINESS_IMPACT_RECORDED: "Business Impact Recorded",
  REWARD_ISSUED: "Reward Issued",
  ARCHIVED: "Archived",
  PUBLISHED_TO_KNOWLEDGE_BASE: "Published",
};

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** Colors per docs/product DASH-001's status legend (Draft=gray, Pending/Submitted=yellow,
 * Approved=green, Rejected=red, Needs Changes=blue, Implemented=purple). No "purple" design
 * token exists, so completed/rewarded states reuse `secondary` (Premium Gold — an achievement
 * color already, a good semantic fit). Statuses the legend doesn't cover get a reasonable
 * extrapolation (in-progress work = info/blue, terminal/inactive = outline). */
export const KAIZEN_STATUS_BADGE_VARIANT: Record<KaizenStatus, BadgeVariant> = {
  DRAFT: "outline",
  SUBMITTED: "warning",
  UNDER_REVIEW: "info",
  NEEDS_CHANGES: "info",
  REJECTED: "destructive",
  APPROVED: "success",
  IMPLEMENTATION_IN_PROGRESS: "info",
  IMPLEMENTATION_COMPLETED: "success",
  BUSINESS_IMPACT_RECORDED: "success",
  REWARD_ISSUED: "secondary",
  ARCHIVED: "outline",
  PUBLISHED_TO_KNOWLEDGE_BASE: "secondary",
};
