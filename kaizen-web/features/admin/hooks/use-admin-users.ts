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

/** Wires up `GET /users/:id` — an existing, previously-unused-by-the-frontend endpoint — so the
 * User Workspace can keep a selected user's full profile in view even if a filter/page change
 * scrolls them out of the currently loaded list. */
export function useAdminUser(id: string | null) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["admin", "users", "detail", id],
    queryFn: async () => adminService.getUser(await getToken(), id!),
    enabled: isLoaded && isSignedIn && Boolean(id),
  });
}

function useInvalidateAdminUsers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
  };
  // Note: ["admin", "users"] already covers ["admin", "users", "detail", id] as a prefix match.
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
