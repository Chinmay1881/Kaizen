"use client";

import { useState } from "react";
import { Building2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { DepartmentCard } from "@/features/admin/components/control-center/department-card";
import { DepartmentFormDialog } from "@/features/admin/components/control-center/department-form-dialog";
import { useAdminDepartments, useDeactivateAdminDepartment } from "@/features/admin/hooks/use-admin-departments";
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import type { AdminDepartment } from "@/features/admin/types/admin";
import { useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { ApiError } from "@/lib/api-client";

/** Ideas/Approval Rate/Implementation stats/Savings per card come from `useDepartmentAnalytics()`
 * (real, already-existing endpoint, reused from the Analytics Studio) — `AdminDepartment` itself
 * only has `managerId`, no employee count or performance fields, so nothing here is invented. */
export function DepartmentGalleryView() {
  const query = useAdminDepartments();
  const usersQuery = useAdminUsers({ page: 1, pageSize: 100 });
  const analyticsQuery = useDepartmentAnalytics();
  const deactivate = useDeactivateAdminDepartment();
  const [dialogDepartment, setDialogDepartment] = useState<AdminDepartment | "new" | null>(null);

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load departments"
        description={query.error instanceof ApiError ? query.error.message : "Something went wrong."}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  function handleDeactivate(department: AdminDepartment) {
    deactivate.mutate(department.id, {
      onSuccess: () => toast.success("Department deactivated."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not deactivate department."),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Departments</h1>
          <p className="text-muted-foreground text-sm">Structure, managers, and real performance for every department.</p>
        </div>
        <Button onClick={() => setDialogDepartment("new")}>
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {query.data.length === 0 ? (
        <EmptyState icon={Building2} title="No departments yet" description="Create the first one to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.map((department, index) => (
            <DepartmentCard
              key={department.id}
              department={department}
              manager={usersQuery.data?.items.find((user) => user.id === department.managerId) ?? null}
              employeeCount={usersQuery.data?.items.filter((user) => user.department?.id === department.id).length ?? 0}
              analytics={analyticsQuery.data?.find((item) => item.departmentId === department.id) ?? null}
              onEdit={() => setDialogDepartment(department)}
              onDeactivate={() => handleDeactivate(department)}
              isDeactivating={deactivate.isPending}
              index={index}
            />
          ))}
        </div>
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
