import Link from "next/link";
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/utils";

export type MetricTone =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "achievement"
  | "rewards"
  | "implementation"
  | "businessImpact";

const TONE_ICON_CLASS: Record<MetricTone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info",
  achievement: "bg-achievement/20 text-achievement-foreground",
  rewards: "bg-rewards/15 text-rewards",
  implementation: "bg-implementation/15 text-implementation",
  businessImpact: "bg-business-impact/15 text-business-impact",
};

const TONE_SPARKLINE_COLOR: Record<MetricTone, string> = {
  default: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  destructive: "var(--color-destructive)",
  info: "var(--color-info)",
  achievement: "var(--color-achievement)",
  rewards: "var(--color-rewards)",
  implementation: "var(--color-implementation)",
  businessImpact: "var(--color-business-impact)",
};

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: MetricTone;
  /** Percent change vs. the prior period — omit when there's nothing to compare against. */
  trend?: number | null;
  trendLabel?: string;
  sparklineData?: number[];
  href?: string;
  className?: string;
}

/** Stripe-dashboard-style metric card: a dominant number, a quiet label, an optional trend
 * indicator, and a tiny sparkline for shape-at-a-glance — deliberately no chart legend/axes, this
 * is a glanceable signal, not an analysis tool (that's what the full charts elsewhere are for). */
export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  trend,
  trendLabel,
  sparklineData,
  href,
  className,
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "interactive-lift group relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-5 shadow-[var(--shadow-xs)]",
        href && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {Icon ? (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", TONE_ICON_CLASS[tone])}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-3">
        <p data-metric className="text-3xl font-semibold tracking-tight">
          {value}
        </p>
        {trend !== undefined && trend !== null ? (
          <span
            className={cn(
              "mb-1 flex items-center gap-0.5 text-xs font-medium",
              trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : trend < 0 ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend)}%
          </span>
        ) : null}
      </div>

      {sparklineData && sparklineData.length > 1 ? (
        <Sparkline data={sparklineData} color={TONE_SPARKLINE_COLOR[tone]} className="-mx-1 -mb-1" />
      ) : trendLabel ? (
        <p className="text-muted-foreground text-xs">{trendLabel}</p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={`${label}: ${value}`} className="rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
