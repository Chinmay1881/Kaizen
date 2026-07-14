import type { Metadata } from "next";

import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { AdminSubNav } from "@/features/admin/components/control-center/admin-subnav";
import { DepartmentGalleryView } from "@/features/admin/components/control-center/department-gallery-view";

export const metadata: Metadata = {
  title: "Department Management",
};

export default function AdminDepartmentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminGuard>
        <AdminSubNav />
        <DepartmentGalleryView />
      </AdminGuard>
    </div>
  );
}
