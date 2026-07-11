import type { Prisma, SavedViewEntityType } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import type { UserRole } from "../../constants/roles.js";
import type { CreateSavedViewSchema, UpdateSavedViewSchema } from "./saved-view.schema.js";
import type { SavedViewItem } from "./saved-view.types.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

function toItem(
  view: {
    id: string;
    entityType: SavedViewEntityType;
    name: string;
    filters: Prisma.JsonValue;
    isDefault: boolean;
    isShared: boolean;
    userId: string;
    user: { displayName: string };
    createdAt: Date;
    updatedAt: Date;
  },
  requesterId: string,
): SavedViewItem {
  return {
    id: view.id,
    entityType: view.entityType,
    name: view.name,
    filters: (view.filters as Record<string, unknown>) ?? {},
    isDefault: view.isDefault,
    isShared: view.isShared,
    isOwn: view.userId === requesterId,
    ownerName: view.user.displayName,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
  };
}

/** Backs "Saved Views" (Milestone 11 Chunk 2 Part 3) — a user's own filter/sort combinations for
 * a given list page, plus anything a Super Admin has marked `isShared`. `filters` is opaque JSON
 * mirroring that list endpoint's own query params; this module never interprets it. */
class SavedViewService {
  async list(requester: Requester, entityType: SavedViewEntityType): Promise<SavedViewItem[]> {
    const views = await prisma.savedView.findMany({
      where: { entityType, OR: [{ userId: requester.id }, { isShared: true }] },
      include: { user: { select: { displayName: true } } },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return views.map((view) => toItem(view, requester.id));
  }

  async create(requester: Requester, input: CreateSavedViewSchema): Promise<SavedViewItem> {
    if (input.isShared && requester.role !== "SUPER_ADMIN") {
      throw new ApiError("FORBIDDEN", "Only Super Admin can share a saved view.", 403);
    }

    const view = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.savedView.updateMany({
          where: { userId: requester.id, entityType: input.entityType, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.savedView.create({
        data: {
          userId: requester.id,
          entityType: input.entityType,
          name: input.name,
          filters: input.filters as Prisma.InputJsonValue,
          isDefault: input.isDefault ?? false,
          isShared: input.isShared ?? false,
        },
        include: { user: { select: { displayName: true } } },
      });
    });

    return toItem(view, requester.id);
  }

  async update(requester: Requester, id: string, input: UpdateSavedViewSchema): Promise<SavedViewItem> {
    const existing = await this.findOwnedOrThrow(id, requester);

    if (input.isShared && requester.role !== "SUPER_ADMIN") {
      throw new ApiError("FORBIDDEN", "Only Super Admin can share a saved view.", 403);
    }

    const view = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.savedView.updateMany({
          where: {
            userId: requester.id,
            entityType: existing.entityType,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }
      return tx.savedView.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.filters !== undefined ? { filters: input.filters as Prisma.InputJsonValue } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
          ...(input.isShared !== undefined ? { isShared: input.isShared } : {}),
        },
        include: { user: { select: { displayName: true } } },
      });
    });

    return toItem(view, requester.id);
  }

  async remove(requester: Requester, id: string): Promise<void> {
    await this.findOwnedOrThrow(id, requester);
    await prisma.savedView.delete({ where: { id } });
  }

  /** Only the creator can rename/update/delete their own view — a shared view is read-only
   * (usable, applyable) to everyone else, matching "Share (Super Admin only)" as a publish
   * action, not joint ownership. */
  private async findOwnedOrThrow(id: string, requester: Requester) {
    const view = await prisma.savedView.findUnique({ where: { id } });
    if (!view) {
      throw new ApiError("NOT_FOUND", "Saved view not found.", 404);
    }
    if (view.userId !== requester.id) {
      throw new ApiError("FORBIDDEN", "You can only modify your own saved views.", 403);
    }
    return view;
  }
}

export const savedViewService = new SavedViewService();
