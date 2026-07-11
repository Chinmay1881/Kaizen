"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedViewService } from "@/features/saved-views/services/saved-view-service";
import type {
  CreateSavedViewInput,
  SavedViewEntityType,
  UpdateSavedViewInput,
} from "@/features/saved-views/types/saved-view";

export function useSavedViews(entityType: SavedViewEntityType) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["saved-views", entityType],
    queryFn: async () => savedViewService.list(await getToken(), entityType),
    enabled: isLoaded && isSignedIn,
  });
}

function useInvalidateSavedViews(entityType: SavedViewEntityType) {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: ["saved-views", entityType] });
}

export function useCreateSavedView(entityType: SavedViewEntityType) {
  const { getToken } = useAuth();
  const invalidate = useInvalidateSavedViews(entityType);
  return useMutation({
    mutationFn: async (input: CreateSavedViewInput) => savedViewService.create(await getToken(), input),
    onSuccess: invalidate,
  });
}

export function useUpdateSavedView(entityType: SavedViewEntityType) {
  const { getToken } = useAuth();
  const invalidate = useInvalidateSavedViews(entityType);
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateSavedViewInput }) =>
      savedViewService.update(await getToken(), id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteSavedView(entityType: SavedViewEntityType) {
  const { getToken } = useAuth();
  const invalidate = useInvalidateSavedViews(entityType);
  return useMutation({
    mutationFn: async (id: string) => savedViewService.remove(await getToken(), id),
    onSuccess: invalidate,
  });
}
