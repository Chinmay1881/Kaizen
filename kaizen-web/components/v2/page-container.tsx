import { cn } from "@/lib/utils";

const MAX_WIDTH: Record<NonNullable<PageContainerProps["size"]>, string> = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-[1600px]",
};

interface PageContainerProps {
  children: React.ReactNode;
  /** V2 pages default to a comfortable reading width ("narrow"/"default") rather than the V1
   * dashboard's edge-to-edge `max-w-[1600px]` — generous whitespace on either side is itself part
   * of the "reduce density" goal, not just internal spacing. `wide` is kept for any future V2 page
   * that genuinely needs the full canvas (a workspace with side panels, say). */
  size?: "narrow" | "default" | "wide";
  className?: string;
}

/** The one place every future V2 page sets its content width — so "how wide should a page be"
 * stays a single decision instead of a `max-w-*` class copy-pasted per page. */
export function PageContainer({ children, size = "default", className }: PageContainerProps) {
  return <div className={cn("mx-auto flex w-full flex-col gap-8", MAX_WIDTH[size], className)}>{children}</div>;
}
