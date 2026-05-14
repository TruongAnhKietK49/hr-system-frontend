import API from "@/lib/api";
import { ApiResponse } from "@/types/auth";
import { CreateHRRequestPayload, HRRequestResponse } from "@/types/hrRequest";

export const hrRequestService = {
  async create(payload: CreateHRRequestPayload) {
    const response = await API.post<ApiResponse<HRRequestResponse>>(
      "/hr-requests",
      payload,
    );

    return response.data.data;
  },

  async getAll() {
    const response =
      await API.get<ApiResponse<HRRequestResponse[]>>("/hr-requests");

    return response.data.data;
  },
};
