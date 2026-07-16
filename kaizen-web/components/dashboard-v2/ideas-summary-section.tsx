import { CheckCircle2, HardHat, ListChecks } from "lucide-react";

import { DashboardSection } from "@/components/v2/dashboard-section";
import { SummaryCard } from "@/components/v2/summary-card";
import { ROUTES } from "@/constants/routes";
import type { CurrentUser } from "@/features/auth/types/user";
import { formatNumber } from "@/utils/format";

interface IdeasSummarySectionProps {
  user: CurrentUser;
}

/** Answers Q2, "what's happening with my ideas?" — the same `user.gamification` counts
 * `executive-hero.tsx`'s employee stat row already draws from, already loaded alongside the
 * current user (no separate query, no loading state of its own). Approval Rate isn't repeated
 * here since `PerformanceSection` (Q4) already shows it. */
export function IdeasSummarySection({ user }: IdeasSummarySectionProps) {
  return (
    <DashboardSection title="Your Ideas" description="Where things stand with what you've submitted">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={ListChecks}
          label="Submitted"
          value={formatNumber(user.gamification.ideasSubmitted)}
          href={ROUTES.MY_IDEAS}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Approved"
          value={formatNumber(user.gamification.ideasApproved)}
          href={`${ROUTES.MY_IDEAS}?status=APPROVED`}
        />
        <SummaryCard
          icon={HardHat}
          label="Implemented"
          value={formatNumber(user.gamification.ideasImplemented)}
          href={`${ROUTES.MY_IDEAS}?status=IMPLEMENTATION_COMPLETED`}
        />
      </div>
    </DashboardSection>
  );
}
