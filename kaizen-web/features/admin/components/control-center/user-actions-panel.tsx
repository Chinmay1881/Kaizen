"use client";

import { useState } from "react";
import { ArrowUpCircle, Building2, Loader2, Pencil, ShieldOff, ShieldCheck } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/feedback/success-toast";
import { useAdminDepartments } from "@/features/admin/hooks/use-admin-departments";
import { useUpdateAdminUser } from "@/features/admin/hooks/use-admin-users";
import { UserFormDialog } from "@/features/admin/components/control-center/user-form-dialog";
import type { AdminUser } from "@/features/admin/types/admin";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { ApiError } from "@/lib/api-client";
import type { UserRole } from "@/types/enums";

const ROLE_ORDER: UserRole[] = ["EMPLOYEE", "DEPARTMENT_MANAGER", "HR", "CMD", "SUPER_ADMIN"];
const ROLE_LABEL: Record<UserRole, string> = {
  EMPLOYEE: "Employee",
  DEPARTMENT_MANAGER: "Department Manager",
  HR: "HR",
  CMD: "CMD",
  SUPER_ADMIN: "Super Admin",
};

interface UserActionsPanelProps {
  user: AdminUser;
}

/**
 * Right panel. Two brief-listed actions are intentionally absent, disclosed rather than faked:
 * "Reset" (password) has no endpoint anywhere — this app's accounts are Clerk-issued, and no
 * password-reset route exists on `kaizen-api`. "Delete" has no hard-delete route either — `DELETE
 * /users/:id` is a soft deactivation (`isActive: false`), identical to "Deactivate" below, so a
 * second button doing the same thing would be a duplicate control, not a distinct capability.
 */
export function UserActionsPanel({ user }: UserActionsPanelProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: departments } = useAdminDepartments();
  const updateUser = useUpdateAdminUser();

  const [editOpen, setEditOpen] = useState(false);
  const [transferId, setTransferId] = useState(user.department?.id ?? "");

  const isSelf = user.id === currentUser?.id;
  const roleIndex = ROLE_ORDER.indexOf(user.role);
  const nextRole = roleIndex >= 0 && roleIndex < ROLE_ORDER.length - 1 ? ROLE_ORDER[roleIndex + 1] : null;

  function handlePromote() {
    if (!nextRole) return;
    updateUser.mutate(
      { id: user.id, input: { role: nextRole } },
      {
        onSuccess: () => toast.success(`Promoted to ${ROLE_LABEL[nextRole]}.`),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not promote this user."),
      },
    );
  }

  function handleTransfer() {
    if (transferId === (user.department?.id ?? "")) return;
    updateUser.mutate(
      { id: user.id, input: { departmentId: transferId || null } },
      {
        onSuccess: () => toast.success("Department transferred."),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not transfer department."),
      },
    );
  }

  function handleToggleActive() {
    updateUser.mutate(
      { id: user.id, input: { isActive: !user.isActive } },
      {
        onSuccess: () => toast.success(user.isActive ? "User deactivated." : "User reactivated."),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update this user."),
      },
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-4">
      <Button variant="outline" className="justify-start" onClick={() => setEditOpen(true)}>
        <Pencil className="h-4 w-4" />
        Edit User
      </Button>

      <Button variant="outline" className="justify-start" onClick={handlePromote} disabled={!nextRole || updateUser.isPending}>
        <ArrowUpCircle className="h-4 w-4" />
        {nextRole ? `Promote to ${ROLE_LABEL[nextRole]}` : "Already at highest role"}
      </Button>

      <div className="rounded-lg border p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
          <Building2 className="h-3.5 w-3.5" />
          Transfer Department
        </p>
        <div className="flex items-center gap-2">
          <Select value={transferId} onChange={(event) => setTransferId(event.target.value)} className="h-8 flex-1 text-xs">
            <option value="">— None —</option>
            {departments?.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
          <Button size="sm" className="h-8" disabled={transferId === (user.department?.id ?? "") || updateUser.isPending} onClick={handleTransfer}>
            Move
          </Button>
        </div>
      </div>

      {!isSelf ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className={user.isActive ? "text-destructive hover:text-destructive justify-start" : "justify-start"}>
              {user.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {user.isActive ? "Deactivate" : "Reactivate"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{user.isActive ? `Deactivate ${user.displayName}?` : `Reactivate ${user.displayName}?`}</AlertDialogTitle>
              <AlertDialogDescription>
                {user.isActive
                  ? "They will no longer be able to sign in. This platform has no hard-delete for user accounts — deactivating is the reversible equivalent."
                  : "They will be able to sign in again immediately."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  handleToggleActive();
                }}
              >
                {updateUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {user.isActive ? "Deactivate" : "Reactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <UserFormDialog open={editOpen} onOpenChange={setEditOpen} user={user} />
    </div>
  );
}
