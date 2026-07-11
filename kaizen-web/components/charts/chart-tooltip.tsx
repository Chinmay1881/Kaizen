interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  valueFormatter?: (value: number) => string;
}

/** Shared Recharts `<Tooltip content={...}>` renderer — matches the app's card styling (rounded
 * border, shadow) instead of Recharts' unstyled default tooltip. */
export function ChartTooltip({ active, label, payload, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-sm shadow-md">
      {label ? <p className="mb-1 font-medium">{label}</p> : null}
      {payload.map((entry, index) => (
        <p key={index} className="text-muted-foreground flex items-center gap-2">
          {entry.color ? (
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          ) : null}
          {entry.name ? <span>{entry.name}:</span> : null}
          <span className="text-foreground font-medium">
            {valueFormatter ? valueFormatter(entry.value) : entry.value.toLocaleString("en-IN")}
          </span>
        </p>
      ))}
    </div>
  );
}
