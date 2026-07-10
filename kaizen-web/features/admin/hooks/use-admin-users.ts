"use client";

import { useAuth } from "@clerk/nextjs";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminService } from "@/features/admin/services/admin-service";
import type {
  AdminUserListParams,
  CreateUserInput,
  UpdateUserInput,
} from "@/features/admin/types/admin";

export function useAdminUsers(params: AdminUserListParams) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () => adminService.listUsers(await getToken(), params),
    enabled: isLoaded && isSignedIn,
    placeholderData: keepPreviousData,
  });
}

function useInvalidateAdminUsers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
  };
}

export function useCreateAdminUser() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateAdminUsers();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => adminService.createUser(await getToken(), input),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminUser() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateAdminUsers();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateUserInput }) =>
      adminService.updateUser(await getToken(), id, input),
    onSuccess: invalidate,
  });
}

export function useDeactivateAdminUser() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateAdminUsers();

  return useMutation({
    mutationFn: async (id: string) => adminService.deactivateUser(await getToken(), id),
    onSuccess: invalidate,
  });
}
