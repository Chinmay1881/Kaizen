import { Card, CardContent } from "@/components/ui/card";
import type { KpiCard } from "@/features/reports/types/report";

export function ReportKpiCard({ label, value }: KpiCard) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <p className="text-xl font-bold tracking-tight">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}
