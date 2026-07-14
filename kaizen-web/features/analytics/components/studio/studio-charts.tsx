"use client";

import { useId, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { StudioTooltip } from "@/features/analytics/components/studio/studio-tooltip";
import type { ChartPoint } from "@/features/analytics/types/analytics";

/**
 * Analytics-Studio-exclusive chart primitives — fresh, larger, gradient-filled variants of the
 * shared `AreaChartCard`/`BarChartCard`/`PieChartCard` (Dashboard and Reports both still render
 * those unmodified; neither is in scope this milestone). Same `ChartPoint[]` shape throughout,
 * so every section just reshapes real `AnalyticsOverview`/`DepartmentAnalyticsItem` data into
 * this type — nothing invented.
 */

interface StudioChartFrameProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  icon?: LucideIcon;
  height?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}

function StudioChartFrame({ title, description, isLoading, isEmpty, icon, height = 320, action, children }: StudioChartFrameProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {action}
      </div>
      {isLoading ? (
        <LoadingSkeleton className="w-full rounded-xl" style={{ height }} />
      ) : isEmpty ? (
        <div style={{ height }} className="flex items-center justify-center">
          <EmptyState icon={icon} title="No data yet" description="Data will appear here once available." className="border-none" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface StudioAreaChartProps {
  title: string;
  description?: string;
  data: ChartPoint[];
  color?: string;
  valueFormatter?: (value: number) => string;
  isLoading?: boolean;
  height?: number;
  action?: React.ReactNode;
}

export function StudioAreaChart({ title, description, data, color = "var(--color-primary)", valueFormatter, isLoading, height = 320, action }: StudioAreaChartProps) {
  const gradientId = useId();
  const hasData = data.some((point) => point.value > 0);

  return (
    <StudioChartFrame title={title} description={description} isLoading={isLoading} isEmpty={!hasData} height={height} action={action}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<StudioTooltip valueFormatter={valueFormatter} />} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} animationDuration={600} />
        </AreaChart>
      </ResponsiveContainer>
    </StudioChartFrame>
  );
}

interface StudioBarChartProps {
  title: string;
  description?: string;
  data: ChartPoint[];
  color?: string;
  valueFormatter?: (value: number) => string;
  isLoading?: boolean;
  height?: number;
  action?: React.ReactNode;
}

export function StudioBarChart({ title, description, data, color = "var(--color-primary)", valueFormatter, isLoading, height = 320, action }: StudioBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasData = data.length > 0;

  return (
    <StudioChartFrame title={title} description={description} isLoading={isLoading} isEmpty={!hasData} height={height} action={action}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} onMouseLeave={() => setActiveIndex(null)}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval={0}
            angle={data.length > 6 ? -20 : 0}
            textAnchor={data.length > 6 ? "end" : "middle"}
            height={data.length > 6 ? 50 : 30}
          />
          <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={48} />
          <Tooltip content={<StudioTooltip valueFormatter={valueFormatter} />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={600} onMouseEnter={(_, index) => setActiveIndex(index)}>
            {data.map((_, index) => (
              <Cell key={index} fill={color} opacity={activeIndex === null || activeIndex === index ? 1 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </StudioChartFrame>
  );
}

const DONUT_COLORS = [
  "var(--color-primary)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-rewards)",
  "var(--color-achievement)",
  "var(--color-implementation)",
  "var(--color-business-impact)",
  "var(--color-destructive)",
  "var(--color-muted-foreground)",
];

interface StudioDonutChartProps {
  title: string;
  description?: string;
  data: ChartPoint[];
  isLoading?: boolean;
  action?: React.ReactNode;
}

export function StudioDonutChart({ title, description, data, isLoading, action }: StudioDonutChartProps) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const hasData = data.length > 0;
  const total = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <StudioChartFrame title={title} description={description} isLoading={isLoading} isEmpty={!hasData} height={280} action={action}>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <ResponsiveContainer width="100%" height={240} className="sm:max-w-[240px]">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={64}
              outerRadius={100}
              paddingAngle={3}
              strokeWidth={0}
              animationDuration={600}
              onMouseEnter={(_, index) => setActiveLabel(data[index]?.label ?? null)}
              onMouseLeave={() => setActiveLabel(null)}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={DONUT_COLORS[index % DONUT_COLORS.length]} opacity={activeLabel === null || activeLabel === entry.label ? 1 : 0.35} />
              ))}
            </Pie>
            <Tooltip content={<StudioTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="w-full min-w-0 flex-1 space-y-2">
          {data.map((point, index) => (
            <li
              key={point.label}
              onMouseEnter={() => setActiveLabel(point.label)}
              onMouseLeave={() => setActiveLabel(null)}
              className="flex cursor-default items-center justify-between gap-3 rounded-md px-1.5 py-1 text-sm transition-opacity duration-150"
              style={{ opacity: activeLabel === null || activeLabel === point.label ? 1 : 0.45 }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} aria-hidden="true" />
                <span className="truncate">{point.label}</span>
              </span>
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {point.value.toLocaleString("en-IN")}
                <span className="ml-1.5">{total > 0 ? `(${Math.round((point.value / total) * 100)}%)` : ""}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </StudioChartFrame>
  );
}
