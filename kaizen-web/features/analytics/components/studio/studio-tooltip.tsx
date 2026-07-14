interface StudioTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  valueFormatter?: (value: number) => string;
}

/**
 * Analytics-Studio-exclusive tooltip — a fresh, premium variant (larger padding, accent bar,
 * rounded-xl) separate from the shared `ChartTooltip` (which stays untouched; Dashboard and
 * Reports both still render it via `BarChartCard`/`LineChartCard`/etc., neither in scope here).
 */
export function StudioTooltip({ active, label, payload, valueFormatter }: StudioTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-popover text-popover-foreground min-w-36 overflow-hidden rounded-xl border shadow-[var(--shadow-lg)]">
      <div className="bg-primary h-1 w-full" aria-hidden="true" />
      <div className="px-3.5 py-3">
        {label ? <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">{label}</p> : null}
        <div className="flex flex-col gap-1.5">
          {payload.map((entry, index) => (
            <p key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                {entry.color ? <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} /> : null}
                {entry.name ? <span className="text-muted-foreground">{entry.name}</span> : null}
              </span>
              <span data-metric className="font-semibold">
                {valueFormatter ? valueFormatter(entry.value) : entry.value.toLocaleString("en-IN")}
              </span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
