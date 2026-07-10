export interface RewardItem {
  id: string;
  kaizenId: string;
  kaizen: { id: string; kaizenNumber: string; title: string };
  points: number;
  reason: string;
  issuedBy: { id: string; displayName: string } | null;
  createdAt: string;
}

export interface PaginatedRewards {
  items: RewardItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
