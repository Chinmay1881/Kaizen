"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Minus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { SectionHeading } from "@/components/dashboard/section-heading";
import type { Insight } from "@/features/analytics/utils/insights-engine";
import { fadeInUpVariants } from "@/lib/motion";

const TONE_ICON = { positive: TrendingUp, negative: TrendingDown, warning: AlertTriangle, neutral: ArrowRight } as const;
const TONE_CLASS = {
  positive: "bg-success/15 text-success",
  negative: "bg-destructive/10 text-destructive",
  warning: "bg-warning/20 text-warning-foreground",
  neutral: "bg-info/15 text-info",
} as const;

interface InsightFeedProps {
  insights: Insight[];
}

/** Section 8. Every string here comes straight from `buildInsights` (deterministic, rule-based —
 * see that file's own doc comment); this component only renders what it's given. */
export function InsightFeed({ insights }: InsightFeedProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Insight Feed" description="Observations, not opinions — every line here is directly backed by the numbers above" />
      {insights.length === 0 ? (
        <EmptyState icon={Sparkles} title="Not enough data yet" description="Insights will appear here once there's enough activity to observe." />
      ) : (
        <ul className="flex flex-col gap-2">
          {insights.map((insight, index) => {
            const Icon = TONE_ICON[insight.tone] ?? Minus;
            return (
              <motion.li key={insight.id} initial="hidden" animate="visible" variants={fadeInUpVariants} transition={{ delay: index * 0.05 }} className="flex items-center gap-3 rounded-xl border bg-card p-4">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_CLASS[insight.tone]}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm">{insight.text}</p>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
