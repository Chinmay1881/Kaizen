export interface PlatformSettingItem {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  updatedBy: { id: string; displayName: string } | null;
  updatedAt: string;
}
