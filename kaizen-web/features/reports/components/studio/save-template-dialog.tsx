"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/feedback/success-toast";
import { useCreateTemplate } from "@/features/reports/hooks/use-report-templates";
import type { ReportBuilderFilters } from "@/features/reports/types/report";
import { ApiError } from "@/lib/api-client";

interface SaveTemplateDialogProps {
  filters: ReportBuilderFilters;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The one authoritative "save as template" UI — used from both the Studio's Actions Panel and
 * (implicitly, via the same current filters) anywhere else a report is being built. Replaces the
 * old `SaveTemplateButton` (native `<dialog>`) with the Milestone 12 `Dialog` primitive; same
 * `useCreateTemplate` mutation.
 */
export function SaveTemplateDialog({ filters, open, onOpenChange }: SaveTemplateDialogProps) {
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
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not save this template."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>Saves the current report type and filters for reuse.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Monthly Executive"
            autoFocus
            onKeyDown={(event) => event.key === "Enter" && handleSave()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createTemplate.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || createTemplate.isPending}>
            {createTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
