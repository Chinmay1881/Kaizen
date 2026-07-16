import { cn } from "@/lib/utils";

interface WorkspaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** `flat` drops the shadow/hover-lift for cards that sit inside another card (avoids double
   * elevation). `interactive` adds the same hover-lift every clickable V1 card already used, kept
   * as one named option instead of callers reaching for `interactive-lift` directly. */
  variant?: "default" | "flat" | "interactive";
}

/** The one bordered-card container every other V2 card (FocusCard/ActionCard/SummaryCard) is
 * built on top of. Every V1 dashboard section hand-wrote `rounded-xl border bg-card p-5` (or a
 * near-variant of it) independently in 8 different files — this is that shape, named once. */
export function WorkspaceCard({ children, variant = "default", className, ...props }: WorkspaceCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-6 shadow-[var(--shadow-xs)]",
        variant === "flat" && "border-none bg-transparent p-0 shadow-none",
        variant === "interactive" && "interactive-lift",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
