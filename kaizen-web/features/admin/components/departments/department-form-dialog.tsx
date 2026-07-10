"use client";

import { useState } from "react";
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
import { Select } from "@/components/ui/select";
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import {
  useCreateAdminDepartment,
  useUpdateAdminDepartment,
} from "@/features/admin/hooks/use-admin-departments";
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
  const isEdit = Boolean(department);
  // Department Managers are the only sensible pick for this field — filtering the user list
  // client-side avoids a second, narrower "managers only" backend query for one dropdown.
  const { data: managerCandidates } = useAdminUsers({
    page: 1,
    pageSize: 100,
    role: "DEPARTMENT_MANAGER",
    isActive: true,
  });
  const createDepartment = useCreateAdminDepartment();
  const updateDepartment = useUpdateAdminDepartment();

  // Lazy initial state — safe because the parent remounts this component (via a `key` keyed on
  // the target department) every time the dialog opens for a different department.
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{isEdit ? "Edit Department" : "Add Department"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEdit
                ? "Update this department's name, code, or manager."
                : "Create a new department for employees to belong to."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dept-name">Name</Label>
              <Input id="dept-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dept-code">Code</Label>
              <Input
                id="dept-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                maxLength={20}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dept-manager">Manager</Label>
              <Select
                id="dept-manager"
                value={managerId}
                onChange={(event) => setManagerId(event.target.value)}
              >
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
              {isEdit ? "Save Changes" : "Create Department"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
