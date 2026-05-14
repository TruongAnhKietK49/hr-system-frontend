import API from "@/lib/api";
import type { ApiResponse } from "@/types/auth";
import type { FinancePayrollRecord } from "@/types/finance";

export const financeKeys = {
  all: ["finance"] as const,
  payroll: () => [...financeKeys.all, "payroll"] as const,
  payrollDetail: (employeeId: string) =>
    [...financeKeys.all, "payroll", "detail", employeeId] as const,
};

export const financeService = {
  async getPayroll() {
    const response =
      await API.get<ApiResponse<FinancePayrollRecord[]>>("/finance/payroll");

    return response.data.data;
  },

  async getPayrollByEmployeeId(employeeId: string) {
    const response = await API.get<ApiResponse<FinancePayrollRecord>>(
      `/finance/payroll/${employeeId}`,
    );

    return response.data.data;
  },
};
