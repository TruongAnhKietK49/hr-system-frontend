import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Eye,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  ScrollText,
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

function getShortDetail(log: AuditLogRecord) {
  const target = log.RecordID ? `#${log.RecordID}` : "";
  return `${log.ActionType} ${log.TableName} ${target}`.trim();
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
    limit: 20,
  };
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

  const stats = useMemo(() => {
    return {
      total: logs.length,
      updates: logs.filter((log) => log.ActionType.includes("UPDATE")).length,
      approvals: logs.filter((log) => log.ActionType.includes("APPROVE"))
        .length,
    };
  }, [logs]);

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
  const canGoNext = logs.length === 20;

  return (
    <div className="min-w-0 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Nhật ký kiểm tra
        </h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi thao tác quan trọng để phục vụ giám sát, truy vết và kiểm
          toán hệ thống.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <p className="text-xs uppercase text-muted-foreground">Quyền xem</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-foreground">
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
                        {getShortDetail(log)}
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
