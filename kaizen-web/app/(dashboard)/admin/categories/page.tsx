import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { CategoryList } from "@/features/admin/components/categories/category-list";

export const metadata: Metadata = {
  title: "Category Management",
};

export default function AdminCategoriesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="Category Management" description="Manage the Kaizen submission categories." />
      <AdminGuard>
        <CategoryList />
      </AdminGuard>
    </div>
  );
}
