import type { Metadata } from "next";

import { DownloadCenterView } from "@/features/reports/components/studio/download-center-view";
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
        <DownloadCenterView />
      </ReportsGuard>
    </div>
  );
}
