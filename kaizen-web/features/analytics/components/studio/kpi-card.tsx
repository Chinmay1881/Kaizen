"use client";

import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { Sparkline } from "@/components/charts/sparkline";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

export type KpiHealth = "good" | "warning" | "critical" | "neutral";

const HEALTH_DOT: Record<KpiHealth, string> = {
  good: "bg-success",
  warning: "bg-warning",
  critical: "bg-destructive",
  neutral: "bg-muted-foreground",
};

const HEALTH_ICON_CLASS: Record<KpiHealth, string> = {
  good: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  critical: "bg-destructive/15 text-destructive",
  neutral: "bg-primary/10 text-primary",
};

interface KpiCardProps {
  label: string;
  value: number;
  format?: (value: number) => string;
  icon?: LucideIcon;
  health?: KpiHealth;
  /** Percent change vs. the comparison period — omitted (not 0) when there's nothing real to
   * compare against (e.g. no date range selected, so there's no sensible "previous period"). */
  comparePercent?: number | null;
  compareLabel?: string;
  sparklineData?: number[];
}

/** Section 1's premium KPI card — animated counter, mini sparkline, trend arrow, and a health
 * dot, all from real fields already fetched by the section that renders it. */
export function KpiCard({ label, value, format, icon: Icon, health = "neutral", comparePercent, compareLabel, sparklineData }: KpiCardProps) {
  const animated = useCountUp(value);
  const formatted = format ? format(animated) : Math.round(animated).toLocaleString("en-IN");

  return (
    <div className="interactive-lift group relative flex flex-col gap-4 overflow-hidden rounded-xl border bg-card p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", HEALTH_DOT[health])} aria-hidden="true" />
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
        </div>
        {Icon ? (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", HEALTH_ICON_CLASS[health])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <p data-metric className="text-4xl font-semibold tracking-tight tabular-nums">
        {formatted}
      </p>

      <div className="flex items-end justify-between gap-3">
        {comparePercent !== undefined && comparePercent !== null ? (
          <span className={cn("flex items-center gap-1 text-xs font-medium", comparePercent > 0 ? "text-success" : comparePercent < 0 ? "text-destructive" : "text-muted-foreground")}>
            {comparePercent > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : comparePercent < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            {Math.abs(comparePercent)}% {compareLabel ?? "vs previous period"}
          </span>
        ) : (
          <span />
        )}
        {sparklineData && sparklineData.length > 1 ? <Sparkline data={sparklineData} className="-mx-1 -mb-1 w-24" /> : null}
      </div>
    </div>
  );
}
