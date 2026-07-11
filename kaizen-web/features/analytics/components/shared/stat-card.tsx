import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "success" | "destructive" | "warning" | "info";
}

const TONE_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

/** Same visual shape as the Dashboard's `StatsCards` (Milestone 3) — reused here rather than a
 * second card design, since this milestone adds many more stat grids on top of that one. */
export function StatCard({ icon: Icon, label, value, tone = "default" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
