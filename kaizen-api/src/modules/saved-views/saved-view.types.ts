import type { SavedViewEntityType } from "@prisma/client";

export interface SavedViewItem {
  id: string;
  entityType: SavedViewEntityType;
  name: string;
  filters: Record<string, unknown>;
  isDefault: boolean;
  isShared: boolean;
  isOwn: boolean;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}
