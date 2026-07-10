"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminService } from "@/features/admin/services/admin-service";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/features/admin/types/admin";

export function useAdminCategories() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => adminService.listCategories(await getToken()),
    enabled: isLoaded && isSignedIn,
  });
}

function useInvalidateAdminCategories() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    // Category picker on the Kaizen Wizard reads the same list endpoint.
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
  };
}

export function useCreateAdminCategory() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateAdminCategories();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) =>
      adminService.createCategory(await getToken(), input),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminCategory() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateAdminCategories();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      adminService.updateCategory(await getToken(), id, input),
    onSuccess: invalidate,
  });
}
