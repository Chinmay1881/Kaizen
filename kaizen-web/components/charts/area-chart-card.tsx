"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AreaChart as AreaChartIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import type { ChartPoint } from "@/features/analytics/types/analytics";

interface AreaChartCardProps {
  title: string;
  description?: string;
  data: ChartPoint[];
  valueFormatter?: (value: number) => string;
}

/** Not part of the original `components/charts/*` stub set (only bar/line/pie existed) — added to
 * match Part 1's "Area Chart — Savings Trend" requirement, same styling/props convention as the
 * other 3 chart cards. */
export function AreaChartCard({ title, description, data, valueFormatter }: AreaChartCardProps) {
  const hasData = data.some((point) => point.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            icon={AreaChartIcon}
            title="No data yet"
            description="Data will appear here once available."
          />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="areaChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#areaChartFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
