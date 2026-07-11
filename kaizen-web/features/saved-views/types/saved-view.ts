export type SavedViewEntityType = "KAIZEN_LIST" | "REVIEW_QUEUE" | "IMPLEMENTATION_QUEUE" | "ADMIN_USERS";

export type SavedViewFilters = Record<string, string | number | boolean>;

export interface SavedView {
  id: string;
  entityType: SavedViewEntityType;
  name: string;
  filters: SavedViewFilters;
  isDefault: boolean;
  isShared: boolean;
  isOwn: boolean;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedViewInput {
  entityType: SavedViewEntityType;
  name: string;
  filters: SavedViewFilters;
  isDefault?: boolean;
  isShared?: boolean;
}

export interface UpdateSavedViewInput {
  name?: string;
  filters?: SavedViewFilters;
  isDefault?: boolean;
  isShared?: boolean;
}
