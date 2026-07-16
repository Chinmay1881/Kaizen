import type { Metadata } from "next";

import { DashboardViewV2 } from "@/components/dashboard-v2/dashboard-view-v2";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <DashboardViewV2 />;
}
