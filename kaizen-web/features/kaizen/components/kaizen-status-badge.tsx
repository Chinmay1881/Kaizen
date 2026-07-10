import { Badge } from "@/components/ui/badge";
import { KAIZEN_STATUS_BADGE_VARIANT, KAIZEN_STATUS_LABELS } from "@/constants/kaizen-status";
import type { KaizenStatus } from "@/types/enums";

interface KaizenStatusBadgeProps {
  status: KaizenStatus;
}

export function KaizenStatusBadge({ status }: KaizenStatusBadgeProps) {
  return (
    <Badge variant={KAIZEN_STATUS_BADGE_VARIANT[status]}>{KAIZEN_STATUS_LABELS[status]}</Badge>
  );
}
