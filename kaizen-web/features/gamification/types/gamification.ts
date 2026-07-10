export type LeaderboardPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY" | "ALL_TIME";
export type LeaderboardScope = "COMPANY" | "DEPARTMENT";
export type AchievementRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

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

export interface AchievementDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  pointsAwarded: number;
  isActive: boolean;
}

export interface UserAchievement {
  id: string;
  earnedAt: string;
  achievement: AchievementDefinition;
}
