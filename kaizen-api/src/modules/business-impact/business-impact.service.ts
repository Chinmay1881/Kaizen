import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { workflowService } from "../workflow/workflow.service.js";
import type { RecordBusinessImpactSchema } from "./business-impact.schema.js";
import type { BusinessImpactItem } from "./business-impact.types.js";
import type { UserRole } from "../../constants/roles.js";

interface Requester {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

const COMPANY_WIDE_ROLES: UserRole[] = ["HR", "CMD", "SUPER_ADMIN"];

function toBusinessImpactItem(businessImpact: {
  id: string;
  kaizenId: string;
  moneySaved: unknown;
  hoursSaved: unknown;
  employeesBenefited: number | null;
  customersBenefited: number | null;
  processImprovement: boolean;
  qualityImprovement: boolean;
  safetyImprovement: boolean;
  productivityImprovement: boolean;
  customerSatisfactionImprovement: boolean;
  remarks: string | null;
  recordedBy: { id: string; displayName: string };
  createdAt: Date;
  updatedAt: Date;
}): BusinessImpactItem {
  return {
    id: businessImpact.id,
    kaizenId: businessImpact.kaizenId,
    moneySaved: businessImpact.moneySaved != null ? Number(businessImpact.moneySaved) : null,
    hoursSaved: businessImpact.hoursSaved != null ? Number(businessImpact.hoursSaved) : null,
    employeesBenefited: businessImpact.employeesBenefited,
    customersBenefited: businessImpact.customersBenefited,
    processImprovement: businessImpact.processImprovement,
    qualityImprovement: businessImpact.qualityImprovement,
    safetyImprovement: businessImpact.safetyImprovement,
    productivityImprovement: businessImpact.productivityImprovement,
    customerSatisfactionImprovement: businessImpact.customerSatisfactionImprovement,
    remarks: businessImpact.remarks,
    recordedBy: businessImpact.recordedBy,
    createdAt: businessImpact.createdAt.toISOString(),
    updatedAt: businessImpact.updatedAt.toISOString(),
  };
}

/** Backs the API spec's "Business Impact" section. `record` is create-only: the schema's
 * `business_impacts.kaizen_id` is UNIQUE and the one path into `BUSINESS_IMPACT_RECORDED` is from
 * `IMPLEMENTATION_COMPLETED`, which the Kaizen can't return to — so a second call is rejected
 * rather than treated as an update, matching Evaluation's "submitted = immutable" precedent. */
class BusinessImpactService {
  /** GET /kaizens/:id/business-impact — "Required (scoped)". Own view check (not
   * KaizenService.getById) so the implementation's assigned owner — who may be in a different
   * department than the Kaizen itself — can see the impact of what they built; matches
   * ImplementationService's identical `assertCanView` rule. */
  async get(kaizenId: string, requester: Requester): Promise<BusinessImpactItem | null> {
    const kaizen = await this.loadKaizen(kaizenId);
    this.assertCanView(kaizen, requester);

    const businessImpact = await prisma.businessImpact.findUnique({
      where: { kaizenId },
      include: { recordedBy: { select: { id: true, displayName: true } } },
    });

    return businessImpact ? toBusinessImpactItem(businessImpact) : null;
  }

  /** POST /kaizens/:id/business-impact — IMPLEMENTATION_COMPLETED -> BUSINESS_IMPACT_RECORDED.
   * "Auth: Department Manager, HR, CMD" (+ Super Admin, same hierarchy-precedent reasoning as
   * ImplementationService.verify). Reward issuance ("Side effects: Triggers reward issuance
   * automatically" per the API spec) is intentionally NOT implemented — that's Gamification
   * milestone territory, which doesn't exist yet; same deferral pattern as every other
   * not-yet-built-subsystem side effect in this codebase (Milestone 4's submit points, Milestone
   * 6's approve notification). */
  async record(
    kaizenId: string,
    requester: Requester,
    input: RecordBusinessImpactSchema,
  ): Promise<BusinessImpactItem> {
    const kaizen = await this.loadKaizen(kaizenId);
    this.assertCanView(kaizen, requester);
    this.assertCanRecord(kaizen, requester);

    const existing = await prisma.businessImpact.findUnique({ where: { kaizenId } });
    if (existing) {
      throw new ApiError(
        "CONFLICT",
        "Business impact has already been recorded for this Kaizen.",
        409,
      );
    }

    await prisma.businessImpact.create({
      data: {
        kaizenId,
        recordedById: requester.id,
        moneySaved: input.moneySaved,
        hoursSaved: input.hoursSaved,
        employeesBenefited: input.employeesBenefited,
        customersBenefited: input.customersBenefited,
        processImprovement: input.processImprovement,
        qualityImprovement: input.qualityImprovement,
        safetyImprovement: input.safetyImprovement,
        productivityImprovement: input.productivityImprovement,
        customerSatisfactionImprovement: input.customerSatisfactionImprovement,
        remarks: input.remarks,
      },
    });

    await workflowService.transition({
      kaizenId,
      toStatus: "BUSINESS_IMPACT_RECORDED",
      actor: requester,
      description: "Business impact recorded.",
    });

    const result = await this.get(kaizenId, requester);
    if (!result) throw new ApiError("INTERNAL_ERROR", "Failed to load business impact.", 500);
    return result;
  }

  private assertCanRecord(kaizen: { department: { id: string } }, requester: Requester): void {
    const isManager =
      requester.role === "DEPARTMENT_MANAGER" && requester.departmentId === kaizen.department.id;
    if (!isManager && !COMPANY_WIDE_ROLES.includes(requester.role)) {
      throw new ApiError("FORBIDDEN", "You cannot record business impact for this Kaizen.", 403);
    }
  }

  private async loadKaizen(kaizenId: string) {
    const kaizen = await prisma.kaizen.findUnique({
      where: { id: kaizenId },
      select: {
        id: true,
        submitterId: true,
        assignedOwnerId: true,
        department: { select: { id: true, name: true } },
      },
    });
    if (!kaizen) {
      throw new ApiError("NOT_FOUND", "Kaizen not found.", 404);
    }
    return kaizen;
  }

  /** Matches ImplementationService's `assertCanView` exactly (submitter / assigned owner /
   * HR-CMD-SuperAdmin / dept-manager-same-dept). */
  private assertCanView(
    kaizen: { submitterId: string; assignedOwnerId: string | null; department: { id: string } },
    requester: Requester,
  ): void {
    if (kaizen.submitterId === requester.id) return;
    if (kaizen.assignedOwnerId === requester.id) return;
    if (COMPANY_WIDE_ROLES.includes(requester.role)) return;
    if (requester.role === "DEPARTMENT_MANAGER" && requester.departmentId === kaizen.department.id) {
      return;
    }
    throw new ApiError("FORBIDDEN", "You cannot view this Kaizen's business impact.", 403);
  }
}

export const businessImpactService = new BusinessImpactService();
