import type { Metadata } from "next";

import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { AdminSubNav } from "@/features/admin/components/control-center/admin-subnav";
import { CategoryGalleryView } from "@/features/admin/components/control-center/category-gallery-view";

export const metadata: Metadata = {
  title: "Category Management",
};

export default function AdminCategoriesPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminGuard>
        <AdminSubNav />
        <CategoryGalleryView />
      </AdminGuard>
    </div>
  );
}
