export interface BusinessImpactItem {
  id: string;
  kaizenId: string;
  moneySaved: number | null;
  hoursSaved: number | null;
  employeesBenefited: number | null;
  customersBenefited: number | null;
  processImprovement: boolean;
  qualityImprovement: boolean;
  safetyImprovement: boolean;
  productivityImprovement: boolean;
  customerSatisfactionImprovement: boolean;
  remarks: string | null;
  recordedBy: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}
