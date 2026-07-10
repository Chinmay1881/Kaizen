import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { auditService } from "../audit/audit.service.js";
import type { UpdateSettingsSchema } from "./platform-settings.schema.js";
import type { PlatformSettingItem } from "./platform-settings.types.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
}

const SETTING_INCLUDE = {
  updatedBy: { select: { id: true, displayName: true } },
} as const;

function toItem(setting: {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updatedBy: { id: string; displayName: string } | null;
  updatedAt: Date;
}): PlatformSettingItem {
  return {
    id: setting.id,
    key: setting.key,
    value: setting.value,
    description: setting.description,
    updatedBy: setting.updatedBy,
    updatedAt: setting.updatedAt.toISOString(),
  };
}

/** Backs the API spec's `GET/PATCH /api/v1/admin/settings` — the same `platform_settings` table
 * seeded with the 8 MVP `points.*`/`upload.*`/`pagination.*` keys in Milestone 9
 * (`GamificationService.getPointsSetting` reads it). This is the first place those values become
 * editable rather than fixed at their seeded defaults. */
class PlatformSettingsService {
  /** GET /api/v1/admin/settings — Super Admin. */
  async list(): Promise<PlatformSettingItem[]> {
    const settings = await prisma.platformSetting.findMany({
      include: SETTING_INCLUDE,
      orderBy: { key: "asc" },
    });
    return settings.map(toItem);
  }

  /** PATCH /api/v1/admin/settings — Super Admin. Rejects unknown keys rather than silently
   * creating new settings — this endpoint edits the seeded reference set, it doesn't define new
   * configuration surface. */
  async update(requester: Requester, input: UpdateSettingsSchema): Promise<PlatformSettingItem[]> {
    const existingSettings = await prisma.platformSetting.findMany({
      where: { key: { in: input.settings.map((setting) => setting.key) } },
    });
    const existingByKey = new Map(existingSettings.map((setting) => [setting.key, setting]));

    const unknownKeys = input.settings
      .map((setting) => setting.key)
      .filter((key) => !existingByKey.has(key));
    if (unknownKeys.length > 0) {
      throw new ApiError("VALIDATION_ERROR", "Unknown setting key(s).", 400, [
        { field: "settings", message: `Unknown key(s): ${unknownKeys.join(", ")}` },
      ]);
    }

    await prisma.$transaction(
      input.settings.map((setting) =>
        prisma.platformSetting.update({
          where: { key: setting.key },
          data: {
            value: setting.value as Prisma.InputJsonValue,
            updatedById: requester.id,
          },
        }),
      ),
    );

    // One audit row per setting, each keyed by that setting's own real UUID — `audit_logs.entity_id`
    // is a genuine Postgres UUID column, so a single combined row using the (non-UUID) setting
    // *key* as `entityId` would fail at the database level for any PATCH touching more than a
    // one-character key.
    await Promise.all(
      input.settings.map((setting) => {
        // `unknownKeys` already threw above if any key were missing, so this is always found.
        const existing = existingByKey.get(setting.key);
        if (!existing) return Promise.resolve();

        return auditService.record({
          userId: requester.id,
          userRole: requester.role,
          action: "admin.settings.update",
          entityType: "PlatformSetting",
          entityId: existing.id,
          previousValue: { key: setting.key, value: existing.value },
          newValue: { key: setting.key, value: setting.value },
        });
      }),
    );

    return this.list();
  }
}

export const platformSettingsService = new PlatformSettingsService();
