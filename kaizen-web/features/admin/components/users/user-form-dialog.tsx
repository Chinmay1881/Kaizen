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
import { USER_ROLE_OPTIONS } from "@/features/admin/constants/roles";
import { useAdminDepartments } from "@/features/admin/hooks/use-admin-departments";
import { useCreateAdminUser, useUpdateAdminUser } from "@/features/admin/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin/types/admin";
import { ApiError } from "@/lib/api-client";
import type { UserRole } from "@/types/enums";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode (only role/department/active are patchable); absent = create mode. */
  user?: AdminUser;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEdit = Boolean(user);
  const { data: departments } = useAdminDepartments();
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();

  // Lazy initial state, seeded once from `user` — correct because the parent remounts this
  // component (via a `key` keyed on the target user) every time the dialog opens for a different
  // user, rather than this component reacting to prop changes while staying mounted.
  const [email, setEmail] = useState(() => user?.email ?? "");
  const [firstName, setFirstName] = useState(() => user?.firstName ?? "");
  const [lastName, setLastName] = useState(() => user?.lastName ?? "");
  const [role, setRole] = useState<UserRole>(() => user?.role ?? "EMPLOYEE");
  const [departmentId, setDepartmentId] = useState(() => user?.department?.id ?? "");
  const [isActive, setIsActive] = useState(() => user?.isActive ?? true);

  const isPending = createUser.isPending || updateUser.isPending;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isEdit && user) {
      updateUser.mutate(
        { id: user.id, input: { role, departmentId: departmentId || null, isActive } },
        {
          onSuccess: () => {
            toast.success("User updated.");
            onOpenChange(false);
          },
          onError: (error) => toast.error(getErrorMessage(error, "Could not update user.")),
        },
      );
      return;
    }

    createUser.mutate(
      {
        email,
        firstName,
        lastName,
        role,
        departmentId: departmentId || undefined,
      },
      {
        onSuccess: () => {
          toast.success("User created.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(getErrorMessage(error, "Could not create user.")),
      },
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{isEdit ? "Edit User" : "Add User"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEdit
                ? "Change this user's role, department, or active status."
                : "Creates a Clerk account for this email and invites them to sign in."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isEdit}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-first-name">First Name</Label>
              <Input
                id="user-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                disabled={isEdit}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-last-name">Last Name</Label>
              <Input
                id="user-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                disabled={isEdit}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-role">Role</Label>
              <Select
                id="user-role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-department">Department</Label>
              <Select
                id="user-department"
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
              >
                <option value="">— None —</option>
                {departments?.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </div>
            {isEdit ? (
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
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
              {isEdit ? "Save Changes" : "Create User"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
