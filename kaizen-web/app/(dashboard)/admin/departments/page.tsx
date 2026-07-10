import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { DepartmentList } from "@/features/admin/components/departments/department-list";

export const metadata: Metadata = {
  title: "Department Management",
};

export default function AdminDepartmentsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="Department Management" description="Manage departments and assign a manager to each." />
      <AdminGuard>
        <DepartmentList />
      </AdminGuard>
    </div>
  );
}
