"use client";

import { useState } from "react";
import { Pin, Plus, Share2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/feedback/success-toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import {
  useCreateSavedView,
  useDeleteSavedView,
  useSavedViews,
  useUpdateSavedView,
} from "@/features/saved-views/hooks/use-saved-views";
import type { SavedViewEntityType, SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api-client";

interface SavedViewsBarProps {
  entityType: SavedViewEntityType;
  currentFilters: SavedViewFilters;
  onApply: (filters: SavedViewFilters) => void;
}

/** Saved Views (Milestone 11 Chunk 2 Part 3) — Save/Rename(via prompt)/Delete/Default/Share, all
 * against the real `saved_views` table. Reused verbatim across every list page that supports it
 * (Review Queue, Implementation Queue, My Ideas, Admin Users) rather than one-off per page. */
export function SavedViewsBar({ entityType, currentFilters, onApply }: SavedViewsBarProps) {
  const { data: currentUser } = useCurrentUser();
  const query = useSavedViews(entityType);
  const createView = useCreateSavedView(entityType);
  const updateView = useUpdateSavedView(entityType);
  const deleteView = useDeleteSavedView(entityType);

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [shareNew, setShareNew] = useState(false);

  const views = query.data ?? [];
  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createView.mutate(
      { entityType, name: trimmed, filters: currentFilters, isShared: shareNew },
      {
        onSuccess: () => {
          toast.success(`Saved view "${trimmed}" created.`);
          setIsCreating(false);
          setName("");
          setShareNew(false);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "Could not save this view."),
      },
    );
  }

  function handleRename(id: string, currentName: string) {
    const next = window.prompt("Rename saved view", currentName);
    if (!next || !next.trim() || next.trim() === currentName) return;
    updateView.mutate({ id, input: { name: next.trim() } });
  }

  function handleSetDefault(id: string) {
    updateView.mutate({ id, input: { isDefault: true } });
  }

  function handleDelete(id: string, viewName: string) {
    if (!window.confirm(`Delete saved view "${viewName}"?`)) return;
    deleteView.mutate(id);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {views.map((view) => (
        <div
          key={view.id}
          className={cn(
            "group flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-xs",
            view.isDefault ? "border-primary bg-primary/5" : "bg-background",
          )}
        >
          <button
            type="button"
            onClick={() => onApply(view.filters)}
            className="flex items-center gap-1 font-medium"
          >
            {view.isDefault ? <Pin className="h-3 w-3" /> : null}
            {view.isShared ? <Share2 className="h-3 w-3" /> : null}
            {view.name}
            {!view.isOwn ? <span className="text-muted-foreground font-normal">· {view.ownerName}</span> : null}
          </button>
          {view.isOwn ? (
            <span className="hidden items-center gap-0.5 group-hover:flex">
              {!view.isDefault ? (
                <button
                  type="button"
                  onClick={() => handleSetDefault(view.id)}
                  aria-label="Set as default"
                  className="hover:bg-accent rounded-full p-1"
                >
                  <Pin className="h-3 w-3" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => handleRename(view.id, view.name)}
                aria-label="Rename"
                className="hover:bg-accent rounded-full px-1 text-[10px]"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => handleDelete(view.id, view.name)}
                aria-label="Delete"
                className="hover:bg-destructive/10 hover:text-destructive rounded-full p-1"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ) : null}
        </div>
      ))}

      {isCreating ? (
        <div className="flex items-center gap-1.5">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="View name…"
            className="h-8 w-40 text-xs"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
              if (event.key === "Escape") setIsCreating(false);
            }}
          />
          {currentUser?.role === "SUPER_ADMIN" ? (
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={shareNew}
                onChange={(event) => setShareNew(event.target.checked)}
                className="accent-primary h-3.5 w-3.5"
              />
              Share
            </label>
          ) : null}
          <Button size="sm" className="h-8" onClick={handleCreate} disabled={createView.isPending}>
            Save
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsCreating(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={!hasActiveFilters}
          onClick={() => setIsCreating(true)}
          title={hasActiveFilters ? "Save current filters as a view" : "Set some filters first"}
        >
          <Plus className="h-3.5 w-3.5" />
          Save current filters
        </Button>
      )}
    </div>
  );
}
