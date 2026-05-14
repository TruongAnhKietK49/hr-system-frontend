import { useMemo, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  Calendar,
  Download,
  Eye,
  Loader2,
  LockKeyhole,
  Phone,
  RefreshCcw,
  Search,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { mapBackendRoleToFrontendRole } from "@/lib/roles";
import { financeKeys, financeService } from "@/services/financeService";
import type { FinancePayrollRecord } from "@/types/finance";

const POSITION_LABELS: Record<number, string> = {
  1: "Nhân viên",
  2: "Trưởng phòng",
  3: "Giám đốc",
};

function toNumber(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return 0;

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function formatVND(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return "—";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getPositionLabel(positionId?: number | null) {
  if (!positionId) return "—";
  return POSITION_LABELS[positionId] ?? `Position #${positionId}`;
}

function getLatestUpdatedAt(rows: FinancePayrollRecord[]) {
  const latestTime = rows.reduce<number | null>((latest, row) => {
    const rawDate = row.SalaryUpdatedAt ?? row.SalaryCalculatedAt;
    if (!rawDate) return latest;

    const time = new Date(rawDate).getTime();
    if (Number.isNaN(time)) return latest;

    return latest === null || time > latest ? time : latest;
  }, null);

  if (!latestTime) return "—";

  return formatDate(new Date(latestTime).toISOString());
}

function canSeeFullFinanceProfile({
  record,
  currentUserDepartmentId,
  isDirector,
}: {
  record: FinancePayrollRecord;
  currentUserDepartmentId: string | null;
  isDirector: boolean;
}) {
  if (isDirector) return true;

  if (!currentUserDepartmentId) return false;

  return record.DepartmentID === currentUserDepartmentId;
}

function DetailField({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={
          mono
            ? "font-mono text-sm text-foreground"
            : "text-sm font-medium text-foreground"
        }
      >
        {value || "—"}
      </div>
    </div>
  );
}

export default function Finance() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );

  const currentRole = user ? mapBackendRoleToFrontendRole(user.role) : null;
  const isDirector = currentRole === "director";
  const currentUserDepartmentId = user?.departmentId ?? null;

  const payrollQuery = useQuery({
    queryKey: financeKeys.payroll(),
    queryFn: financeService.getPayroll,
  });

  const payrollDetailQuery = useQuery({
    queryKey: financeKeys.payrollDetail(selectedEmployeeId ?? ""),
    queryFn: () =>
      financeService.getPayrollByEmployeeId(selectedEmployeeId as string),
    enabled: Boolean(selectedEmployeeId),
  });

  const rows = useMemo(() => payrollQuery.data ?? [], [payrollQuery.data]);

  const rowsWithScope = useMemo(() => {
    return rows.map((record) => {
      const canSeeFullProfile = canSeeFullFinanceProfile({
        record,
        currentUserDepartmentId,
        isDirector,
      });

      return {
        record,
        canSeeFullProfile,
      };
    });
  }, [currentUserDepartmentId, isDirector, rows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return rowsWithScope;

    return rowsWithScope.filter(({ record, canSeeFullProfile }) => {
      const searchableValues = [
        record.EmployeeID,
        record.TaxID,
        record.FinalSalary,
        record.Allowance,
      ];

      if (canSeeFullProfile) {
        searchableValues.push(
          record.FullName,
          record.DepartmentID,
          record.DepartmentName,
        );
      }

      return searchableValues
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [query, rowsWithScope]);

  const totalFinalSalary = useMemo(() => {
    return rows.reduce((total, row) => total + toNumber(row.FinalSalary), 0);
  }, [rows]);

  const sameDepartmentCount = useMemo(() => {
    return rowsWithScope.filter((item) => item.canSeeFullProfile).length;
  }, [rowsWithScope]);

  const limitedCount = rows.length - sameDepartmentCount;

  const isLoading = payrollQuery.isLoading;
  const isError = payrollQuery.isError;
  const isEmpty = !isLoading && !isError && filteredRows.length === 0;

  return (
    <div className="min-w-0 space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Tài chính
          </h1>
          <p className="text-sm text-muted-foreground">
            Nhân viên tài vụ xem đầy đủ hồ sơ trong cùng phòng; nhân viên phòng
            khác chỉ hiển thị mã nhân viên, lương, phụ cấp và mã số thuế.
          </p>
        </div>

        <Button variant="outline" disabled={isLoading || rows.length === 0}>
          <Download className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Tổng lương hiển thị
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {isLoading ? "..." : formatVND(totalFinalSalary)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Bản ghi tài chính
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {isLoading ? "..." : rows.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Hồ sơ đầy đủ
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {isLoading ? "..." : sameDepartmentCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Cập nhật gần nhất
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {isLoading ? "..." : getLatestUpdatedAt(rows)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-amber-500/30 bg-amber-500/10">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Phạm vi dữ liệu tài vụ</AlertTitle>
        <AlertDescription>
          Với nhân viên ngoài phòng tài vụ, giao diện chỉ hiển thị các trường
          được phép: mã nhân viên, lương, phụ cấp và mã số thuế. Các thông tin
          định danh khác được ẩn.
        </AlertDescription>
      </Alert>

      <Card className="min-w-0 shadow-sm">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4" />
              Thông tin tài chính nhân viên
            </CardTitle>

            {!isLoading && (
              <p className="mt-1 text-xs text-muted-foreground">
                {limitedCount > 0
                  ? `${limitedCount} bản ghi ngoài phòng đang bị giới hạn thông tin định danh.`
                  : "Tất cả bản ghi đang hiển thị đầy đủ theo quyền hiện tại."}
              </p>
            )}
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm mã NV, họ tên cùng phòng, mã số thuế..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="whitespace-nowrap">Mã NV</TableHead>
                  <TableHead className="whitespace-nowrap">Họ tên</TableHead>
                  <TableHead className="whitespace-nowrap">Phòng ban</TableHead>
                  <TableHead className="whitespace-nowrap">Chức vụ</TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Lương
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Phụ cấp
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Mã số thuế
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Cập nhật</TableHead>
                  <TableHead className="whitespace-nowrap">Phạm vi</TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải dữ liệu tài chính...
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {isError && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-muted-foreground">
                        <p>
                          {getApiErrorMessage(
                            payrollQuery.error,
                            "Không thể tải dữ liệu tài chính.",
                          )}
                        </p>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => payrollQuery.refetch()}
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
                      colSpan={10}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      {query.trim()
                        ? "Không tìm thấy bản ghi tài chính phù hợp."
                        : "Chưa có dữ liệu tài chính."}
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  !isError &&
                  filteredRows.map(({ record, canSeeFullProfile }) => (
                    <TableRow key={record.EmployeeID}>
                      <TableCell className="whitespace-nowrap font-mono font-medium">
                        {record.EmployeeID}
                      </TableCell>

                      <TableCell>
                        {canSeeFullProfile ? (
                          <div className="font-medium text-foreground">
                            {record.FullName ?? "—"}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Ẩn theo quyền
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {canSeeFullProfile
                          ? (record.DepartmentName ?? "—")
                          : "—"}
                      </TableCell>

                      <TableCell>
                        {canSeeFullProfile
                          ? (record.PositionName ??
                            getPositionLabel(record.PositionID))
                          : "—"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {formatVND(record.FinalSalary)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {formatVND(record.Allowance)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {record.TaxID ?? "—"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(record.SalaryUpdatedAt)}
                      </TableCell>

                      <TableCell>
                        {canSeeFullProfile ? (
                          <Badge className="gap-1">
                            <Users className="h-3 w-3" />
                            Cùng phòng
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <LockKeyhole className="h-3 w-3" />
                            Giới hạn
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedEmployeeId(record.EmployeeID)
                          }
                        >
                          <Eye className="h-4 w-4" />
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(selectedEmployeeId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEmployeeId(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết tài chính nhân viên</DialogTitle>
            <DialogDescription>
              Dữ liệu hiển thị theo đúng phạm vi quyền của nhân viên tài vụ.
            </DialogDescription>
          </DialogHeader>

          {payrollDetailQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải chi tiết tài chính...
            </div>
          )}

          {payrollDetailQuery.isError && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
              <p>
                {getApiErrorMessage(
                  payrollDetailQuery.error,
                  "Không thể tải chi tiết tài chính.",
                )}
              </p>

              <Button
                size="sm"
                variant="outline"
                onClick={() => payrollDetailQuery.refetch()}
              >
                <RefreshCcw className="h-4 w-4" />
                Tải lại
              </Button>
            </div>
          )}

          {payrollDetailQuery.data &&
            (() => {
              const detail = payrollDetailQuery.data;

              const canSeeFullProfile = canSeeFullFinanceProfile({
                record: detail,
                currentUserDepartmentId,
                isDirector,
              });

              return (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Mã nhân viên
                      </p>
                      <p className="font-mono text-lg font-semibold text-foreground">
                        {detail.EmployeeID}
                      </p>
                    </div>

                    {canSeeFullProfile ? (
                      <Badge className="w-fit gap-1">
                        <Users className="h-3 w-3" />
                        Cùng phòng - xem đầy đủ
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="w-fit gap-1">
                        <LockKeyhole className="h-3 w-3" />
                        Ngoài phòng - giới hạn
                      </Badge>
                    )}
                  </div>

                  {canSeeFullProfile ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <User className="h-4 w-4" />
                            Thông tin nhân viên
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="grid gap-4 sm:grid-cols-2">
                          <DetailField label="Họ tên" value={detail.FullName} />
                          <DetailField
                            label="Giới tính"
                            value={detail.Gender}
                          />
                          <DetailField
                            label="Ngày sinh"
                            value={formatDate(detail.DateOfBirth)}
                            icon={<Calendar className="h-3.5 w-3.5" />}
                          />
                          <DetailField
                            label="Số điện thoại"
                            value={detail.PhoneNumber}
                            icon={<Phone className="h-3.5 w-3.5" />}
                          />
                          <DetailField
                            label="Phòng ban"
                            value={detail.DepartmentName}
                          />
                          <DetailField
                            label="Mã phòng ban"
                            value={detail.DepartmentID}
                            mono
                          />
                          <DetailField
                            label="Chức vụ"
                            value={
                              detail.PositionName ??
                              getPositionLabel(detail.PositionID)
                            }
                          />
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Banknote className="h-4 w-4" />
                            Thông tin lương
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="grid gap-4 sm:grid-cols-2">
                          <DetailField
                            label="Lương cơ bản"
                            value={formatVND(detail.BaseSalary)}
                          />
                          <DetailField
                            label="Hệ số lương"
                            value={detail.SalaryCoefficient}
                          />
                          <DetailField
                            label="Hệ số chức vụ"
                            value={detail.PositionCoefficient}
                          />
                          <DetailField
                            label="Phụ cấp"
                            value={formatVND(detail.Allowance)}
                          />
                          <DetailField
                            label="Lương thực nhận"
                            value={formatVND(detail.FinalSalary)}
                          />
                          <DetailField
                            label="Mã số thuế"
                            value={detail.TaxID}
                            mono
                          />
                          <DetailField
                            label="Cập nhật"
                            value={formatDate(detail.SalaryUpdatedAt)}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="border-amber-500/30 bg-amber-500/5">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <ShieldAlert className="h-4 w-4" />
                          Thông tin được phép xem
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="grid gap-4 sm:grid-cols-2">
                        <DetailField
                          label="Mã nhân viên"
                          value={detail.EmployeeID}
                          mono
                        />
                        <DetailField
                          label="Lương"
                          value={formatVND(detail.FinalSalary)}
                        />
                        <DetailField
                          label="Phụ cấp"
                          value={formatVND(detail.Allowance)}
                        />
                        <DetailField
                          label="Mã số thuế"
                          value={detail.TaxID}
                          mono
                        />
                        <DetailField
                          label="Cập nhật"
                          value={formatDate(detail.SalaryUpdatedAt)}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {!canSeeFullProfile && (
                    <Alert className="border-amber-500/30 bg-amber-500/10">
                      <ShieldAlert className="h-4 w-4" />
                      <AlertTitle>Dữ liệu ngoài phòng bị giới hạn</AlertTitle>
                      <AlertDescription>
                        Theo phân quyền tài vụ, nhân viên ngoài phòng chỉ được
                        xem mã nhân viên, lương, phụ cấp và mã số thuế.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
