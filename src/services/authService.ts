import API from "@/lib/api";
import {
  ApiResponse,
  LoginPayload,
  LoginResponseData,
  ChangePasswordPayload,
  RefreshResponseData,
} from "@/types/auth";

export const authService = {
  async login(payload: LoginPayload) {
    const response = await API.post<ApiResponse<LoginResponseData>>(
      "/auth/login",
      payload,
    );

    return response.data.data;
  },

  async refresh(refreshToken: string) {
    const response = await API.post<ApiResponse<RefreshResponseData>>(
      "/auth/refresh",
      { refreshToken },
    );

    return response.data.data;
  },

  async changePassword(payload: ChangePasswordPayload) {
    const response = await API.post<ApiResponse<null>>(
      "/auth/change-password",
      payload,
    );

    return response.data;
  },
};
