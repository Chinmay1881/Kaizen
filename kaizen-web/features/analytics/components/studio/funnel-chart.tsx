"use client";

import { motion } from "framer-motion";

import { fadeInUpVariants } from "@/lib/motion";
import { formatNumber } from "@/utils/format";

interface FunnelStage {
  label: string;
  value: number;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

/**
 * A real pipeline built from `StatusCounts` stage counts — each bar's width is proportional to
 * the first (widest) stage, with a conversion percentage against that same baseline. No
 * fabricated "conversion rate" model, just the real counts already fetched, laid out as a funnel.
 */
export function FunnelChart({ stages }: FunnelChartProps) {
  const baseline = stages[0]?.value || 1;

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage, index) => {
        const widthPercent = Math.max(4, Math.round((stage.value / baseline) * 100));
        const conversionPercent = Math.round((stage.value / baseline) * 100);

        return (
          <motion.div key={stage.label} initial="hidden" animate="visible" variants={fadeInUpVariants} transition={{ delay: index * 0.06 }} className="flex items-center gap-4">
            <div className="w-36 shrink-0 text-right">
              <p className="text-sm font-medium">{stage.label}</p>
            </div>
            <div className="bg-muted relative h-10 flex-1 overflow-hidden rounded-lg">
              <div
                className="bg-primary/80 flex h-full items-center justify-end rounded-lg px-3 transition-[width] duration-700 ease-out"
                style={{ width: `${widthPercent}%` }}
              >
                <span data-metric className="text-primary-foreground text-sm font-semibold whitespace-nowrap">
                  {formatNumber(stage.value)}
                </span>
              </div>
            </div>
            <div className="text-muted-foreground w-12 shrink-0 text-xs tabular-nums">{index === 0 ? "" : `${conversionPercent}%`}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
