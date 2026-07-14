"use client";

import { AlertTriangle, Building2, Calendar, Clock3, IndianRupee, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { KaizenStatusBadge } from "@/features/kaizen/components/kaizen-status-badge";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { ImplementationActionBar } from "@/features/implementation/components/workspace/implementation-action-bar";
import type { Implementation } from "@/features/implementation/types/implementation";
import { useBusinessImpact } from "@/features/implementation/hooks/use-business-impact";
import { useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { IMPACT_LABELS, PRIORITY_BADGE_VARIANT } from "@/features/review/utils/badge-tones";
import { RISK_LEVEL_LABEL, RISK_LEVEL_TONE } from "@/features/review/utils/risk-level";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

interface FactRowProps {
  icon: typeof User;
  label: string;
  value: React.ReactNode;
}

function FactRow({ icon: Icon, label, value }: FactRowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

interface ImplementationControlCenterProps {
  kaizen: KaizenDetail;
  implementation: Implementation;
  currentUser: CurrentUser;
  onFocusComment: () => void;
}

/**
 * Right panel. "Assigned Manager" from the brief is intentionally not shown — `Department` (see
 * `features/kaizen/types/lookup.ts`) has no manager/managerId field exposed anywhere in this
 * app's API, so there's no real value to display; showing "Owner" and "Department" (both real)
 * instead of fabricating a manager name. Fetches `useBusinessImpact` itself (same query key
 * `ImplementationDocument` already uses for its own Business Impact section — React Query dedupes
 * it, so this costs no extra request) rather than taking it as a prop, so the action bar's
 * "Record Business Impact" gating (`!businessImpact`) is never stale.
 */
export function ImplementationControlCenter({ kaizen, implementation, currentUser, onFocusComment }: ImplementationControlCenterProps) {
  const departmentQuery = useDepartmentAnalytics(kaizen.department.id, true);
  const dept = departmentQuery.data?.[0];
  const businessImpactQuery = useBusinessImpact(kaizen.id);
  const businessImpact = businessImpactQuery.data;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-muted-foreground text-xs">Current Status</p>
            <div className="mt-1">
              <KaizenStatusBadge status={kaizen.status} />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4">
            <FactRow icon={Building2} label="Department" value={implementation.assignedDepartment.name} />
            <FactRow icon={User} label="Owner" value={implementation.owner.displayName} />
            <FactRow icon={Calendar} label="Expected Completion" value={implementation.dueDate ? formatDate(implementation.dueDate) : "Not set"} />
            <FactRow icon={AlertTriangle} label="Priority" value={<Badge variant={PRIORITY_BADGE_VARIANT[kaizen.priority]}>{kaizen.priority}</Badge>} />
            <FactRow icon={AlertTriangle} label="Risk Level" value={<Badge variant={RISK_LEVEL_TONE[kaizen.priority]}>{RISK_LEVEL_LABEL[kaizen.priority]}</Badge>} />
            <FactRow
              icon={IndianRupee}
              label="Business Impact"
              value={businessImpact?.moneySaved != null ? `${formatCurrency(businessImpact.moneySaved)} saved (actual)` : `${IMPACT_LABELS[kaizen.estimatedImpact]} (estimated)`}
            />
          </div>

          {dept ? (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <Clock3 className="h-3 w-3" />
                {kaizen.department.name} — Quick Stats
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Pending Implementations</p>
                  <p data-metric className="font-semibold">
                    {formatNumber(dept.pendingImplementations)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Avg. Implementation Time</p>
                  <p data-metric className="font-semibold">
                    {dept.avgImplementationTimeDays != null ? `${dept.avgImplementationTimeDays.toFixed(1)}d` : "—"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ImplementationActionBar kaizen={kaizen} implementation={implementation} currentUser={currentUser} businessImpact={businessImpact} onFocusComment={onFocusComment} />
    </div>
  );
}
