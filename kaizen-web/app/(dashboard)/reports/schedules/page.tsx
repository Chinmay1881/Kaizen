import type { Metadata } from "next";

import { ReportsGuard } from "@/features/reports/components/reports-guard";
import { ReportsSubNav } from "@/features/reports/components/reports-subnav";
import { SchedulesGalleryView } from "@/features/reports/components/studio/schedules-gallery-view";

export const metadata: Metadata = {
  title: "Scheduled Reports",
};

export default function ReportSchedulesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <ReportsGuard>
        <ReportsSubNav />
        <SchedulesGalleryView />
      </ReportsGuard>
    </div>
  );
}
