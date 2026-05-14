import API from "@/lib/api";
import type { ApiResponse } from "@/types/auth";
import type { SalaryRecord, UpdateSalaryPayload } from "@/types/salary";

export const salaryKeys = {
  all: ["salaries"] as const,
  lists: () => [...salaryKeys.all, "list"] as const,
  detail: (employeeId: string) =>
    [...salaryKeys.all, "detail", employeeId] as const,
};

export const salaryService = {
  async getAll() {
    const response = await API.get<ApiResponse<SalaryRecord[]>>("/salaries");
    return response.data.data;
  },

  async getByEmployeeId(employeeId: string) {
    const response = await API.get<ApiResponse<SalaryRecord>>(
      `/salaries/${employeeId}`,
    );

    return response.data.data;
  },

  async update(employeeId: string, payload: UpdateSalaryPayload) {
    const response = await API.put<ApiResponse<SalaryRecord>>(
      `/salaries/${employeeId}`,
      payload,
    );

    return response.data.data;
  },
};
