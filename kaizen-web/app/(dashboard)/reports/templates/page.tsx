import type { Metadata } from "next";

import { ReportsGuard } from "@/features/reports/components/reports-guard";
import { ReportsSubNav } from "@/features/reports/components/reports-subnav";
import { TemplatesGalleryView } from "@/features/reports/components/studio/templates-gallery-view";

export const metadata: Metadata = {
  title: "Report Templates",
};

export default function ReportTemplatesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <ReportsGuard>
        <ReportsSubNav />
        <TemplatesGalleryView />
      </ReportsGuard>
    </div>
  );
}
