import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AdminGuard } from "@/features/admin/components/shared/admin-guard";
import { SettingsEditor } from "@/features/admin/components/settings/settings-editor";

export const metadata: Metadata = {
  title: "Platform Settings",
};

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="Platform Settings" description="Tune points values and other platform-wide configuration." />
      <AdminGuard>
        <SettingsEditor />
      </AdminGuard>
    </div>
  );
}
