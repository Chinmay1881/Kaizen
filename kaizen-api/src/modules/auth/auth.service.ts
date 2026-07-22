import { clerkClient } from "@clerk/express";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { formatEmployeeCode } from "../../utils/employee-code.js";
import { normalizeApiUser } from "./clerk-user.mapper.js";
import type { MeResponse, NormalizedClerkUser, UpdateMeInput } from "./auth.types.js";

/** Atomically reserves the next employee code — same upsert-and-increment pattern as
 * `nextKaizenNumber` in kaizen.service.ts. Only ever called for a genuinely new user (see
 * `syncUser` below), so codes are never burned on a Clerk `user.updated` event. */
async function nextEmployeeCode(): Promise<string> {
  const sequence = await prisma.employeeCodeSequence.upsert({
    where: { id: 1 },
    create: { id: 1, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return formatEmployeeCode(sequence.lastValue);
}

const USER_WITH_PROFILE_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
  gamification: true,
} as const;

function toMeResponse(
  user: NonNullable<Awaited<ReturnType<typeof findUserWithProfile>>>,
): MeResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    department: user.department,
    jobTitle: user.jobTitle,
    gamification: {
      totalPoints: user.gamification?.totalPoints ?? 0,
      ideasSubmitted: user.gamification?.ideasSubmitted ?? 0,
      ideasApproved: user.gamification?.ideasApproved ?? 0,
      ideasImplemented: user.gamification?.ideasImplemented ?? 0,
      currentRank: user.gamification?.currentRank ?? null,
    },
  };
}

function findUserWithProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: USER_WITH_PROFILE_INCLUDE,
  });
}

class AuthService {
  /** Creates or updates the local `users` row from Clerk data (webhook or JIT sync share this).
   * Deliberately a find-then-branch rather than a single `upsert` — `employeeCode` must be
   * generated exactly once, only on real creation, never re-derived or touched on every
   * `user.updated` webhook delivery a profile edit would otherwise trigger. */
  async syncUser(input: NormalizedClerkUser) {
    const displayName = `${input.firstName} ${input.lastName}`.trim() || input.email;

    const existing = await prisma.user.findUnique({ where: { clerkId: input.clerkId } });

    if (!existing) {
      const employeeCode = await nextEmployeeCode();
      return prisma.user.create({
        data: {
          employeeCode,
          clerkId: input.clerkId,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          displayName,
          avatarUrl: input.avatarUrl,
          role: input.role ?? "EMPLOYEE",
          isActive: true,
          gamification: { create: {} },
        },
      });
    }

    return prisma.user.update({
      where: { clerkId: input.clerkId },
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        avatarUrl: input.avatarUrl,
        isActive: true,
        deletedAt: null,
        ...(input.role ? { role: input.role } : {}),
      },
    });
  }

  /** `user.deleted` webhook handler — soft delete only; `users.deletedAt` is designed for this. */
  async softDeleteByClerkId(clerkId: string) {
    await prisma.user.updateMany({
      where: { clerkId },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  async getActiveByClerkId(clerkId: string) {
    return prisma.user.findFirst({ where: { clerkId, deletedAt: null } });
  }

  /**
   * Resolves the local user for an authenticated Clerk session, syncing just-in-time if the
   * webhook hasn't delivered yet (e.g. local dev without a public webhook URL, or a race
   * immediately after signup). Production traffic is expected to hit the cached DB row.
   */
  async resolveOrSyncUser(clerkId: string) {
    const existing = await this.getActiveByClerkId(clerkId);
    if (existing) {
      return existing;
    }

    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(clerkId);
    } catch {
      throw new ApiError("UNAUTHORIZED", "User could not be verified with Clerk.", 401);
    }

    return this.syncUser(normalizeApiUser(clerkUser));
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await findUserWithProfile(userId);

    if (!user) {
      throw new ApiError("NOT_FOUND", "User profile not found.", 404);
    }

    if (!user.gamification) {
      await prisma.userGamification.create({ data: { userId: user.id } });
      return this.getMe(userId);
    }

    return toMeResponse(user);
  }

  async updateProfile(userId: string, input: UpdateMeInput): Promise<MeResponse> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
    });

    return this.getMe(userId);
  }
}

export const authService = new AuthService();
