import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Gift,
  HardHat,
  Rocket,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { StatCard } from "@/features/analytics/components/shared/stat-card";
import type { StatusCounts } from "@/features/analytics/types/analytics";
import { formatNumber } from "@/utils/format";

interface StatusCardsProps {
  statusCounts: StatusCounts;
}

/** The exact 10 cards Part 1 lists. `Archived`/`Published to Knowledge Base` — real statuses this
 * service also counts — are covered by the full status-distribution pie chart instead, and get
 * their own page in Part 13 (Archive), rather than a duplicate card here. */
export function StatusCards({ statusCounts }: StatusCardsProps) {
  const cards = [
    { icon: FileText, label: "Total Kaizens", value: statusCounts.total, tone: "default" as const },
    { icon: FileText, label: "Draft", value: statusCounts.draft, tone: "default" as const },
    { icon: ClipboardList, label: "Submitted", value: statusCounts.submitted, tone: "info" as const },
    { icon: ClipboardList, label: "Under Review", value: statusCounts.underReview, tone: "info" as const },
    { icon: CheckCircle2, label: "Approved", value: statusCounts.approved, tone: "success" as const },
    { icon: XCircle, label: "Rejected", value: statusCounts.rejected, tone: "destructive" as const },
    { icon: HardHat, label: "Implementation Pending", value: statusCounts.implementationPending, tone: "warning" as const },
    { icon: Rocket, label: "Implementation Complete", value: statusCounts.implementationComplete, tone: "success" as const },
    { icon: TrendingUp, label: "Business Impact Recorded", value: statusCounts.businessImpactRecorded, tone: "success" as const },
    { icon: Gift, label: "Rewards Issued", value: statusCounts.rewardsIssued, tone: "default" as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <StatCard key={card.label} icon={card.icon} label={card.label} value={formatNumber(card.value)} tone={card.tone} />
      ))}
    </div>
  );
}
