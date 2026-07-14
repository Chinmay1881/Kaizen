"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/feedback/success-toast";
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import { useCreateAdminDepartment, useUpdateAdminDepartment } from "@/features/admin/hooks/use-admin-departments";
import type { AdminDepartment } from "@/features/admin/types/admin";
import { ApiError } from "@/lib/api-client";

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: AdminDepartment;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function DepartmentFormDialog({ open, onOpenChange, department }: DepartmentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open ? <DepartmentFormFields onOpenChange={onOpenChange} department={department} /> : null}</DialogContent>
    </Dialog>
  );
}

function DepartmentFormFields({ onOpenChange, department }: { onOpenChange: (open: boolean) => void; department?: AdminDepartment }) {
  const isEdit = Boolean(department);
  const { data: managerCandidates } = useAdminUsers({ page: 1, pageSize: 100, role: "DEPARTMENT_MANAGER", isActive: true });
  const createDepartment = useCreateAdminDepartment();
  const updateDepartment = useUpdateAdminDepartment();

  const [name, setName] = useState(() => department?.name ?? "");
  const [code, setCode] = useState(() => department?.code ?? "");
  const [managerId, setManagerId] = useState(() => department?.managerId ?? "");
  const [isActive, setIsActive] = useState(() => department?.isActive ?? true);

  const isPending = createDepartment.isPending || updateDepartment.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isEdit && department) {
      updateDepartment.mutate(
        { id: department.id, input: { name, code, managerId: managerId || null, isActive } },
        {
          onSuccess: () => {
            toast.success("Department updated.");
            onOpenChange(false);
          },
          onError: (error) => toast.error(getErrorMessage(error, "Could not update department.")),
        },
      );
      return;
    }

    createDepartment.mutate(
      { name, code, managerId: managerId || undefined },
      {
        onSuccess: () => {
          toast.success("Department created.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not create department.")),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Department" : "Add Department"}</DialogTitle>
        <DialogDescription>{isEdit ? "Update this department's name, code, or manager." : "Create a new department for employees to belong to."}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dept-name">Name</Label>
          <Input id="dept-name" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dept-code">Code</Label>
          <Input id="dept-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={20} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dept-manager">Manager</Label>
          <Select id="dept-manager" value={managerId} onChange={(event) => setManagerId(event.target.value)}>
            <option value="">— None —</option>
            {managerCandidates?.items.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.displayName}
              </option>
            ))}
          </Select>
        </div>
        {isEdit ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-primary h-4 w-4" />
            Active
          </label>
        ) : null}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEdit ? "Save Changes" : "Create Department"}
        </Button>
      </DialogFooter>
    </form>
  );
}
