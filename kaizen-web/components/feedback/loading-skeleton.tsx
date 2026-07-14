import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  /** Optional inline sizing (e.g. a dynamic chart height) for cases a static Tailwind class
   * can't express — additive, every existing caller omits it and is unaffected. */
  style?: React.CSSProperties;
}

/** A shimmering placeholder (a moving highlight sweeping across a muted block) rather than a
 * flat `animate-pulse` fade — reads as "content is streaming in" instead of "something is
 * broken and blinking". */
export function LoadingSkeleton({ className, style }: LoadingSkeletonProps) {
  return <div className={cn("skeleton-shimmer rounded-lg", className)} style={style} aria-hidden="true" />;
}
