import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ReportsGuard } from "@/features/reports/components/reports-guard";
import { ReportsSubNav } from "@/features/reports/components/reports-subnav";
import { ReportsView } from "@/features/reports/components/reports-view";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader title="Reports" description="Build and preview reports from real Kaizen data." />
      <ReportsGuard>
        <ReportsSubNav />
        <ReportsView />
      </ReportsGuard>
    </div>
  );
}
