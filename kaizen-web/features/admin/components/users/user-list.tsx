"use client";

import { useState } from "react";
import { Loader2, Plus, ShieldOff, UserCog, Users } from "lucide-react";

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
import { toast } from "@/components/feedback/success-toast";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Select } from "@/components/ui/select";
import { AdminTable, type AdminTableColumn } from "@/features/admin/components/shared/admin-table";
import { UserFormDialog } from "@/features/admin/components/users/user-form-dialog";
import { USER_ROLE_OPTIONS } from "@/features/admin/constants/roles";
import { useAdminDepartments } from "@/features/admin/hooks/use-admin-departments";
import { useAdminUsers, useDeactivateAdminUser } from "@/features/admin/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin/types/admin";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiError } from "@/lib/api-client";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { formatDate } from "@/utils/format";

const PAGE_SIZE = 20;

export function UserList() {
  const { data: currentUser } = useCurrentUser();
  const { data: departments } = useAdminDepartments();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);
  const [dialogUser, setDialogUser] = useState<AdminUser | "new" | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const deactivate = useDeactivateAdminUser();

  const query = useAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: (role as AdminUser["role"]) || undefined,
    departmentId: departmentId || undefined,
    isActive: isActive === "" ? undefined : isActive === "true",
  });

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  if (query.isError) {
    const message =
      query.error instanceof ApiError
        ? query.error.message
        : "Something went wrong while fetching users. Please try again.";
    return <ErrorState title="Couldn't load users" description={message} onRetry={() => query.refetch()} />;
  }

  const columns: AdminTableColumn<AdminUser>[] = [
    {
      header: "Name",
      cell: (user) => (
        <div>
          <p className="font-medium">{user.displayName}</p>
          <p className="text-muted-foreground text-xs">{user.email}</p>
        </div>
      ),
    },
    { header: "Role", cell: (user) => <Badge variant="secondary">{user.role.replace("_", " ")}</Badge> },
    { header: "Department", cell: (user) => user.department?.name ?? "—" },
    {
      header: "Status",
      cell: (user) => (
        <Badge variant={user.isActive ? "success" : "outline"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    { header: "Joined", cell: (user) => formatDate(user.createdAt) },
    {
      header: "",
      className: "text-right",
      cell: (user) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" aria-label="Edit user" onClick={() => setDialogUser(user)}>
            <UserCog className="h-4 w-4" />
          </Button>
          {user.isActive && user.id !== currentUser?.id ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Deactivate user">
                  <ShieldOff className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate {user.displayName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    They will no longer be able to sign in. This can be reversed by editing the user
                    and marking them Active again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      deactivate.mutate(user.id, {
                        onSuccess: () => toast.success("User deactivated."),
                        onError: (error) =>
                          toast.error(
                            error instanceof ApiError ? error.message : "Could not deactivate user.",
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
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={(event) => updateFilter(setSearch)(event.target.value)}
          className="max-w-xs"
        />
        <Select className="w-auto" value={role} onChange={(event) => updateFilter(setRole)(event.target.value)}>
          <option value="">All Roles</option>
          {USER_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={departmentId}
          onChange={(event) => updateFilter(setDepartmentId)(event.target.value)}
        >
          <option value="">All Departments</option>
          {departments?.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={isActive}
          onChange={(event) => updateFilter(setIsActive)(event.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
        <Button className="ml-auto" onClick={() => setDialogUser("new")}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {query.isLoading || !query.data ? (
        <LoadingSkeleton className="h-64 w-full rounded-xl" />
      ) : query.data.items.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <AdminTable columns={columns} rows={query.data.items} getRowKey={(user) => user.id} />
          <MyIdeasPagination meta={query.data.meta} onPageChange={setPage} />
        </>
      )}

      {query.isFetching && !query.isLoading ? (
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
      ) : null}

      <UserFormDialog
        key={dialogUser && dialogUser !== "new" ? dialogUser.id : "new"}
        open={dialogUser !== null}
        onOpenChange={(open) => {
          if (!open) setDialogUser(null);
        }}
        user={dialogUser && dialogUser !== "new" ? dialogUser : undefined}
      />
    </div>
  );
}
