import { Clock, Percent, Star, ThumbsDown, ThumbsUp, Timer } from "lucide-react";

import { StatCard } from "@/features/analytics/components/shared/stat-card";
import type { PerformanceMetrics as PerformanceMetricsData } from "@/features/analytics/types/analytics";

interface PerformanceMetricsProps {
  performance: PerformanceMetricsData;
}

export function PerformanceMetrics({ performance }: PerformanceMetricsProps) {
  const cards = [
    { icon: ThumbsUp, label: "Approval Rate", value: `${performance.approvalRate}%`, tone: "success" as const },
    { icon: ThumbsDown, label: "Rejection Rate", value: `${performance.rejectionRate}%`, tone: "destructive" as const },
    {
      icon: Clock,
      label: "Avg Review Time",
      value: performance.avgReviewTimeHours != null ? `${performance.avgReviewTimeHours}h` : "—",
      tone: "info" as const,
    },
    {
      icon: Timer,
      label: "Avg Implementation Time",
      value: performance.avgImplementationTimeDays != null ? `${performance.avgImplementationTimeDays}d` : "—",
      tone: "warning" as const,
    },
    {
      icon: Star,
      label: "Average Score",
      value: performance.avgScore != null ? performance.avgScore.toFixed(1) : "—",
      tone: "default" as const,
    },
    {
      icon: Percent,
      label: "Avg Business Impact",
      value: performance.avgBusinessImpact != null ? `₹${performance.avgBusinessImpact.toLocaleString("en-IN")}` : "—",
      tone: "success" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <StatCard key={card.label} icon={card.icon} label={card.label} value={card.value} tone={card.tone} />
      ))}
    </div>
  );
}
