import type { Metadata } from "next";

import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { AdminSubNav } from "@/features/admin/components/control-center/admin-subnav";
import { PlatformSettingsView } from "@/features/admin/components/control-center/platform-settings-view";

export const metadata: Metadata = {
  title: "Platform Settings",
};

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AdminGuard>
        <AdminSubNav />
        <PlatformSettingsView />
      </AdminGuard>
    </div>
  );
}
