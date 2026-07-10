"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminService } from "@/features/admin/services/admin-service";
import type { CreateDepartmentInput, UpdateDepartmentInput } from "@/features/admin/types/admin";

export function useAdminDepartments() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["admin", "departments"],
    queryFn: async () => adminService.listDepartments(await getToken()),
    enabled: isLoaded && isSignedIn,
  });
}

function useInvalidateAdminDepartments() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
    // Department picker on the Kaizen Wizard / My Ideas filters reads the same list endpoint.
    void queryClient.invalidateQueries({ queryKey: ["departments"] });
  };
}

export function useCreateAdminDepartment() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateAdminDepartments();

  return useMutation({
    mutationFn: async (input: CreateDepartmentInput) =>
      adminService.createDepartment(await getToken(), input),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminDepartment() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateAdminDepartments();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateDepartmentInput }) =>
      adminService.updateDepartment(await getToken(), id, input),
    onSuccess: invalidate,
  });
}

export function useDeactivateAdminDepartment() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateAdminDepartments();

  return useMutation({
    mutationFn: async (id: string) => adminService.deactivateDepartment(await getToken(), id),
    onSuccess: invalidate,
  });
}
