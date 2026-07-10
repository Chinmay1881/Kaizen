import type { AchievementRarity, LeaderboardPeriod, LeaderboardScope } from "@prisma/client";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  departmentName: string | null;
  totalPoints: number;
  ideasApproved: number;
  achievementCount: number;
}

export interface LeaderboardResult {
  period: LeaderboardPeriod;
  scope: LeaderboardScope;
  departmentId: string | null;
  rankings: LeaderboardEntry[];
  computedAt: string;
}

export interface AchievementDefinitionItem {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  pointsAwarded: number;
  isActive: boolean;
}

export interface UserAchievementItem {
  id: string;
  earnedAt: string;
  achievement: AchievementDefinitionItem;
}

export interface PointsLedgerItem {
  id: string;
  amount: number;
  reason: string;
  kaizenId: string | null;
  issuedBy: { id: string; displayName: string } | null;
  createdAt: string;
}

export interface PaginatedPointsLedger {
  items: PointsLedgerItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
