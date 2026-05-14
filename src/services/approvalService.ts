import API from "@/lib/api";
import { ApiResponse } from "@/types/auth";
import {
  ApprovalResult,
  ApproveCreateEmployeePayload,
  PendingApproval,
  RejectApprovalPayload,
} from "@/types/approval";

export const approvalService = {
  async getPending() {
    const response =
      await API.get<ApiResponse<PendingApproval[]>>("/approvals/pending");

    return response.data.data;
  },

  async approve(requestId: number, payload?: ApproveCreateEmployeePayload) {
    const response = await API.post<ApiResponse<ApprovalResult>>(
      `/approvals/${requestId}/approve`,
      payload ?? {},
    );

    return response.data.data;
  },

  async reject(requestId: number, payload: RejectApprovalPayload) {
    const response = await API.post<ApiResponse<ApprovalResult>>(
      `/approvals/${requestId}/reject`,
      payload,
    );

    return response.data.data;
  },
};
