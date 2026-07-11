import { Building2, CheckCircle2, Clock3, IndianRupee, PiggyBank, Star, Timer } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { StatCard } from "@/features/analytics/components/shared/stat-card";
import type { DepartmentAnalyticsItem } from "@/features/analytics/types/analytics";
import { formatNumber } from "@/utils/format";

interface DepartmentAnalyticsCardProps {
  data: DepartmentAnalyticsItem;
}

function ParticipationList({ title, entries, unit }: { title: string; entries: DepartmentAnalyticsItem["topEmployees"]; unit: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-xs">No data yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{entry.name}</span>
              <span className="text-muted-foreground text-xs">
                {formatNumber(entry.value)} {unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DepartmentAnalyticsCard({ data }: DepartmentAnalyticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          {data.departmentName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={CheckCircle2} label="Approval Rate" value={`${data.approvalRate}%`} tone="success" />
          <StatCard icon={Star} label="Average Score" value={data.avgScore != null ? data.avgScore.toFixed(1) : "—"} />
          <StatCard
            icon={Timer}
            label="Avg Implementation Time"
            value={data.avgImplementationTimeDays != null ? `${data.avgImplementationTimeDays}d` : "—"}
            tone="warning"
          />
          <StatCard icon={Clock3} label="Pending Reviews" value={formatNumber(data.pendingReviews)} tone="info" />
          <StatCard icon={Clock3} label="Pending Implementations" value={formatNumber(data.pendingImplementations)} tone="info" />
          <StatCard icon={PiggyBank} label="Estimated Savings" value={`${formatNumber(data.kaizensWithEstimatedSavings)} Kaizens`} />
          <StatCard
            icon={IndianRupee}
            label="Actual Savings"
            value={`₹${data.actualSavings.toLocaleString("en-IN")}`}
            tone="success"
          />
        </div>

        <LineChartCard title="Submission Trend" data={data.monthlyTrend} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ParticipationList title="Top Employees" entries={data.topEmployees} unit="pts" />
          <ParticipationList title="Lowest Participation" entries={data.lowestParticipation} unit="ideas" />
        </div>
      </CardContent>
    </Card>
  );
}
