import type { Metadata } from "next";

import { ReportDownloadCenter } from "@/features/reports/components/report-download-center";
import { ReportsGuard } from "@/features/reports/components/reports-guard";
import { ReportsSubNav } from "@/features/reports/components/reports-subnav";

export const metadata: Metadata = {
  title: "Download Center",
};

export default function ReportsHistoryPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <ReportsGuard>
        <ReportsSubNav />
        <ReportDownloadCenter />
      </ReportsGuard>
    </div>
  );
}
