"use client";

import type { ChartPoint } from "@/features/analytics/types/analytics";
import { cn } from "@/lib/utils";

interface ContributionGraphProps {
  monthlyActivity: ChartPoint[];
}

function intensityClass(value: number, max: number): string {
  if (value === 0) return "bg-muted";
  const ratio = value / max;
  if (ratio > 0.75) return "bg-primary";
  if (ratio > 0.5) return "bg-primary/70";
  if (ratio > 0.25) return "bg-primary/40";
  return "bg-primary/20";
}

/** `EmployeeAnalytics.monthlyActivity` is monthly-granularity, not daily — so this reads as a
 * row of month-cells (one per data point the API returns) rather than a GitHub-style
 * day-by-day grid. Real data, coarser grain, disclosed via the axis labels themselves. */
export function ContributionGraph({ monthlyActivity }: ContributionGraphProps) {
  const max = Math.max(1, ...monthlyActivity.map((point) => point.value));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {monthlyActivity.map((point) => (
          <div key={point.label} className="group relative flex-1">
            <div className={cn("aspect-square w-full rounded-md transition-transform duration-150 group-hover:scale-110", intensityClass(point.value, max))} />
            <div className="bg-foreground text-background pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 text-[10px] whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {point.label}: {point.value}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-[11px]">{monthlyActivity[0]?.label}</span>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-[10px]">Less</span>
          {[0, 0.2, 0.4, 0.7, 1].map((ratio) => (
            <span key={ratio} className={cn("h-2.5 w-2.5 rounded-sm", intensityClass(ratio * max, max))} />
          ))}
          <span className="text-muted-foreground text-[10px]">More</span>
        </div>
        <span className="text-muted-foreground text-[11px]">{monthlyActivity[monthlyActivity.length - 1]?.label}</span>
      </div>
    </div>
  );
}
