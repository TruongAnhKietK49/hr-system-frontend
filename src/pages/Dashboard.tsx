import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  ScrollText,
  ShieldCheck,
  TrendingUp,
  UserCircle,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRole } from "@/context/RoleContext";
import { ROLE_LABELS, type Role } from "@/lib/roles";

import { approvalService } from "@/services/approvalService";
import { auditKeys, auditService } from "@/services/auditService";
import {
  departmentKeys,
  departmentService,
} from "@/services/departmentService";
import { employeeKeys, employeeService } from "@/services/employeeService";
import { financeKeys, financeService } from "@/services/financeService";
import { hrRequestService } from "@/services/hrRequestService";
import { salaryKeys, salaryService } from "@/services/salaryService";

import type { AuditLogRecord } from "@/types/audit";
import type { FinancePayrollRecord } from "@/types/finance";
import type { HRRequestResponse } from "@/types/hrRequest";
import type { PendingApproval } from "@/types/approval";
import type { SalaryRecord } from "@/types/salary";

type StatCardConfig = {
  label: string;
  value: string;
  delta: string;
  icon: typeof Users;
  tint: string;
  iconBg: string;
  isLoading?: boolean;
};

const ROLE_DASHBOARD_HINTS: Record<Role, string> = {
  director:
    "Tổng quan vận hành hệ thống: nhân sự, phê duyệt, lương và nhật ký kiểm tra.",
  hrStaff: "Theo dõi nhân viên, phòng ban và các yêu cầu nhân sự do bạn tạo.",
  hrManager: "Giám sát nhân sự, phòng ban, yêu cầu HR và nhật ký kiểm tra.",
  manager:
    "Theo dõi danh sách nhân viên trong phạm vi quản lý và hồ sơ cá nhân.",
  finance: "Theo dõi payroll theo phạm vi quyền của nhân viên tài vụ.",
  employee:
    "Xem thông tin cá nhân và danh sách nhân viên theo phạm vi được cấp.",
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  CREATE_EMPLOYEE: "Tạo nhân viên",
  UPDATE_EMPLOYEE: "Cập nhật nhân viên",
  DELETE_EMPLOYEE: "Xóa nhân viên",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

const statusStyle: Record<string, string> = {
  PENDING:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  APPROVED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  REJECTED: "border-destructive/20 bg-destructive/10 text-destructive",
};

const actionStyle: Record<string, string> = {
  CREATE:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  UPDATE:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  DELETE: "border-destructive/20 bg-destructive/10 text-destructive",
  APPROVE:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  REJECT:
    "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  LOGIN: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function toNumber(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return 0;

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function formatVND(value?: number | string | null) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getActionClass(actionType: string) {
  const matchedKey = Object.keys(actionStyle).find((key) =>
    actionType.includes(key),
  );

  return matchedKey
    ? actionStyle[matchedKey]
    : "border-border bg-muted text-muted-foreground";
}

function getRequestTypeLabel(type: string) {
  return REQUEST_TYPE_LABELS[type] ?? type;
}

function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function getRequestTarget(request: HRRequestResponse | PendingApproval) {
  if (!request.RequestPayload) return "—";

  try {
    const payload = JSON.parse(request.RequestPayload);

    return (
      payload.fullName ||
      payload.employeeId ||
      payload.EmployeeID ||
      payload.EmployeeId ||
      "—"
    );
  } catch {
    return "—";
  }
}

function getLatestPayrollUpdatedAt(
  rows: Array<SalaryRecord | FinancePayrollRecord>,
) {
  const latestTime = rows.reduce<number | null>((latest, row) => {
    const rawDate = row.SalaryUpdatedAt ?? row.SalaryCalculatedAt;

    if (!rawDate) return latest;

    const time = new Date(rawDate).getTime();

    if (Number.isNaN(time)) return latest;

    return latest === null || time > latest ? time : latest;
  }, null);

  if (!latestTime) return "—";

  return formatDateTime(new Date(latestTime).toISOString());
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tint,
  iconBg,
  isLoading,
}: StatCardConfig) {
  return (
    <Card
      className={`relative overflow-hidden rounded-2xl border-border bg-gradient-to-br ${tint}`}
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>

            <p className="mt-2 text-3xl font-bold text-foreground">
              {isLoading ? "..." : value}
            </p>

            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ArrowUpRight className="h-3 w-3" />
              )}
              {delta}
            </p>
          </div>

          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="px-6 py-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default function Dashboard() {
  const { role, username } = useRole();

  const canReadEmployees = role !== "finance";
  const canReadDepartments =
    role === "director" || role === "hrStaff" || role === "hrManager";
  const canReadPendingApprovals = role === "director";
  const canReadHrRequests = role === "hrStaff" || role === "hrManager";
  const canReadSalary = role === "director";
  const canReadFinance = role === "director" || role === "finance";
  const canReadAudit = role === "director" || role === "hrManager";

  const employeesQuery = useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: employeeService.getAll,
    enabled: canReadEmployees,
  });

  const departmentsQuery = useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: departmentService.getAll,
    enabled: canReadDepartments,
  });

  const approvalsQuery = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: approvalService.getPending,
    enabled: canReadPendingApprovals,
  });

  const hrRequestsQuery = useQuery({
    queryKey: ["hr-requests"],
    queryFn: hrRequestService.getAll,
    enabled: canReadHrRequests,
  });

  const salariesQuery = useQuery({
    queryKey: salaryKeys.lists(),
    queryFn: salaryService.getAll,
    enabled: canReadSalary,
  });

  const financeQuery = useQuery({
    queryKey: financeKeys.payroll(),
    queryFn: financeService.getPayroll,
    enabled: canReadFinance && !canReadSalary,
  });

  const auditQuery = useQuery({
    queryKey: auditKeys.list({ page: 1, limit: 5 }),
    queryFn: () => auditService.getLogs({ page: 1, limit: 5 }),
    enabled: canReadAudit,
  });

  const employees = useMemo(
    () => employeesQuery.data ?? [],
    [employeesQuery.data],
  );

  const departments = useMemo(
    () => departmentsQuery.data ?? [],
    [departmentsQuery.data],
  );

  const pendingApprovals = useMemo(
    () => approvalsQuery.data ?? [],
    [approvalsQuery.data],
  );

  const hrRequests = useMemo(
    () => hrRequestsQuery.data ?? [],
    [hrRequestsQuery.data],
  );

  const salaryRows = useMemo(
    () => salariesQuery.data ?? [],
    [salariesQuery.data],
  );

  const financeRows = useMemo(
    () => financeQuery.data ?? [],
    [financeQuery.data],
  );

  const auditLogs = useMemo(() => auditQuery.data ?? [], [auditQuery.data]);

  const activeEmployees = useMemo(() => {
    return employees.filter((employee) => employee.IsActive).length;
  }, [employees]);

  const pendingHrRequests = useMemo(() => {
    return hrRequests.filter((request) => request.Status === "PENDING");
  }, [hrRequests]);

  const payrollRows = canReadSalary ? salaryRows : financeRows;

  const totalPayroll = useMemo(() => {
    return payrollRows.reduce(
      (total, row) => total + toNumber(row.FinalSalary),
      0,
    );
  }, [payrollRows]);

  const statCards = useMemo<StatCardConfig[]>(() => {
    const cards: StatCardConfig[] = [];

    if (canReadEmployees) {
      cards.push({
        label: "Nhân viên đang hiển thị",
        value: formatNumber(employees.length),
        delta: `${formatNumber(activeEmployees)} đang hoạt động`,
        icon: Users,
        tint: "from-blue-500/15 to-blue-500/5",
        iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
        isLoading: employeesQuery.isLoading,
      });
    }

    if (canReadDepartments) {
      cards.push({
        label: "Phòng ban",
        value: formatNumber(departments.length),
        delta: "Dữ liệu từ API phòng ban",
        icon: Building2,
        tint: "from-emerald-500/15 to-emerald-500/5",
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        isLoading: departmentsQuery.isLoading,
      });
    }

    if (canReadPendingApprovals) {
      cards.push({
        label: "Yêu cầu chờ duyệt",
        value: formatNumber(pendingApprovals.length),
        delta: "Cần Director xử lý",
        icon: FileText,
        tint: "from-amber-500/15 to-amber-500/5",
        iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
        isLoading: approvalsQuery.isLoading,
      });
    }

    if (canReadHrRequests) {
      cards.push({
        label: "Yêu cầu HR",
        value: formatNumber(hrRequests.length),
        delta: `${formatNumber(pendingHrRequests.length)} đang chờ duyệt`,
        icon: FileText,
        tint: "from-amber-500/15 to-amber-500/5",
        iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
        isLoading: hrRequestsQuery.isLoading,
      });
    }

    if (canReadSalary || canReadFinance) {
      cards.push({
        label: canReadSalary ? "Tổng quỹ lương" : "Payroll hiển thị",
        value: formatVND(totalPayroll),
        delta: `Cập nhật gần nhất: ${getLatestPayrollUpdatedAt(payrollRows)}`,
        icon: Banknote,
        tint: "from-violet-500/15 to-violet-500/5",
        iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
        isLoading: salariesQuery.isLoading || financeQuery.isLoading,
      });
    }

    if (canReadAudit) {
      cards.push({
        label: "Nhật ký gần đây",
        value: formatNumber(auditLogs.length),
        delta: "5 log mới nhất theo quyền",
        icon: ScrollText,
        tint: "from-slate-500/15 to-slate-500/5",
        iconBg: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
        isLoading: auditQuery.isLoading,
      });
    }

    if (cards.length === 0) {
      cards.push({
        label: "Hồ sơ cá nhân",
        value: "1",
        delta: "Truy cập hồ sơ của bạn",
        icon: UserCircle,
        tint: "from-primary/15 to-primary/5",
        iconBg: "bg-primary/10 text-primary",
      });
    }

    return cards;
  }, [
    activeEmployees,
    auditLogs.length,
    auditQuery.isLoading,
    approvalsQuery.isLoading,
    canReadAudit,
    canReadDepartments,
    canReadEmployees,
    canReadFinance,
    canReadHrRequests,
    canReadPendingApprovals,
    canReadSalary,
    departments.length,
    departmentsQuery.isLoading,
    employees.length,
    employeesQuery.isLoading,
    financeQuery.isLoading,
    hrRequests.length,
    hrRequestsQuery.isLoading,
    payrollRows,
    pendingApprovals.length,
    pendingHrRequests.length,
    salariesQuery.isLoading,
    totalPayroll,
  ]);

  const mainRequestList: Array<HRRequestResponse | PendingApproval> =
    canReadPendingApprovals ? pendingApprovals : hrRequests;

  const requestListLoading = canReadPendingApprovals
    ? approvalsQuery.isLoading
    : hrRequestsQuery.isLoading;

  const requestListTitle = canReadPendingApprovals
    ? "Yêu cầu chờ phê duyệt"
    : "Yêu cầu nhân sự gần đây";

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Xin chào, {username} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Bạn đang đăng nhập với vai trò{" "}
            <span className="font-medium text-foreground">
              {ROLE_LABELS[role]}
            </span>
            .
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ROLE_DASHBOARD_HINTS[role]}
          </p>
        </div>

        <Badge variant="outline" className="w-fit gap-1.5">
          <TrendingUp className="h-3 w-3" />
          Dashboard dữ liệu thật
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(canReadPendingApprovals || canReadHrRequests) && (
          <Card
            className="rounded-2xl border-border lg:col-span-2"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">{requestListTitle}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dữ liệu lấy trực tiếp từ API request/phê duyệt.
                </p>
              </div>

              <Badge variant="secondary">
                {requestListLoading ? "..." : mainRequestList.length} yêu cầu
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {requestListLoading ? (
                <div className="flex items-center justify-center gap-2 px-6 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải yêu cầu...
                </div>
              ) : mainRequestList.length === 0 ? (
                <EmptyCard message="Không có yêu cầu nào cần hiển thị." />
              ) : (
                <div className="divide-y divide-border">
                  {mainRequestList.slice(0, 5).map((request) => (
                    <div
                      key={request.RequestID}
                      className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{request.RequestID}
                          </span>
                          <span className="truncate text-sm font-medium">
                            {getRequestTypeLabel(request.RequestType)}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          Người tạo: {request.RequesterID} · Đối tượng:{" "}
                          {getRequestTarget(request)}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={
                          statusStyle[request.Status] ??
                          "border-border bg-muted text-muted-foreground"
                        }
                      >
                        {getStatusLabel(request.Status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {canReadAudit && (
          <Card
            className="rounded-2xl border-border"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nhật ký gần đây</CardTitle>
              <p className="text-xs text-muted-foreground">
                Hoạt động kiểm tra hệ thống.
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              {auditQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải log...
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có nhật ký kiểm tra.
                </p>
              ) : (
                auditLogs.slice(0, 5).map((log: AuditLogRecord) => (
                  <div key={log.LogID} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm leading-snug">
                        {log.ActionType} · {log.TableName}
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={getActionClass(log.ActionType)}
                        >
                          {log.ActionType}
                        </Badge>

                        <span className="text-[11px] text-muted-foreground">
                          {formatDateTime(log.Timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {!canReadAudit && (
          <Card
            className="rounded-2xl border-border"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Trạng thái quyền truy cập
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Dashboard chỉ gọi API phù hợp với role hiện tại.
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    Phân quyền đang hoạt động
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Các API nhạy cảm như salary, audit, approvals chỉ được gọi
                    khi role có quyền.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Không còn dữ liệu mock</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Các chỉ số trên dashboard được tổng hợp từ service/API đã
                    nối ở các phần trước.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(canReadSalary || canReadFinance) && (
          <Card
            className="rounded-2xl border-border lg:col-span-2"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="h-4 w-4" />
                Tổng quan payroll
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {canReadSalary
                  ? "Director xem dữ liệu từ API /salaries."
                  : "Finance Staff xem dữ liệu từ API /finance/payroll."}
              </p>
            </CardHeader>

            <CardContent>
              {salariesQuery.isLoading || financeQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải payroll...
                </div>
              ) : payrollRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có dữ liệu payroll.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Số bản ghi
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatNumber(payrollRows.length)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Tổng lương
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatVND(totalPayroll)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-xs uppercase text-muted-foreground">
                      Cập nhật
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {getLatestPayrollUpdatedAt(payrollRows)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card
          className="rounded-2xl border-border"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="h-4 w-4" />
              Ghi chú vận hành
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Dashboard hiện tổng hợp từ nhiều API riêng, chưa cần endpoint
                dashboard chuyên dụng.
              </p>
            </div>

            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Query được bật/tắt theo role để tránh gọi nhầm API và phát sinh
                lỗi 403 không cần thiết.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
