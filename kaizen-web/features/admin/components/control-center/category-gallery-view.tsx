"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Archive, ArchiveRestore, Pencil, Plus, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { CategoryFormDialog } from "@/features/admin/components/control-center/category-form-dialog";
import { useAdminCategories, useUpdateAdminCategory } from "@/features/admin/hooks/use-admin-categories";
import type { AdminCategory } from "@/features/admin/types/admin";
import { categoryTone } from "@/features/admin/utils/category-color";
import { getCategoryIcon } from "@/features/kaizen/constants/category-icons";
import { ApiError } from "@/lib/api-client";
import { fadeInUpVariants } from "@/lib/motion";

/**
 * "Usage count", "recent submissions", and "department usage" per category from the brief have no
 * backing data anywhere — `GET /kaizens` is hardcoded to the caller's own submissions on the
 * backend (no company-wide, per-category count exists for any role), and no category-analytics
 * endpoint exists. Rather than invent numbers, this gallery shows only what's real: identity,
 * description, sort order, and status. "Archive" is real — it's the same `isActive: false` PATCH
 * the old category list used ("Deactivate"); categories have no delete route at all.
 */
export function CategoryGalleryView() {
  const query = useAdminCategories();
  const updateCategory = useUpdateAdminCategory();
  const [dialogCategory, setDialogCategory] = useState<AdminCategory | "new" | null>(null);

  if (query.isError) {
    return (
      <ErrorState title="Couldn't load categories" description={query.error instanceof ApiError ? query.error.message : "Something went wrong."} onRetry={() => query.refetch()} />
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  function handleToggleArchive(category: AdminCategory) {
    updateCategory.mutate(
      { id: category.id, input: { isActive: !category.isActive } },
      {
        onSuccess: () => toast.success(category.isActive ? "Category archived." : "Category restored."),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update this category."),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-sm">The categories offered in the Kaizen Submission Wizard.</p>
        </div>
        <Button onClick={() => setDialogCategory("new")}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {query.data.length === 0 ? (
        <EmptyState icon={Tag} title="No categories yet" description="Create the first one to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {query.data.map((category, index) => {
            const Icon = getCategoryIcon(category.icon);
            const tone = categoryTone(category.id);
            return (
              <motion.div
                key={category.id}
                initial="hidden"
                animate="visible"
                variants={fadeInUpVariants}
                transition={{ delay: Math.min(index, 10) * 0.03 }}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone.bg} ${tone.text}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={category.isActive ? "success" : "outline"}>{category.isActive ? "Active" : "Archived"}</Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{category.name}</p>
                  <p className="text-muted-foreground line-clamp-2 text-xs">{category.description ?? "No description."}</p>
                </div>
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>Sort order: {category.sortOrder}</span>
                </div>
                <div className="mt-auto flex items-center gap-1.5 border-t pt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setDialogCategory(category)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggleArchive(category)} disabled={updateCategory.isPending} aria-label={category.isActive ? "Archive category" : "Restore category"}>
                    {category.isActive ? <Archive className="h-3.5 w-3.5" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
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
