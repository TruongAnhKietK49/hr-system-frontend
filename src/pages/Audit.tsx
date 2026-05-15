import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  Eye,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { auditKeys, auditService } from "@/services/auditService";
import type { AuditLogFilters, AuditLogRecord } from "@/types/audit";

const ALL = "all";
const PAGE_LIMIT = 20;

const ACTOR_ROLE_OPTIONS = [
  "Director",
  "HR Manager",
  "HR Staff",
  "Finance Staff",
  "Employee",
  "Manager",
];

const ACTION_TYPE_OPTIONS = [
  "LOGIN_SUCCESS",
  "CREATE_HR_REQUEST",
  "APPROVE_HR_REQUEST",
  "REJECT_HR_REQUEST",
  "UPDATE_SALARY",
  "CREATE_DEPARTMENT",
  "UPDATE_DEPARTMENT",
  "DELETE_DEPARTMENT",
  "CREATE_EMPLOYEE",
  "UPDATE_EMPLOYEE",
  "DELETE_EMPLOYEE",
];

const TABLE_NAME_OPTIONS = [
  "Account",
  "HR_Request",
  "Approval",
  "Employee",
  "Department",
  "EmployeeSalaryConfig",
  "EmployeeSalaryResult",
];

type AuditAlertSeverity = "low" | "medium" | "high" | "critical";

type AuditAlert = {
  id: string;
  title: string;
  description: string;
  severity: AuditAlertSeverity;
  actorId?: string | null;
  actionType?: string | null;
  tableName?: string | null;
  count?: number;
};

const SENSITIVE_TABLES = ["EmployeeSalaryConfig", "EmployeeSalaryResult"];

const HIGH_RISK_ACTIONS = [
  "DELETE_EMPLOYEE",
  "UPDATE_SALARY",
  "DELETE_DEPARTMENT",
];

const NORMAL_BUSINESS_ACTIONS = [
  "LOGIN_SUCCESS",
  "CREATE_HR_REQUEST",
  "APPROVE_HR_REQUEST",
  "REJECT_HR_REQUEST",
  "UPDATE_EMPLOYEE",
];

function getActionClass(actionType: string) {
  if (actionType.includes("LOGIN")) {
    return "border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10 dark:text-blue-300";
  }

  if (actionType.includes("CREATE") || actionType.includes("INSERT")) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300";
  }

  if (actionType.includes("UPDATE")) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300";
  }

  if (actionType.includes("DELETE")) {
    return "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/10";
  }

  if (actionType.includes("APPROVE")) {
    return "border-violet-500/20 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300";
  }

  if (actionType.includes("REJECT")) {
    return "border-slate-500/20 bg-slate-500/10 text-slate-700 hover:bg-slate-500/10 dark:text-slate-300";
  }

  return "border-border bg-muted text-muted-foreground";
}

