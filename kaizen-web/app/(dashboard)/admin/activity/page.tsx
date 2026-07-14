import type { Metadata } from "next";

import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { AdminSubNav } from "@/features/admin/components/control-center/admin-subnav";
import { ActivityLogView } from "@/features/admin/components/control-center/activity-log-view";

export const metadata: Metadata = {
  title: "Activity Log",
};

export default function AdminActivityPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AdminGuard>
        <AdminSubNav />
        <ActivityLogView />
      </AdminGuard>
    </div>
  );
}
