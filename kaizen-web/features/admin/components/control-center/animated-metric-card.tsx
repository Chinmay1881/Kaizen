"use client";

import { MetricCard } from "@/components/ui/metric-card";
import type { MetricTone } from "@/components/ui/metric-card";
import { useCountUp } from "@/hooks/use-count-up";
import type { LucideIcon } from "lucide-react";

interface AnimatedMetricCardProps {
  label: string;
  target: number;
  icon?: LucideIcon;
  tone?: MetricTone;
  suffix?: string;
  href?: string;
}

/** Thin wrapper around `MetricCard` that animates its number via `useCountUp` — kept separate so
 * the hook (which must run unconditionally per card) doesn't force every `MetricCard` call site
 * elsewhere in the app to animate. */
export function AnimatedMetricCard({ label, target, icon, tone, suffix, href }: AnimatedMetricCardProps) {
  const animated = useCountUp(target);
  const value = `${Math.round(animated)}${suffix ?? ""}`;

  return <MetricCard label={label} value={value} icon={icon} tone={tone} href={href} />;
}
