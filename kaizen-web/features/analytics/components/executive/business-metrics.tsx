import { Building2, IndianRupee, PiggyBank, Trophy, Users, UserCheck } from "lucide-react";

import { StatCard } from "@/features/analytics/components/shared/stat-card";
import type { BusinessMetrics as BusinessMetricsData } from "@/features/analytics/types/analytics";
import { formatNumber } from "@/utils/format";

interface BusinessMetricsProps {
  business: BusinessMetricsData;
}

export function BusinessMetrics({ business }: BusinessMetricsProps) {
  const cards = [
    {
      icon: PiggyBank,
      label: "Estimated Savings",
      // Recorded as free text at submission time (kaizen_benefits), not a structured amount — see
      // PROJECT_STATUS.md Known Issues. Shown as a count of Kaizens that estimated savings, not a sum.
      value: `${formatNumber(business.kaizensWithEstimatedSavings)} Kaizens`,
      tone: "default" as const,
    },
    {
      icon: IndianRupee,
      label: "Actual Savings",
      value: `₹${business.actualSavings.toLocaleString("en-IN")}`,
      tone: "success" as const,
    },
    { icon: Trophy, label: "Total Rewards", value: `${formatNumber(business.totalRewardPoints)} pts`, tone: "warning" as const },
    {
      icon: UserCheck,
      label: "Employee Participation",
      value: `${business.employeeParticipationPercent}%`,
      tone: "info" as const,
    },
    { icon: Users, label: "Active Employees", value: formatNumber(business.activeEmployees), tone: "default" as const },
    {
      icon: Building2,
      label: "Department Participation",
      value: `${business.departmentParticipationPercent}%`,
      tone: "info" as const,
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
