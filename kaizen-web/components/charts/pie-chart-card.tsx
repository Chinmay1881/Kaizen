"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
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
  "var(--color-destructive)",
  "var(--muted-foreground)",
];

export function PieChartCard({ title, description, data }: PieChartCardProps) {
  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
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
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.label} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
