import type { Metadata } from "next";

import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { AdminSubNav } from "@/features/admin/components/control-center/admin-subnav";
import { UserWorkspaceView } from "@/features/admin/components/control-center/user-workspace-view";

export const metadata: Metadata = {
  title: "User Management",
};

export default function AdminUsersPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <AdminGuard>
        <AdminSubNav />
        <UserWorkspaceView />
      </AdminGuard>
    </div>
  );
}
