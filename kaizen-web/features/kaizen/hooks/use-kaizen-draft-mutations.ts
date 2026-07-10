"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";

import { kaizenService } from "@/features/kaizen/services/kaizen-service";
import type { CreateKaizenInput, UpdateKaizenInput } from "@/features/kaizen/types/kaizen";

/** POST /kaizens — creates the draft row so subsequent steps have an id to autosave against. */
export function useCreateKaizenDraft() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateKaizenInput) => kaizenService.create(await getToken(), input),
  });
}

/** PATCH /kaizens/:id — used for both the "Next" autosave and the final pre-submit save. */
export function useUpdateKaizenDraft() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateKaizenInput }) =>
      kaizenService.update(await getToken(), id, input),
  });
}

/** POST /kaizens/:id/submit — transitions DRAFT -> SUBMITTED. */
export function useSubmitKaizen() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => kaizenService.submit(await getToken(), id),
  });
}

/** DELETE /kaizens/:id — used when the user discards a recovered draft to start fresh. */
export function useDeleteKaizenDraft() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => kaizenService.remove(await getToken(), id),
  });
}
