"use client";

import { useState } from "react";
import { Loader2, Settings as SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { useAdminSettings, useUpdateAdminSettings } from "@/features/admin/hooks/use-admin-settings";
import type { PlatformSetting } from "@/features/admin/types/admin";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/utils/format";

interface SettingFieldProps {
  setting: PlatformSetting;
}

/** Owns its own edit state, lazy-initialized from `setting` — a fresh mount per setting `key`
 * (see `SettingsEditor` below) rather than an effect syncing a shared `drafts` record, so each
 * field's local edits never need to react to a prop changing out from under it. */
function SettingField({ setting }: SettingFieldProps) {
  const updateSettings = useUpdateAdminSettings();
  const [value, setValue] = useState(() => String(setting.value ?? ""));

  const isDirty = value !== String(setting.value ?? "");

  function handleSave() {
    const asNumber = Number(value);
    const parsed = value !== "" && Number.isFinite(asNumber) ? asNumber : value;

    updateSettings.mutate([{ key: setting.key, value: parsed }], {
      onSuccess: () => toast.success(`${setting.key} updated.`),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "Could not update setting."),
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <Label htmlFor={`setting-${setting.key}`} className="font-mono text-xs">
          {setting.key}
        </Label>
        {setting.description ? (
          <p className="text-muted-foreground text-sm">{setting.description}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <Input
            id={`setting-${setting.key}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isDirty || updateSettings.isPending}
            onClick={handleSave}
          >
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Last updated {formatDate(setting.updatedAt)}
          {setting.updatedBy ? ` by ${setting.updatedBy.displayName}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}

/** Every seeded `platform_settings` value (Milestone 9) is a plain JSON number
 * (`points.*`/`upload.*`/`pagination.*`) — this editor is scoped to that reality rather than
 * building a generic JSON editor for value shapes nothing currently uses. */
export function SettingsEditor() {
  const query = useAdminSettings();

  if (query.isError) {
    const message =
      query.error instanceof ApiError
        ? query.error.message
        : "Something went wrong while fetching settings. Please try again.";
    return <ErrorState title="Couldn't load settings" description={message} onRetry={() => query.refetch()} />;
  }

  if (query.isLoading || !query.data) {
    return <LoadingSkeleton className="h-64 w-full rounded-xl" />;
  }

  if (query.data.length === 0) {
    return (
      <EmptyState
        icon={SettingsIcon}
        title="No platform settings"
        description="Settings will appear here once seeded."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {query.data.map((setting) => (
        <SettingField key={setting.key} setting={setting} />
      ))}
    </div>
  );
}
