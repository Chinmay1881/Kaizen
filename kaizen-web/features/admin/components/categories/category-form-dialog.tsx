"use client";

import { createElement, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/feedback/success-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCategoryIcon } from "@/features/kaizen/constants/category-icons";
import {
  useCreateAdminCategory,
  useUpdateAdminCategory,
} from "@/features/admin/hooks/use-admin-categories";
import type { AdminCategory } from "@/features/admin/types/admin";
import { ApiError } from "@/lib/api-client";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: AdminCategory;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** Uses `createElement` rather than a `const Icon = getCategoryIcon(...); <Icon />` local — the
 * lint rule that flags "components created during render" treats any capitalized JSX-tag variable
 * assigned from a function call as a new component definition, even though `getCategoryIcon` just
 * looks up an existing, stable component reference from a fixed map (same lookup
 * `category-card-select.tsx` already does safely inside a `.map()` callback, which this rule
 * doesn't flag — this preview isn't in a callback, so it needs the explicit form instead). */
function CategoryIconPreview({ icon }: { icon: string }) {
  return (
    <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
      {createElement(getCategoryIcon(icon || null), { className: "h-5 w-5" })}
    </div>
  );
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const isEdit = Boolean(category);
  const createCategory = useCreateAdminCategory();
  const updateCategory = useUpdateAdminCategory();

  // Lazy initial state — safe because the parent remounts this component (via a `key` keyed on
  // the target category) every time the dialog opens for a different category.
  const [name, setName] = useState(() => category?.name ?? "");
  const [description, setDescription] = useState(() => category?.description ?? "");
  const [icon, setIcon] = useState(() => category?.icon ?? "");
  const [isActive, setIsActive] = useState(() => category?.isActive ?? true);

  const isPending = createCategory.isPending || updateCategory.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isEdit && category) {
      updateCategory.mutate(
        {
          id: category.id,
          input: {
            name,
            description: description.trim() || null,
            icon: icon.trim() || null,
            isActive,
          },
        },
        {
          onSuccess: () => {
            toast.success("Category updated.");
            onOpenChange(false);
          },
          onError: (error) => toast.error(getErrorMessage(error, "Could not update category.")),
        },
      );
      return;
    }

    createCategory.mutate(
      { name, description: description.trim() || undefined, icon: icon.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Category created.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not create category.")),
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{isEdit ? "Edit Category" : "Add Category"}</AlertDialogTitle>
            <AlertDialogDescription>
              Categories appear as the Step 1 cards in the Kaizen Submission Wizard.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={255}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-icon">Icon (Lucide component name)</Label>
              <div className="flex items-center gap-2">
                <CategoryIconPreview icon={icon} />
                <Input
                  id="category-icon"
                  value={icon}
                  onChange={(event) => setIcon(event.target.value)}
                  placeholder="e.g. Package"
                  maxLength={50}
                />
              </div>
            </div>
            {isEdit ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="accent-primary h-4 w-4"
                />
                Active
              </label>
            ) : null}
          </div>

          <AlertDialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create Category"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
