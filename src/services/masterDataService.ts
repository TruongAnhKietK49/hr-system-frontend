import API from "@/lib/api";
import { ApiResponse } from "@/types/auth";
import { Department, Employee } from "@/types/masterData";

export const masterDataService = {
  async getDepartments() {
    const response = await API.get<ApiResponse<Department[]>>("/departments");
    return response.data.data;
  },

  async getEmployees() {
    const response = await API.get<ApiResponse<Employee[]>>("/employees");
    return response.data.data;
  },
};
