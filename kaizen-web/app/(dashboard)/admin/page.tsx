import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { AdminSubNav } from "@/features/admin/components/control-center/admin-subnav";
import { AdminOverviewView } from "@/features/admin/components/control-center/admin-overview-view";

export const metadata: Metadata = {
  title: "Administration",
};

export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader title="Control Center" description="Everything about running Muliya Kaizan, in one place." />
      <AdminGuard>
        <AdminSubNav />
        <AdminOverviewView />
      </AdminGuard>
    </div>
  );
}
