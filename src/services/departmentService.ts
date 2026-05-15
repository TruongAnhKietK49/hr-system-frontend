import API from "@/lib/api";
import type { ApiResponse } from "@/types/auth";
import type {
  CreateDepartmentPayload,
  DepartmentRecord,
  ManagerCandidate,
  UpdateDepartmentPayload,
} from "@/types/department";

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  managerCandidates: (keyword: string) =>
    [...departmentKeys.all, "manager-candidates", keyword] as const,
};

export const departmentService = {
  async getAll() {
    const response =
      await API.get<ApiResponse<DepartmentRecord[]>>("/departments");

    return response.data.data;
  },

  async searchManagerCandidates(keyword: string, limit = 20) {
    const response = await API.get<ApiResponse<ManagerCandidate[]>>(
      "/departments/manager-candidates",
      {
        params: {
          keyword: keyword.trim() || undefined,
          limit,
        },
      },
    );

    return response.data.data;
  },

  async create(payload: CreateDepartmentPayload) {
    const response = await API.post<ApiResponse<DepartmentRecord>>(
      "/departments",
      payload,
    );

    return response.data.data;
  },

  async update(departmentId: string, payload: UpdateDepartmentPayload) {
    const response = await API.put<ApiResponse<DepartmentRecord>>(
      `/departments/${departmentId}`,
      payload,
    );

    return response.data.data;
  },

  async delete(departmentId: string) {
    const response = await API.delete<ApiResponse<null>>(
      `/departments/${departmentId}`,
    );

    return response.data.data;
  },
};
