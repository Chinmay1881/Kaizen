"use client";

import { useId } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ReportChart } from "@/features/reports/types/report";

/**
 * Print-styled chart renderers for the live report preview — deliberately not the shared
 * `AreaChartCard`/`BarChartCard`/`PieChartCard`/`LineChartCard` (Dashboard/Reports/Analytics'
 * dashboard-style cards, all out of scope) and not the Analytics Studio's `Studio*Chart`
 * components either (that milestone's own scope, not this one's). Smaller, chrome-free, sized to
 * sit inside a page-like document rather than a dashboard grid.
 */

const SLICE_COLORS = ["var(--color-primary)", "var(--color-info)", "var(--color-success)", "var(--color-warning)", "var(--color-rewards)", "var(--color-destructive)"];

function PrintTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-2.5 py-1.5 text-xs shadow-[var(--shadow-md)]">
      {label ? <p className="text-muted-foreground mb-0.5">{label}</p> : null}
      <p className="font-semibold">{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  );
}

export function ReportPrintChart({ chart }: { chart: ReportChart }) {
  const gradientId = useId();
  const hasData = chart.data.some((point) => point.value !== 0) || chart.data.length > 0;

  if (!hasData) return null;

  return (
    <figure className="flex flex-col gap-2 break-inside-avoid">
      <figcaption className="text-sm font-semibold">{chart.title}</figcaption>
      <ResponsiveContainer width="100%" height={200}>
        {chart.type === "pie" || chart.type === "donut" ? (
          <PieChart>
            <Pie data={chart.data} dataKey="value" nameKey="label" innerRadius={44} outerRadius={72} paddingAngle={2} strokeWidth={0}>
              {chart.data.map((entry, index) => (
                <Cell key={entry.label} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PrintTooltip />} />
          </PieChart>
        ) : chart.type === "bar" ? (
          <BarChart data={chart.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32} />
            <Tooltip content={<PrintTooltip />} cursor={{ fill: "var(--muted)" }} />
            <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chart.type === "area" ? (
          <AreaChart data={chart.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32} />
            <Tooltip content={<PrintTooltip />} />
            <Area type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} fill={`url(#${gradientId})`} />
          </AreaChart>
        ) : (
          <LineChart data={chart.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32} />
            <Tooltip content={<PrintTooltip />} />
            <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 2.5 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </figure>
  );
}
