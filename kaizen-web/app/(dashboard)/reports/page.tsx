import type { Metadata } from "next";

import { ReportsGuard } from "@/features/reports/components/reports-guard";
import { ReportsSubNav } from "@/features/reports/components/reports-subnav";
import { ReportStudioView } from "@/features/reports/components/studio/report-studio-view";

export const metadata: Metadata = {
  title: "Report Studio",
};

export default function ReportsPage() {
  return (
    <ReportsGuard>
      <div className="flex flex-col gap-4">
        <ReportsSubNav />
        <ReportStudioView />
      </div>
    </ReportsGuard>
  );
}
