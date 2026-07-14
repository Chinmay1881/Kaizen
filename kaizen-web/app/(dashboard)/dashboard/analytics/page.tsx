import type { Metadata } from "next";

import { AnalyticsStudioView } from "@/features/analytics/components/studio/analytics-studio-view";

export const metadata: Metadata = {
  title: "Analytics Studio",
};

export default function DashboardAnalyticsPage() {
  return <AnalyticsStudioView />;
}
