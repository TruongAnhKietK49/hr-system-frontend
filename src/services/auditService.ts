import API from "@/lib/api";
import type { ApiResponse } from "@/types/auth";
import type { AuditLogFilters, AuditLogRecord } from "@/types/audit";

export const auditKeys = {
  all: ["audit-logs"] as const,
  lists: () => [...auditKeys.all, "list"] as const,
  list: (filters: AuditLogFilters) => [...auditKeys.lists(), filters] as const,
};

function removeEmptyParams(filters: AuditLogFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    }),
  );
}

export const auditService = {
  async getLogs(filters: AuditLogFilters = {}) {
    const response = await API.get<ApiResponse<AuditLogRecord[]>>(
      "/audit-logs",
      {
        params: removeEmptyParams(filters),
      },
    );

    return response.data.data;
  },
};
