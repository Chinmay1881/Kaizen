import { Lightbulb } from "lucide-react";

import { AreaChartCard } from "@/components/charts/area-chart-card";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { PieChartCard } from "@/components/charts/pie-chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REPORT_TYPE_LABEL } from "@/features/reports/constants/report-types";
import { ReportComparison } from "@/features/reports/components/report-comparison";
import { ReportKpiCard } from "@/features/reports/components/report-kpi-card";
import { ReportTable } from "@/features/reports/components/report-table";
import type { ReportChart, ReportResult } from "@/features/reports/types/report";
import { formatDate } from "@/utils/format";

interface ReportPreviewProps {
  report: ReportResult;
}

/** Pie and Donut both render as `<PieChartCard>` — it already draws an inner radius (a donut
 * shape), so a separate "true pie" chart would be a purely cosmetic distinction not worth a
 * second chart component. */
function ReportChartCard({ chart }: { chart: ReportChart }) {
  if (chart.type === "pie" || chart.type === "donut") {
    return <PieChartCard title={chart.title} data={chart.data} />;
  }
  if (chart.type === "bar") {
    return <BarChartCard title={chart.title} data={chart.data} />;
  }
  if (chart.type === "area") {
    return <AreaChartCard title={chart.title} data={chart.data} />;
  }
  return <LineChartCard title={chart.title} data={chart.data} />;
}

export function ReportPreview({ report }: ReportPreviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">{REPORT_TYPE_LABEL[report.reportType]}</p>
        <h2 className="text-2xl font-bold tracking-tight">{report.title}</h2>
        <p className="text-muted-foreground text-sm">
          Generated {formatDate(report.generatedAt)}
          {report.dateFrom || report.dateTo ? ` · ${report.dateFrom ? formatDate(report.dateFrom) : "…"} – ${report.dateTo ? formatDate(report.dateTo) : "…"}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {report.kpis.map((kpi) => (
          <ReportKpiCard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      {report.comparison ? <ReportComparison comparison={report.comparison} /> : null}

      {report.charts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {report.charts.map((chart) => (
            <ReportChartCard key={chart.title} chart={chart} />
          ))}
        </div>
      ) : null}

      <ReportTable table={report.table} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {report.summary.map((line, index) => (
                <li key={index} className="text-muted-foreground">
                  {line}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {report.recommendations.map((line, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
