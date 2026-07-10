"use client";

import { useState } from "react";
import { Building2, Pencil, Plus, ShieldOff } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { AdminTable, type AdminTableColumn } from "@/features/admin/components/shared/admin-table";
import { DepartmentFormDialog } from "@/features/admin/components/departments/department-form-dialog";
import {
  useAdminDepartments,
  useDeactivateAdminDepartment,
} from "@/features/admin/hooks/use-admin-departments";
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import type { AdminDepartment } from "@/features/admin/types/admin";
import { ApiError } from "@/lib/api-client";

export function DepartmentList() {
  const query = useAdminDepartments();
  const { data: allUsers } = useAdminUsers({ page: 1, pageSize: 100 });
  const deactivate = useDeactivateAdminDepartment();
  const [dialogDepartment, setDialogDepartment] = useState<AdminDepartment | "new" | null>(null);

  if (query.isError) {
    const message =
      query.error instanceof ApiError
        ? query.error.message
        : "Something went wrong while fetching departments. Please try again.";
    return (
      <ErrorState title="Couldn't load departments" description={message} onRetry={() => query.refetch()} />
    );
  }

  if (query.isLoading || !query.data) {
    return <LoadingSkeleton className="h-64 w-full rounded-xl" />;
  }

  const managerName = (managerId: string | null) =>
    managerId ? (allUsers?.items.find((user) => user.id === managerId)?.displayName ?? "—") : "—";

  const columns: AdminTableColumn<AdminDepartment>[] = [
    { header: "Name", cell: (department) => <span className="font-medium">{department.name}</span> },
    { header: "Code", cell: (department) => department.code },
    { header: "Manager", cell: (department) => managerName(department.managerId) },
    {
      header: "Status",
      cell: (department) => (
        <Badge variant={department.isActive ? "success" : "outline"}>
          {department.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (department) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit department"
            onClick={() => setDialogDepartment(department)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {department.isActive ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Deactivate department">
                  <ShieldOff className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate {department.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Existing Kaizens and users keep their reference to it, but it won&apos;t appear
                    as a choice for new submissions. This can be reversed by editing it again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      deactivate.mutate(department.id, {
                        onSuccess: () => toast.success("Department deactivated."),
                        onError: (error) =>
                          toast.error(
                            error instanceof ApiError ? error.message : "Could not deactivate department.",
                          ),
                      });
                    }}
                  >
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogDepartment("new")}>
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {query.data.length === 0 ? (
        <EmptyState icon={Building2} title="No departments yet" description="Create the first one to get started." />
      ) : (
        <AdminTable columns={columns} rows={query.data} getRowKey={(department) => department.id} />
      )}

      <DepartmentFormDialog
        key={dialogDepartment && dialogDepartment !== "new" ? dialogDepartment.id : "new"}
        open={dialogDepartment !== null}
        onOpenChange={(open) => {
          if (!open) setDialogDepartment(null);
        }}
        department={dialogDepartment && dialogDepartment !== "new" ? dialogDepartment : undefined}
      />
    </div>
  );
}
