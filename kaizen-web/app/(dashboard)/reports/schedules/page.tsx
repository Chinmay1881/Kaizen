import type { Metadata } from "next";

import { ReportsGuard } from "@/features/reports/components/reports-guard";
import { ReportSchedulesView } from "@/features/reports/components/report-schedules-view";
import { ReportsSubNav } from "@/features/reports/components/reports-subnav";

export const metadata: Metadata = {
  title: "Scheduled Reports",
};

export default function ReportSchedulesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <ReportsGuard>
        <ReportsSubNav />
        <ReportSchedulesView />
      </ReportsGuard>
    </div>
  );
}
