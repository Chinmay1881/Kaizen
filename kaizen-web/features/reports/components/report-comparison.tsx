import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportResult } from "@/features/reports/types/report";
import { formatNumber } from "@/utils/format";

interface ReportComparisonProps {
  comparison: NonNullable<ReportResult["comparison"]>;
}

/** Part 8 — Comparison. Shows difference and percentage change, current vs previous period. */
export function ReportComparison({ comparison }: ReportComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{comparison.periodLabel}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {comparison.metrics.map((metric) => {
          const isUp = metric.difference > 0;
          const isDown = metric.difference < 0;
          return (
            <div key={metric.label} className="flex flex-col gap-1">
              <p className="text-muted-foreground text-xs">{metric.label}</p>
              <p className="text-lg font-bold">{formatNumber(metric.currentValue)}</p>
              <div
                className={`flex items-center gap-1 text-xs ${
                  isUp ? "text-success" : isDown ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {isUp ? <TrendingUp className="h-3 w-3" /> : isDown ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                <span>
                  {metric.difference > 0 ? "+" : ""}
                  {formatNumber(metric.difference)}
                  {metric.percentChange !== null ? ` (${metric.percentChange > 0 ? "+" : ""}${metric.percentChange}%)` : ""}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">vs {formatNumber(metric.previousValue)} previously</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
