import API from "@/lib/api";
import { ApiResponse } from "@/types/auth";
import {
  EmployeeDetail,
  EmployeeListItem,
  UpdateEmployeeProfilePayload,
} from "@/types/employee";

export const employeeKeys = {
  all: ["employees"] as const,
  lists: () => [...employeeKeys.all, "list"] as const,
  detail: (employeeId: string) =>
    [...employeeKeys.all, "detail", employeeId] as const,
};

export const employeeService = {
  async getAll() {
    const response =
      await API.get<ApiResponse<EmployeeListItem[]>>("/employees");
    return response.data.data;
  },

  async getById(employeeId: string) {
    const response = await API.get<ApiResponse<EmployeeDetail>>(
      `/employees/${employeeId}`,
    );
    return response.data.data;
  },

  async update(employeeId: string, payload: UpdateEmployeeProfilePayload) {
    const response = await API.put<ApiResponse<EmployeeDetail>>(
      `/employees/${employeeId}`,
      payload,
    );

    return response.data.data;
  },
};
