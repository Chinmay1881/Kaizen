import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { NotificationList } from "@/features/notifications/components/notification-list";

export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Notifications" description="Updates on your Kaizens, rewards, and achievements." />
      <NotificationList />
    </div>
  );
}
