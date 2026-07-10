"use client";

import { useState } from "react";
import { Pencil, Plus, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { AdminTable, type AdminTableColumn } from "@/features/admin/components/shared/admin-table";
import { CategoryFormDialog } from "@/features/admin/components/categories/category-form-dialog";
import { useAdminCategories } from "@/features/admin/hooks/use-admin-categories";
import { getCategoryIcon } from "@/features/kaizen/constants/category-icons";
import type { AdminCategory } from "@/features/admin/types/admin";
import { ApiError } from "@/lib/api-client";

export function CategoryList() {
  const query = useAdminCategories();
  const [dialogCategory, setDialogCategory] = useState<AdminCategory | "new" | null>(null);

  if (query.isError) {
    const message =
      query.error instanceof ApiError
        ? query.error.message
        : "Something went wrong while fetching categories. Please try again.";
    return (
      <ErrorState title="Couldn't load categories" description={message} onRetry={() => query.refetch()} />
    );
  }

  if (query.isLoading || !query.data) {
    return <LoadingSkeleton className="h-64 w-full rounded-xl" />;
  }

  const columns: AdminTableColumn<AdminCategory>[] = [
    {
      header: "Name",
      cell: (category) => {
        const Icon = getCategoryIcon(category.icon);
        return (
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium">{category.name}</span>
          </div>
        );
      },
    },
    { header: "Description", cell: (category) => category.description ?? "—" },
    { header: "Sort Order", cell: (category) => category.sortOrder },
    {
      header: "Status",
      cell: (category) => (
        <Badge variant={category.isActive ? "success" : "outline"}>
          {category.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (category) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit category"
          onClick={() => setDialogCategory(category)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogCategory("new")}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {query.data.length === 0 ? (
        <EmptyState icon={Tag} title="No categories yet" description="Create the first one to get started." />
      ) : (
        <AdminTable columns={columns} rows={query.data} getRowKey={(category) => category.id} />
      )}

      <CategoryFormDialog
        key={dialogCategory && dialogCategory !== "new" ? dialogCategory.id : "new"}
        open={dialogCategory !== null}
        onOpenChange={(open) => {
          if (!open) setDialogCategory(null);
        }}
        category={dialogCategory && dialogCategory !== "new" ? dialogCategory : undefined}
      />
    </div>
  );
}
