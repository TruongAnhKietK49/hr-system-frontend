import { AxiosError } from "axios";
import { ApiResponse } from "@/types/auth";

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  const axiosError = error as AxiosError<ApiResponse<unknown>>;

  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return fallbackMessage;
}
