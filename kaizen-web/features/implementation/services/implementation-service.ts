import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  AssignImplementationInput,
  BusinessImpact,
  CompleteImplementationInput,
  Implementation,
  ImplementationAttachment,
  ImplementationListParams,
  PaginationMeta,
  RecordBusinessImpactInput,
  UpdateImplementationInput,
  VerifyImplementationInput,
} from "@/features/implementation/types/implementation";

function buildListQuery(params: ImplementationListParams): string {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.status) search.set("status", params.status);
  if (params.departmentId) search.set("departmentId", params.departmentId);
  if (params.ownerId) search.set("ownerId", params.ownerId);
  if (params.dateFrom) search.set("dateFrom", params.dateFrom);
  if (params.dateTo) search.set("dateTo", params.dateTo);
  if (params.kaizenStatus) search.set("kaizenStatus", params.kaizenStatus);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const implementationService = {
  list: async (
    token: string | null,
    params: ImplementationListParams,
  ): Promise<{ items: Implementation[]; meta: PaginationMeta }> => {
    const response = await apiClient<ApiSuccessResponse<Implementation[]>>(
      `/implementations${buildListQuery(params)}`,
      { token: token ?? undefined },
    );
    return {
      items: response.data,
      meta: response.meta ?? {
        page: 1,
        pageSize: response.data.length,
        total: response.data.length,
        totalPages: 1,
      },
    };
  },

  get: async (token: string | null, kaizenId: string): Promise<Implementation | null> => {
    const response = await apiClient<ApiSuccessResponse<Implementation | null>>(
      `/kaizens/${kaizenId}/implementation`,
      { token: token ?? undefined },
    );
    return response.data;
  },

  assign: async (
    token: string | null,
    kaizenId: string,
    input: AssignImplementationInput,
  ): Promise<Implementation> => {
    const response = await apiClient<ApiSuccessResponse<Implementation>>(
      `/kaizens/${kaizenId}/implementation/assign`,
      { method: "POST", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },

  updateProgress: async (
    token: string | null,
    kaizenId: string,
    input: UpdateImplementationInput,
  ): Promise<Implementation> => {
    const response = await apiClient<ApiSuccessResponse<Implementation>>(
      `/kaizens/${kaizenId}/implementation`,
      { method: "PATCH", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },

  complete: async (
    token: string | null,
    kaizenId: string,
    input: CompleteImplementationInput,
  ): Promise<Implementation> => {
    const response = await apiClient<ApiSuccessResponse<Implementation>>(
      `/kaizens/${kaizenId}/implementation/complete`,
      { method: "POST", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },

  verify: async (
    token: string | null,
    kaizenId: string,
    input: VerifyImplementationInput,
  ): Promise<Implementation> => {
    const response = await apiClient<ApiSuccessResponse<Implementation>>(
      `/kaizens/${kaizenId}/implementation/verify`,
      { method: "POST", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },

  registerAttachment: async (
    token: string | null,
    kaizenId: string,
    input: {
      fileName: string;
      fileType: string;
      mimeType: string;
      fileSizeBytes: number;
      cloudinaryPublicId: string;
      cloudinarySecureUrl: string;
    },
  ): Promise<ImplementationAttachment> => {
    const response = await apiClient<ApiSuccessResponse<ImplementationAttachment>>(
      `/kaizens/${kaizenId}/implementation/attachments`,
      { method: "POST", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },

  getBusinessImpact: async (
    token: string | null,
    kaizenId: string,
  ): Promise<BusinessImpact | null> => {
    const response = await apiClient<ApiSuccessResponse<BusinessImpact | null>>(
      `/kaizens/${kaizenId}/business-impact`,
      { token: token ?? undefined },
    );
    return response.data;
  },

  recordBusinessImpact: async (
    token: string | null,
    kaizenId: string,
    input: RecordBusinessImpactInput,
  ): Promise<BusinessImpact> => {
    const response = await apiClient<ApiSuccessResponse<BusinessImpact>>(
      `/kaizens/${kaizenId}/business-impact`,
      { method: "POST", token: token ?? undefined, body: JSON.stringify(input) },
    );
    return response.data;
  },
};
