"use client";

import { useRef, useState } from "react";
import { BookmarkPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/feedback/success-toast";
import { useCreateTemplate } from "@/features/reports/hooks/use-report-templates";
import type { ReportBuilderFilters } from "@/features/reports/types/report";
import { ApiError } from "@/lib/api-client";

interface SaveTemplateButtonProps {
  filters: ReportBuilderFilters;
}

/** Part 7 — "Allow saving report templates." Uses the same native `<dialog>` modal pattern as the
 * rest of this codebase (Chunk 2's command palette) rather than a new Dialog dependency. */
export function SaveTemplateButton({ filters }: SaveTemplateButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const createTemplate = useCreateTemplate();

  function handleSave() {
    if (!name.trim()) return;
    createTemplate.mutate(
      { ...filters, name: name.trim() },
      {
        onSuccess: () => {
          toast.success("Template saved.");
          setName("");
          dialogRef.current?.close();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not save this template."),
      },
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => dialogRef.current?.showModal()}>
        <BookmarkPlus className="h-4 w-4" />
        Save as Template
      </Button>
      <dialog ref={dialogRef} className="w-full max-w-sm rounded-xl border p-0 backdrop:bg-black/40">
        <div className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="text-base font-semibold">Save as Template</h3>
            <p className="text-muted-foreground text-sm">Saves the current report type and filters for reuse.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Monthly Executive"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || createTemplate.isPending}>
              Save
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
