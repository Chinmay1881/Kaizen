import type { UserRole } from "@/types/enums";

export interface CurrentUserGamification {
  totalPoints: number;
  ideasSubmitted: number;
  ideasApproved: number;
  ideasImplemented: number;
  currentRank: number | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  department: { id: string; name: string; code: string } | null;
  jobTitle: string | null;
  gamification: CurrentUserGamification;
}
