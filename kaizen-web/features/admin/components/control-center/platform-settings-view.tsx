"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, Settings as SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { useAdminSettings, useUpdateAdminSettings } from "@/features/admin/hooks/use-admin-settings";
import type { PlatformSetting } from "@/features/admin/types/admin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/utils/format";

const GROUP_LABEL: Record<string, string> = {
  points: "Gamification & Points",
  upload: "Content & Uploads",
  pagination: "General",
};

function groupOf(key: string): string {
  const prefix = key.split(".")[0] ?? key;
  return GROUP_LABEL[prefix] ?? prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function bytesHint(key: string, value: unknown): string | null {
  if (!key.endsWith("_bytes") || typeof value !== "number") return null;
  return `≈ ${(value / (1024 * 1024)).toFixed(1)} MB`;
}

interface SettingCardProps {
  setting: PlatformSetting;
}

/** Owns its own edit state, lazy-initialized from `setting` — a fresh mount per setting `key`
 * (via the `key={setting.key}` the grid below sets), so a field's local edits never need to react
 * to a prop changing out from under it. */
function SettingCard({ setting }: SettingCardProps) {
  const updateSettings = useUpdateAdminSettings();
  const [value, setValue] = useState(() => String(setting.value ?? ""));

  const isDirty = value !== String(setting.value ?? "");
  const hint = bytesHint(setting.key, setting.value);

  function handleSave() {
    const asNumber = Number(value);
    const parsed = value !== "" && Number.isFinite(asNumber) ? asNumber : value;

    updateSettings.mutate([{ key: setting.key, value: parsed }], {
      onSuccess: () => toast.success(`${setting.key} updated.`),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update setting."),
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
      <Label htmlFor={`setting-${setting.key}`} className="font-mono text-xs">
        {setting.key}
      </Label>
      {setting.description ? <p className="text-muted-foreground text-sm">{setting.description}</p> : null}
      <div className="flex items-center gap-2">
        <Input id={`setting-${setting.key}`} value={value} onChange={(event) => setValue(event.target.value)} />
        <Button type="button" variant="outline" size="sm" disabled={!isDirty || updateSettings.isPending} onClick={handleSave}>
          {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      <p className="text-muted-foreground text-xs">
        Last updated {formatDate(setting.updatedAt)}
        {setting.updatedBy ? ` by ${setting.updatedBy.displayName}` : ""}
      </p>
    </div>
  );
}

/**
 * Every seeded `platform_settings` value is a plain JSON number under one of three real key
 * prefixes — `points.*`, `upload.*`, `pagination.*` (`prisma/seed.ts`). Groups here are derived
 * from those actual prefixes; the brief's larger taxonomy (Notifications, Reports, Appearance,
 * Security) has no settings behind it in this backend, so those groups are not created — an empty
 * "Notifications" section with nothing in it would be a fabricated control, not a real one.
 */
export function PlatformSettingsView() {
  const query = useAdminSettings();
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = (query.data ?? []).filter((setting) => !term || setting.key.toLowerCase().includes(term) || (setting.description ?? "").toLowerCase().includes(term));
    const groups = new Map<string, PlatformSetting[]>();
    for (const setting of filtered) {
      const label = groupOf(setting.key);
      groups.set(label, [...(groups.get(label) ?? []), setting]);
    }
    return [...groups.entries()];
  }, [query.data, search]);

  if (query.isError) {
    return <ErrorState title="Couldn't load settings" description={query.error instanceof ApiError ? query.error.message : "Something went wrong."} onRetry={() => query.refetch()} />;
  }

  if (query.isLoading || !query.data) {
    return <LoadingSkeleton className="h-64 w-full rounded-xl" />;
  }

  if (query.data.length === 0) {
    return <EmptyState icon={SettingsIcon} title="No platform settings" description="Settings will appear here once seeded." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground text-sm">Points values, upload limits, and pagination defaults.</p>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search settings…" className="h-9 w-56 pl-8" aria-label="Search settings" />
        </div>
      </div>

      {grouped.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description={`Nothing matched "${search}".`} />
      ) : (
        grouped.map(([label, settings]) => (
          <section key={label} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{label}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {settings.map((setting) => (
                <SettingCard key={setting.key} setting={setting} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
