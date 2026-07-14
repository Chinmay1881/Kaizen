"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

/** A tiny trend signal for metric cards — deliberately no axes, grid, or tooltip (Recharts'
 * `ChartTooltip` is for real charts elsewhere). Renders nothing when there isn't enough data to
 * draw a trend, rather than a flat/misleading line. */
export function Sparkline({ data, color = "var(--color-primary)", className }: SparklineProps) {
  if (data.length < 2) return null;

  const points = data.map((value, index) => ({ index, value }));
  const gradientId = `sparkline-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className={className} aria-hidden="true">
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
