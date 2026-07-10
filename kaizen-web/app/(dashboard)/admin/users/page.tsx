import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { UserList } from "@/features/admin/components/users/user-list";

export const metadata: Metadata = {
  title: "User Management",
};

export default function AdminUsersPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader title="User Management" description="Create accounts, assign roles and departments, deactivate access." />
      <AdminGuard>
        <UserList />
      </AdminGuard>
    </div>
  );
}
