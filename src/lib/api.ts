import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authStorage } from "@/lib/authStorage";
import { ApiResponse, RefreshResponseData } from "@/types/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const subscribeTokenRefresh = (callback: (token: string | null) => void) => {
  refreshSubscribers.push(callback);
};

const notifyTokenRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

API.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const requestUrl = originalRequest?.url ?? "";

    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh");

    // Login sai username/password cũng trả 401.
    // Không được redirect ở case này, để page login tự hiển thị lỗi.
    if (isAuthRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = authStorage.getRefreshToken();

    if (!refreshToken) {
      authStorage.clear();

      // Dùng replace thay vì window.location.href để tránh hard reload không cần thiết.
      window.location.replace("/");
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            reject(error);
            return;
          }

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(API(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const response = await axios.post<ApiResponse<RefreshResponseData>>(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refreshToken },
      );

      const newAccessToken = response.data.data.accessToken;

      authStorage.setAccessToken(newAccessToken);
      notifyTokenRefreshed(newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return API(originalRequest);
    } catch (refreshError) {
      notifyTokenRefreshed(null);
      authStorage.clear();

      window.location.replace("/");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default API;
