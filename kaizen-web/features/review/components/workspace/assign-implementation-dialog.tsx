"use client";

import { useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/feedback/success-toast";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import { useDepartmentUsers } from "@/features/kaizen/hooks/use-department-users";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { useAssignImplementation } from "@/features/implementation/hooks/use-implementation-mutations";
import { ApiError } from "@/lib/api-client";

interface AssignImplementationDialogProps {
  kaizen: KaizenDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Review-exclusive rebuild of `features/implementation/components/detail/implementation-assign-panel.tsx`
 * (now deleted — nothing else imported it) as a Milestone-12 `Dialog` triggered from the Decision
 * Center's action bar, instead of an always-visible inline form. Same
 * `useAssignImplementation` mutation, same fields.
 */
export function AssignImplementationDialog({ kaizen, open, onOpenChange }: AssignImplementationDialogProps) {
  const [assignedDepartmentId, setAssignedDepartmentId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const departmentsQuery = useDepartments();
  const usersQuery = useDepartmentUsers(assignedDepartmentId);
  const assign = useAssignImplementation(kaizen.id);

  function handleDepartmentChange(value: string) {
    setAssignedDepartmentId(value);
    setOwnerId("");
  }

  function handleAssign() {
    assign.mutate(
      { ownerId, assignedDepartmentId, dueDate: dueDate || undefined, description: description.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Implementation assigned.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not assign implementation."),
      },
    );
  }

  const canAssign = Boolean(assignedDepartmentId && ownerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Assign Implementation
          </DialogTitle>
          <DialogDescription>Choose who owns building this out and by when.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Assigned Department</label>
              <Select value={assignedDepartmentId} onChange={(event) => handleDepartmentChange(event.target.value)} disabled={assign.isPending}>
                <option value="">Select a department...</option>
                {departmentsQuery.data?.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Owner</label>
              <Select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} disabled={!assignedDepartmentId || usersQuery.isLoading || assign.isPending}>
                <option value="">{assignedDepartmentId ? "Select an owner..." : "Pick a department first"}</option>
                {usersQuery.data?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} ({user.role.replaceAll("_", " ")})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Due Date (optional)</label>
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} disabled={assign.isPending} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does implementing this involve?" rows={3} disabled={assign.isPending} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assign.isPending}>
            Cancel
          </Button>
          <Button disabled={!canAssign || assign.isPending} onClick={handleAssign}>
            {assign.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Assign Implementation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
