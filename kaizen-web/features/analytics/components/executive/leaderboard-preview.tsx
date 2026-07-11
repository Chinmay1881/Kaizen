import Link from "next/link";
import { Building2, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import type { LeaderboardPreviewEntry } from "@/features/analytics/types/analytics";
import { formatNumber } from "@/utils/format";

interface LeaderboardPreviewProps {
  topEmployees: LeaderboardPreviewEntry[];
  topDepartments: LeaderboardPreviewEntry[];
}

function PreviewList({ entries, unit }: { entries: LeaderboardPreviewEntry[]; unit: string }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">No data yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center gap-3 text-sm">
          <span className="bg-muted text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {entry.rank}
          </span>
          <span className="flex-1 truncate">{entry.name}</span>
          <span className="text-muted-foreground text-xs">
            {formatNumber(entry.value)} {unit}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function LeaderboardPreview({ topEmployees, topDepartments }: LeaderboardPreviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" />
            Top Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topEmployees.length === 0 ? (
            <EmptyState icon={Trophy} title="No rankings yet" description="Points earned this month will show up here." />
          ) : (
            <PreviewList entries={topEmployees} unit="pts" />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Top Departments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topDepartments.length === 0 ? (
            <EmptyState icon={Building2} title="No rankings yet" description="Department points will show up here." />
          ) : (
            <PreviewList entries={topDepartments} unit="pts" />
          )}
        </CardContent>
      </Card>
      <div className="sm:col-span-2 text-right">
        <Link href="/leaderboard" className="text-primary text-sm font-medium hover:underline">
          View full leaderboard →
        </Link>
      </div>
    </div>
  );
}
