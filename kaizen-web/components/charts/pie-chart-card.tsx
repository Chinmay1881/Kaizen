"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartPie } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import type { ChartPoint } from "@/features/analytics/types/analytics";

interface PieChartCardProps {
  title: string;
  description?: string;
  data: ChartPoint[];
}

/** Cycles through the app's existing semantic + brand tokens rather than inventing a separate
 * chart palette — keeps every chart visually consistent with badges/status colors elsewhere. */
const SLICE_COLORS = [
  "var(--color-primary)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-rewards)",
  "var(--color-destructive)",
  "var(--color-muted-foreground)",
];

function Legend({ data }: { data: ChartPoint[] }) {
  const total = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <ul className="flex flex-col gap-2">
      {data.map((point, index) => (
        <li key={point.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
              aria-hidden="true"
            />
            <span className="truncate">{point.label}</span>
          </span>
          <span className="text-muted-foreground shrink-0 tabular-nums">
            {point.value.toLocaleString("en-IN")}
            <span className="ml-1.5">{total > 0 ? `(${Math.round((point.value / total) * 100)}%)` : ""}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PieChartCard({ title, description, data }: PieChartCardProps) {
  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            icon={ChartPie}
            title="No data yet"
            description="Data will appear here once available."
          />
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <ResponsiveContainer width="100%" height={220} className="sm:max-w-[220px]">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={3} strokeWidth={0}>
                  {data.map((entry, index) => (
                    <Cell key={entry.label} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full min-w-0 flex-1">
              <Legend data={data} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
