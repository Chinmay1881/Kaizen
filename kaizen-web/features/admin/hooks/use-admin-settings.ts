"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminService } from "@/features/admin/services/admin-service";

export function useAdminSettings() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => adminService.listSettings(await getToken()),
    enabled: isLoaded && isSignedIn,
  });
}

export function useUpdateAdminSettings() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Array<{ key: string; value: unknown }>) =>
      adminService.updateSettings(await getToken(), settings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}
