"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notificationService } from "@/features/notifications/services/notification-service";

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };
}

export function useMarkNotificationRead() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: async (id: string) => notificationService.markRead(await getToken(), id),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const { getToken } = useAuth();
  const invalidate = useInvalidateNotifications();

  return useMutation({
    mutationFn: async () => notificationService.markAllRead(await getToken()),
    onSuccess: invalidate,
  });
}