function getSeverityScore(severity: AuditAlertSeverity) {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function getSeverityLabel(severity: AuditAlertSeverity) {
  switch (severity) {
    case "critical":
      return "Nghiêm trọng";
    case "high":
      return "Cao";
    case "medium":
      return "Trung bình";
    case "low":
      return "Thấp";
    default:
      return "Không xác định";
  }
}

function getSeverityClassName(severity: AuditAlertSeverity) {
  switch (severity) {
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
    case "high":
      return "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "low":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
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

function parseJsonText(value?: string | null) {
  if (!value) return "—";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function getReadableAuditSummary(log: AuditLogRecord) {
  const recordId = log.RecordID ? `#${log.RecordID}` : "";

  switch (log.ActionType) {
    case "LOGIN_SUCCESS":
      return `Đăng nhập thành công vào hệ thống`;
    case "CREATE_HR_REQUEST":
      return `Tạo yêu cầu nhân sự ${recordId}`;
    case "APPROVE_HR_REQUEST":
      return `Phê duyệt yêu cầu nhân sự ${recordId}`;
    case "REJECT_HR_REQUEST":
      return `Từ chối yêu cầu nhân sự ${recordId}`;
    case "CREATE_EMPLOYEE":
      return `Tạo hồ sơ nhân viên ${recordId}`;
    case "UPDATE_EMPLOYEE":
      return `Cập nhật hồ sơ nhân viên ${recordId}`;
    case "DELETE_EMPLOYEE":
      return `Thao tác xóa nhân viên ${recordId}`;
    case "UPDATE_SALARY":
      return `Cập nhật thông tin lương ${recordId}`;
    case "CREATE_DEPARTMENT":
      return `Tạo phòng ban ${recordId}`;
    case "UPDATE_DEPARTMENT":
      return `Cập nhật phòng ban ${recordId}`;
    case "DELETE_DEPARTMENT":
      return `Xóa phòng ban ${recordId}`;
    default:
      return `${log.ActionType} trên bảng ${log.TableName} ${recordId}`.trim();
  }
}

function buildFilters({
  actorRole,
  actionType,
  tableName,
  page,
}: {
  actorRole: string;
  actionType: string;
  tableName: string;
  page: number;
}): AuditLogFilters {
  return {
    actorRole: actorRole === ALL ? undefined : actorRole,
    actionType: actionType === ALL ? undefined : actionType,
    tableName: tableName === ALL ? undefined : tableName,
    page,
    limit: PAGE_LIMIT,
  };
}

function isRecentLog(log: AuditLogRecord, minutes: number) {
  if (!log.Timestamp) return false;

  const time = new Date(log.Timestamp).getTime();
  if (Number.isNaN(time)) return false;

  return Date.now() - time <= minutes * 60 * 1000;
}

function createAlertId(parts: Array<string | number | null | undefined>) {
  return parts.filter(Boolean).join("-");
}

function deduplicateAlerts(alerts: AuditAlert[]) {
  const map = new Map<string, AuditAlert>();

  alerts.forEach((alert) => {
    if (!map.has(alert.id)) {
      map.set(alert.id, alert);
    }
  });

  return Array.from(map.values());
}

function analyzeAuditAlerts(logs: AuditLogRecord[]) {
  const alerts: AuditAlert[] = [];
  const recentLogs = logs.filter((log) => isRecentLog(log, 30));

  const logsByActor = recentLogs.reduce<Record<string, AuditLogRecord[]>>(
    (result, log) => {
      const actorId = log.ActorID ?? "SYSTEM_OR_UNKNOWN";

      if (!result[actorId]) {
        result[actorId] = [];
      }

      result[actorId].push(log);

      return result;
    },
    {},
  );

  Object.entries(logsByActor).forEach(([actorId, actorLogs]) => {
    if (actorId === "SYSTEM_OR_UNKNOWN" && actorLogs.length > 0) {
      alerts.push({
        id: createAlertId(["unknown-actor", actorLogs.length]),
        title: "Log thiếu người thực hiện",
        description:
          "Một số bản ghi nhật ký không xác định được người thực hiện. Cần kiểm tra lại nguồn ghi log hoặc phiên đăng nhập.",
        severity: "critical",
        actorId: null,
        count: actorLogs.length,
      });

      return;
    }

    if (actorLogs.length >= 10) {
      alerts.push({
        id: createAlertId(["high-frequency", actorId]),
        title: "Tần suất thao tác bất thường",
        description: `Người dùng ${actorId} thực hiện ${actorLogs.length} thao tác trong 30 phút gần nhất.`,
        severity: "high",
        actorId,
        count: actorLogs.length,
      });
    }

    const updateEmployeeLogs = actorLogs.filter(
      (log) => log.ActionType === "UPDATE_EMPLOYEE",
    );

    if (updateEmployeeLogs.length >= 5) {
      alerts.push({
        id: createAlertId(["mass-update-employee", actorId]),
        title: "Cập nhật hồ sơ nhân viên hàng loạt",
        description: `Người dùng ${actorId} cập nhật ${updateEmployeeLogs.length} hồ sơ nhân viên trong thời gian ngắn.`,
        severity: "medium",
        actorId,
        actionType: "UPDATE_EMPLOYEE",
        tableName: "Employee",
        count: updateEmployeeLogs.length,
      });
    }

    const createRequestLogs = actorLogs.filter(
      (log) => log.ActionType === "CREATE_HR_REQUEST",
    );

    if (createRequestLogs.length >= 5) {
      alerts.push({
        id: createAlertId(["many-hr-request", actorId]),
        title: "Tạo nhiều yêu cầu nhân sự",
        description: `Người dùng ${actorId} tạo ${createRequestLogs.length} yêu cầu nhân sự trong thời gian ngắn.`,
        severity: "medium",
        actorId,
        actionType: "CREATE_HR_REQUEST",
        tableName: "HR_Request",
        count: createRequestLogs.length,
      });
    }
  });

  recentLogs.forEach((log) => {
    const recordId = log.RecordID ?? "unknown-record";

    if (!log.ActionType || !log.TableName) {
      alerts.push({
        id: createAlertId([
          "invalid-log",
          log.LogID,
          log.ActorID,
          log.ActionType,
          log.TableName,
        ]),
        title: "Log có cấu trúc bất thường",
        description:
          "Một bản ghi nhật ký thiếu hành động hoặc tên bảng. Đây có thể là lỗi hệ thống hoặc thao tác không hợp lệ.",
        severity: "critical",
        actorId: log.ActorID,
        actionType: log.ActionType,
        tableName: log.TableName,
      });

      return;
    }

    if (log.ActionType === "DELETE_EMPLOYEE") {
      alerts.push({
        id: createAlertId(["delete-employee", log.ActorID, recordId]),
        title: "Thao tác xóa nhân viên",
        description: `Người dùng ${log.ActorID ?? "không xác định"} thực hiện thao tác xóa nhân viên ${log.RecordID ?? ""}. Cần kiểm tra yêu cầu phê duyệt liên quan.`,
        severity: "high",
        actorId: log.ActorID,
        actionType: log.ActionType,
        tableName: log.TableName,
      });
    }

    if (HIGH_RISK_ACTIONS.includes(log.ActionType)) {
      alerts.push({
        id: createAlertId([
          "high-risk-action",
          log.ActorID,
          log.ActionType,
          recordId,
        ]),
        title: "Thao tác có rủi ro cao",
        description: `Phát hiện thao tác ${log.ActionType} trên bảng ${log.TableName}.`,
        severity: log.ActionType.includes("DELETE") ? "high" : "medium",
        actorId: log.ActorID,
        actionType: log.ActionType,
        tableName: log.TableName,
      });
    }

    const isNormalBusinessAction = NORMAL_BUSINESS_ACTIONS.includes(
      log.ActionType,
    );

    if (SENSITIVE_TABLES.includes(log.TableName) && !isNormalBusinessAction) {
      alerts.push({
        id: createAlertId([
          "sensitive-table",
          log.ActorID,
          log.TableName,
          log.ActionType,
          recordId,
        ]),
        title: "Thao tác trên dữ liệu nhạy cảm",
        description: `Người dùng ${log.ActorID ?? "không xác định"} thao tác trên bảng ${log.TableName}.`,
        severity: "high",
        actorId: log.ActorID,
        actionType: log.ActionType,
        tableName: log.TableName,
      });
    }
  });

  return deduplicateAlerts(alerts).sort(
    (a, b) => getSeverityScore(b.severity) - getSeverityScore(a.severity),
  );
}

export default function Audit() {
  const [query, setQuery] = useState("");
  const [actorRole, setActorRole] = useState(ALL);
  const [actionType, setActionType] = useState(ALL);
  const [tableName, setTableName] = useState(ALL);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const filters = useMemo(
    () =>
      buildFilters({
        actorRole,
        actionType,
        tableName,
        page,
      }),
    [actorRole, actionType, tableName, page],
  );

  const auditQuery = useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => auditService.getLogs(filters),
  });

  const logs = useMemo(() => auditQuery.data ?? [], [auditQuery.data]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return logs;

    return logs.filter((log) => {
      return [
        log.LogID,
        log.ActorID,
        log.ActorRole,
        log.ActionType,
        log.TableName,
        log.RecordID,
        log.OldValues,
        log.NewValues,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [logs, query]);

  const auditAlerts = useMemo(() => analyzeAuditAlerts(logs), [logs]);

  const stats = useMemo(() => {
    const criticalAlerts = auditAlerts.filter(
      (alert) => alert.severity === "critical",
    ).length;

    const highAlerts = auditAlerts.filter(
      (alert) => alert.severity === "high",
    ).length;

    return {
      total: logs.length,
      updates: logs.filter((log) => log.ActionType.includes("UPDATE")).length,
      criticalAlerts,
      highAlerts,
    };
  }, [auditAlerts, logs]);

  const resetFilters = () => {
    setQuery("");
    setActorRole(ALL);
    setActionType(ALL);
    setTableName(ALL);
    setPage(1);
  };

  const handleActorRoleChange = (value: string) => {
    setActorRole(value);
    setPage(1);
  };

  const handleActionTypeChange = (value: string) => {
    setActionType(value);
    setPage(1);
  };

  const handleTableNameChange = (value: string) => {
    setTableName(value);
    setPage(1);
  };

  const isFiltering =
    Boolean(query.trim()) ||
    actorRole !== ALL ||
    actionType !== ALL ||
    tableName !== ALL;

  const isLoading = auditQuery.isLoading;
  const isError = auditQuery.isError;
  const isEmpty = !isLoading && !isError && filteredLogs.length === 0;
  const canGoNext = logs.length === PAGE_LIMIT;

  return (
    <div className="min-w-0 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Nhật ký kiểm tra
        </h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi thao tác quan trọng, phát hiện dấu hiệu bất thường và phục vụ
          truy vết hệ thống.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Log đang hiển thị
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {isLoading ? "..." : stats.total}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Thao tác cập nhật
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {isLoading ? "..." : stats.updates}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Cảnh báo mức cao
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {isLoading ? "..." : stats.highAlerts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Quyền giám sát
            </p>
            <p className="mt-2 flex items-center gap-2 text-xl font-bold text-foreground">
              <ShieldCheck className="h-5 w-5" />
              Director / HR Manager
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm LogID, ActorID, RecordID, nội dung JSON..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <Select value={actorRole} onValueChange={handleActorRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả vai trò</SelectItem>
                {ACTOR_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-3">
            <Select value={actionType} onValueChange={handleActionTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả hành động</SelectItem>
                {ACTION_TYPE_OPTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select value={tableName} onValueChange={handleTableNameChange}>
              <SelectTrigger>
                <SelectValue placeholder="Bảng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả bảng</SelectItem>
                {TABLE_NAME_OPTIONS.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-1">
            <Button
              variant="outline"
              className="w-full"
              disabled={!isFiltering}
              onClick={resetFilters}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Cảnh báo an toàn hệ thống
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Cảnh báo được phân tích từ nhật ký trong 30 phút gần nhất theo các
              rule rủi ro.
            </p>
          </div>

          <Badge variant="outline">{auditAlerts.length} cảnh báo</Badge>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang phân tích nhật ký...
            </div>
          ) : auditAlerts.length === 0 ? (
            <div className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Chưa phát hiện bất thường</p>
                <p className="mt-1 opacity-90">
                  Nhật ký gần đây chưa ghi nhận thao tác rủi ro hoặc tần suất xử
                  lý bất thường.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {auditAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 ${getSeverityClassName(
                    alert.severity,
                  )}`}
                >
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{alert.title}</p>
                        <Badge variant="outline">
                          {getSeverityLabel(alert.severity)}
                        </Badge>
                      </div>

                      <p className="mt-1 text-sm opacity-90">
                        {alert.description}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs opacity-80">
                        {alert.actorId && <span>Actor: {alert.actorId}</span>}
                        {alert.actionType && (
                          <span>Action: {alert.actionType}</span>
                        )}
                        {alert.tableName && (
                          <span>Bảng: {alert.tableName}</span>
                        )}
                        {alert.count && <span>Số lần: {alert.count}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {auditAlerts.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  Còn {auditAlerts.length - 5} cảnh báo khác. Hãy lọc nhật ký
                  theo người thực hiện, hành động hoặc bảng để kiểm tra chi
                  tiết.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden shadow-sm">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-4 w-4" />
            Danh sách log
          </CardTitle>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Trang {page}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="whitespace-nowrap">Log ID</TableHead>
                  <TableHead className="whitespace-nowrap">
                    Người thực hiện
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Vai trò</TableHead>
                  <TableHead className="whitespace-nowrap">Hành động</TableHead>
                  <TableHead className="whitespace-nowrap">Bảng</TableHead>
                  <TableHead className="whitespace-nowrap">Record ID</TableHead>
                  <TableHead className="whitespace-nowrap">Thời gian</TableHead>
                  <TableHead className="whitespace-nowrap">Tóm tắt</TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Chi tiết
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải nhật ký kiểm tra...
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {isError && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-muted-foreground">
                        <p>
                          {getApiErrorMessage(
                            auditQuery.error,
                            "Không thể tải nhật ký kiểm tra.",
                          )}
                        </p>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => auditQuery.refetch()}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Tải lại
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {isEmpty && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      {isFiltering
                        ? "Không tìm thấy log phù hợp."
                        : "Chưa có nhật ký kiểm tra."}
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  !isError &&
                  filteredLogs.map((log) => (
                    <TableRow key={log.LogID}>
                      <TableCell className="whitespace-nowrap font-mono font-medium">
                        #{log.LogID}
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {log.ActorID ?? "System"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {log.ActorRole ?? "—"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getActionClass(log.ActionType)}
                        >
                          {log.ActionType}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {log.TableName}
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {log.RecordID ?? "—"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(log.Timestamp)}
                      </TableCell>

                      <TableCell className="min-w-64 max-w-md truncate">
                        {getReadableAuditSummary(log)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Hiển thị {filteredLogs.length} log trên trang hiện tại
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || auditQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Trước
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext || auditQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chi tiết nhật ký kiểm tra</DialogTitle>
            <DialogDescription>
              Dữ liệu old/new values được ghi lại để phục vụ truy vết thay đổi.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Log ID
                  </p>
                  <p className="font-mono font-semibold">
                    #{selectedLog.LogID}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Actor
                  </p>
                  <p className="font-mono font-semibold">
                    {selectedLog.ActorID ?? "System"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Table
                  </p>
                  <p className="font-mono font-semibold">
                    {selectedLog.TableName}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Record
                  </p>
                  <p className="font-mono font-semibold">
                    {selectedLog.RecordID ?? "—"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Old Values</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                      {parseJsonText(selectedLog.OldValues)}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">New Values</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                      {parseJsonText(selectedLog.NewValues)}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
