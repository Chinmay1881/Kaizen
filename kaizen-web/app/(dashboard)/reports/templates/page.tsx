import type { Metadata } from "next";

import { ReportsGuard } from "@/features/reports/components/reports-guard";
import { ReportsSubNav } from "@/features/reports/components/reports-subnav";
import { ReportTemplatesView } from "@/features/reports/components/report-templates-view";

export const metadata: Metadata = {
  title: "Report Templates",
};

export default function ReportTemplatesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <ReportsGuard>
        <ReportsSubNav />
        <ReportTemplatesView />
      </ReportsGuard>
    </div>
  );
}
