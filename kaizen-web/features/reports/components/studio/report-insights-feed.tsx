"use client";

import { Minus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import type { ReportInsight } from "@/features/reports/utils/report-insights-engine";

const TONE_ICON = { positive: TrendingUp, negative: TrendingDown, neutral: Minus } as const;
const TONE_CLASS = {
  positive: "bg-success/15 text-success",
  negative: "bg-destructive/10 text-destructive",
  neutral: "bg-info/15 text-info",
} as const;

export function ReportInsightsFeed({ insights }: { insights: ReportInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 border-t pt-6">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-wide uppercase">
        <Sparkles className="h-3.5 w-3.5" />
        Insights
      </h3>
      <ul className="flex flex-col gap-2">
        {insights.map((insight) => {
          const Icon = TONE_ICON[insight.tone];
          return (
            <li key={insight.id} className="flex items-center gap-2.5 text-sm">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${TONE_CLASS[insight.tone]}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              {insight.text}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
