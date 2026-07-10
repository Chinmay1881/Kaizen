import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { AdminOverview } from "@/features/admin/components/admin-overview";

export const metadata: Metadata = {
  title: "Administration",
};

export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader title="Administration" description="Manage users, departments, categories, and platform settings." />
      <AdminGuard>
        <AdminOverview />
      </AdminGuard>
    </div>
  );
}
