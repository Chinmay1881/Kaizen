import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";
import { AnalyticsGuard } from "@/features/analytics/components/analytics-guard";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function DashboardAnalyticsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader title="Analytics" description="Company and department performance at a glance." />
      <AnalyticsGuard>
        <AnalyticsDashboard />
      </AnalyticsGuard>
    </div>
  );
}
