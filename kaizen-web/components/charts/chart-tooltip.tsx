interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  valueFormatter?: (value: number) => string;
}

/** Shared Recharts `<Tooltip content={...}>` renderer — matches the app's card styling (soft
 * shadow, tight radius) instead of Recharts' unstyled default tooltip. */
export function ChartTooltip({ active, label, payload, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-popover text-popover-foreground min-w-32 rounded-lg border px-3 py-2 text-sm shadow-[var(--shadow-md)]">
      {label ? <p className="text-muted-foreground mb-1.5 text-xs font-medium">{label}</p> : null}
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5">
              {entry.color ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              ) : null}
              {entry.name ? <span className="text-muted-foreground">{entry.name}</span> : null}
            </span>
            <span data-metric className="font-semibold">
              {valueFormatter ? valueFormatter(entry.value) : entry.value.toLocaleString("en-IN")}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
