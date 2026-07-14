import type { Metadata } from "next";

import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { AdminSubNav } from "@/features/admin/components/control-center/admin-subnav";
import { PermissionsMatrixView } from "@/features/admin/components/control-center/permissions-matrix-view";

export const metadata: Metadata = {
  title: "Permissions",
};

export default function AdminPermissionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AdminGuard>
        <AdminSubNav />
        <PermissionsMatrixView />
      </AdminGuard>
    </div>
  );
}
