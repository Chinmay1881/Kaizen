import type { UserRole } from "../../constants/roles.js";

export interface AuthContext {
  clerkId: string;
  sessionId: string | null;
}

export interface RequestUser {
  id: string;
  clerkId: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
}

/** Clerk profile fields normalized from either the webhook payload or the Backend API. */
export interface NormalizedClerkUser {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  /** Only set when Clerk's `public_metadata.role` holds a recognized role — see auth constants. */
  role?: UserRole;
}

export interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  department: { id: string; name: string; code: string } | null;
  jobTitle: string | null;
  gamification: {
    totalPoints: number;
    ideasSubmitted: number;
    ideasApproved: number;
    ideasImplemented: number;
    currentRank: number | null;
  };
}

export interface UpdateMeInput {
  jobTitle?: string;
  phone?: string;
}
