import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  History,
  Loader2,
  Pencil,
  RefreshCcw,
  Search,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRole } from "@/context/RoleContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { salaryKeys, salaryService } from "@/services/salaryService";
import type { SalaryRecord, UpdateSalaryPayload } from "@/types/salary";

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
  const numericValue = toNumber(value);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDecimal(value?: number | string | null) {
  const numericValue = toNumber(value);

  if (!numericValue) return "—";

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(numericValue);
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

function getLatestUpdatedAt(rows: SalaryRecord[]) {
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

type SalaryFormState = {
  baseSalary: string;
  salaryCoefficient: string;
  positionCoefficient: string;
  allowance: string;
  formulaVersion: string;
};

const DEFAULT_FORM_STATE: SalaryFormState = {
  baseSalary: "",
  salaryCoefficient: "1",
  positionCoefficient: "1",
  allowance: "0",
  formulaVersion: "v1",
};

function toFormState(record?: SalaryRecord | null): SalaryFormState {
  if (!record) return DEFAULT_FORM_STATE;

  return {
    baseSalary: String(toNumber(record.BaseSalary)),
    salaryCoefficient: String(toNumber(record.SalaryCoefficient) || 1),
    positionCoefficient: String(toNumber(record.PositionCoefficient) || 1),
    allowance: String(toNumber(record.Allowance)),
    formulaVersion: record.FormulaVersion || "v1",
  };
}

function toUpdatePayload(form: SalaryFormState): UpdateSalaryPayload | null {
  const baseSalary = Number(form.baseSalary);
  const salaryCoefficient = Number(form.salaryCoefficient);
  const positionCoefficient = Number(form.positionCoefficient);
  const allowance = Number(form.allowance);

  if (
    Number.isNaN(baseSalary) ||
    Number.isNaN(salaryCoefficient) ||
    Number.isNaN(positionCoefficient) ||
    Number.isNaN(allowance)
  ) {
    return null;
  }

  if (baseSalary <= 0 || salaryCoefficient <= 0 || positionCoefficient <= 0) {
    return null;
  }

  if (allowance < 0) {
    return null;
  }

  return {
    baseSalary,
    salaryCoefficient,
    positionCoefficient,
    allowance,
    formulaVersion: form.formulaVersion.trim() || "v1",
  };
}

export default function Salary() {
  const queryClient = useQueryClient();
  const { role } = useRole();

  const canUpdateSalary = role === "director";

  const [query, setQuery] = useState("");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<SalaryFormState>(DEFAULT_FORM_STATE);

  const salariesQuery = useQuery({
    queryKey: salaryKeys.lists(),
    queryFn: salaryService.getAll,
  });

  const rows = useMemo(() => salariesQuery.data ?? [], [salariesQuery.data]);

  const editingRow = useMemo(() => {
    if (!editingEmployeeId) return null;

    return rows.find((row) => row.EmployeeID === editingEmployeeId) ?? null;
  }, [editingEmployeeId, rows]);

  const salaryDetailQuery = useQuery({
    queryKey: salaryKeys.detail(editingEmployeeId ?? ""),
    queryFn: () => salaryService.getByEmployeeId(editingEmployeeId as string),
    enabled: Boolean(editingEmployeeId),
  });

  useEffect(() => {
    if (salaryDetailQuery.data) {
      setForm(toFormState(salaryDetailQuery.data));
      return;
    }

    if (editingRow) {
      setForm(toFormState(editingRow));
    }
  }, [editingRow, salaryDetailQuery.data]);

  const updateSalaryMutation = useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string;
      payload: UpdateSalaryPayload;
    }) => salaryService.update(employeeId, payload),

    onSuccess: async () => {
      toast.success("Cập nhật lương thành công");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salaryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["employees"] }),
      ]);

      setEditingEmployeeId(null);
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật lương."));
    },
  });

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return rows;

    return rows.filter((row) => {
      return [row.EmployeeID, row.FullName, row.DepartmentName, row.TaxID]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [query, rows]);

  const totalPayroll = useMemo(() => {
    return rows.reduce((total, row) => total + toNumber(row.FinalSalary), 0);
  }, [rows]);

  const openEdit = (row: SalaryRecord) => {
    if (!canUpdateSalary) {
      toast.error("Chỉ Giám đốc được phép cập nhật lương.");
      return;
    }

    setEditingEmployeeId(row.EmployeeID);
    setForm(toFormState(row));
  };

  const closeEdit = () => {
    if (updateSalaryMutation.isPending) return;

    setEditingEmployeeId(null);
    setForm(DEFAULT_FORM_STATE);
  };

  const submitUpdate = () => {
    if (!editingEmployeeId) return;

    const payload = toUpdatePayload(form);

    if (!payload) {
      toast.error(
        "Vui lòng nhập lương, hệ số lương, hệ số chức vụ lớn hơn 0 và phụ cấp không âm.",
      );
      return;
    }

    updateSalaryMutation.mutate({
      employeeId: editingEmployeeId,
      payload,
    });
  };

  const updateFormField = (field: keyof SalaryFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const isLoading = salariesQuery.isLoading;
  const isError = salariesQuery.isError;
  const isEmpty = !isLoading && !isError && filteredRows.length === 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Quản lý lương và phụ cấp
          </h1>
          <p className="text-sm text-muted-foreground">
            Dữ liệu được lấy từ API thật. Chỉ Giám đốc được phép cập nhật trường
            lương và phụ cấp.
          </p>
        </div>

        <Badge variant="outline" className="gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5" />
          Dữ liệu nhạy cảm
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Tổng quỹ lương
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {isLoading ? "..." : formatVND(totalPayroll)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground">
              Số bản ghi
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {isLoading ? "..." : rows.length}
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
        <AlertTitle>Kiểm soát truy cập</AlertTitle>
        <AlertDescription>
          Backend kiểm tra JWT và role. Finance Staff chỉ xem dữ liệu được phép
          xem, còn Director mới được gọi API cập nhật lương.
        </AlertDescription>
      </Alert>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            Danh sách lương
          </CardTitle>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm mã NV, họ tên, phòng ban, mã số thuế..."
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
                    Lương cơ bản
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Hệ số
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Phụ cấp
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Lương thực nhận
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    Mã số thuế
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Cập nhật</TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải danh sách lương...
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {isError && (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-muted-foreground">
                        <p>
                          {getApiErrorMessage(
                            salariesQuery.error,
                            "Không thể tải danh sách lương.",
                          )}
                        </p>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => salariesQuery.refetch()}
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
                      colSpan={11}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      {query.trim()
                        ? "Không tìm thấy bản ghi lương phù hợp."
                        : "Chưa có dữ liệu lương."}
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading &&
                  !isError &&
                  filteredRows.map((row) => (
                    <TableRow key={row.EmployeeID}>
                      <TableCell className="whitespace-nowrap font-mono font-medium">
                        {row.EmployeeID}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-foreground">
                          {row.FullName ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.DepartmentID ?? "—"}
                        </div>
                      </TableCell>

                      <TableCell>{row.DepartmentName ?? "—"}</TableCell>

                      <TableCell>{getPositionLabel(row.PositionID)}</TableCell>

                      <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                        {row.BaseSalary === undefined
                          ? "—"
                          : formatVND(row.BaseSalary)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {formatDecimal(row.SalaryCoefficient)}
                        {" / "}
                        {formatDecimal(row.PositionCoefficient)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {formatVND(row.Allowance)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {formatVND(row.FinalSalary)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {row.TaxID ?? "—"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(row.SalaryUpdatedAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(row)}
                          disabled={!canUpdateSalary}
                        >
                          <Pencil className="h-4 w-4" />
                          Sửa
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
        open={Boolean(editingEmployeeId)}
        onOpenChange={(open) => !open && closeEdit()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật lương/phụ cấp</DialogTitle>
            <DialogDescription>
              {editingEmployeeId} -{" "}
              {salaryDetailQuery.data?.FullName ?? editingRow?.FullName ?? "—"}
            </DialogDescription>
          </DialogHeader>

          {salaryDetailQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải chi tiết lương...
            </div>
          ) : (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="baseSalary">Lương cơ bản</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  min={1}
                  value={form.baseSalary}
                  onChange={(event) =>
                    updateFormField("baseSalary", event.target.value)
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salaryCoefficient">Hệ số lương</Label>
                  <Input
                    id="salaryCoefficient"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={form.salaryCoefficient}
                    onChange={(event) =>
                      updateFormField("salaryCoefficient", event.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="positionCoefficient">Hệ số chức vụ</Label>
                  <Input
                    id="positionCoefficient"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={form.positionCoefficient}
                    onChange={(event) =>
                      updateFormField("positionCoefficient", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowance">Phụ cấp</Label>
                <Input
                  id="allowance"
                  type="number"
                  min={0}
                  value={form.allowance}
                  onChange={(event) =>
                    updateFormField("allowance", event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="formulaVersion">Phiên bản công thức</Label>
                <Input
                  id="formulaVersion"
                  value={form.formulaVersion}
                  onChange={(event) =>
                    updateFormField("formulaVersion", event.target.value)
                  }
                  placeholder="v1"
                />
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Lương thực nhận sẽ được backend tính lại theo stored
                  procedure.
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEdit}
              disabled={updateSalaryMutation.isPending}
            >
              Hủy
            </Button>

            <Button
              onClick={submitUpdate}
              disabled={
                salaryDetailQuery.isLoading || updateSalaryMutation.isPending
              }
            >
              {updateSalaryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <History className="h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
