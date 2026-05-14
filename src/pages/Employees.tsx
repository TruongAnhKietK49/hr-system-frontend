import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Eye,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";

import { employeeKeys, employeeService } from "@/services/employeeService";
import type { EmployeeListItem } from "@/types/employee";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { cn } from "@/lib/utils";
import { useRole } from "@/context/RoleContext";
import type { Role } from "@/lib/roles";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SENSITIVE_ROLES: Role[] = ["director", "manager", "finance"];

const POSITION_LABELS: Record<number, string> = {
  1: "Nhân viên",
  2: "Trưởng phòng",
  3: "Giám đốc",
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Đang làm việc",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300",
  },
  ON_LEAVE: {
    label: "Nghỉ phép",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300",
  },
  TERMINATED: {
    label: "Đã nghỉ việc",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  INACTIVE: {
    label: "Không hoạt động",
    className: "border-muted bg-muted text-muted-foreground",
  },
};

function getPositionLabel(positionId?: number | null) {
  if (!positionId) return "—";
  return POSITION_LABELS[positionId] ?? `Position #${positionId}`;
}

function getStatusKey(employee: EmployeeListItem) {
  if (!employee.IsActive) return "INACTIVE";
  return employee.EmploymentStatus || "ACTIVE";
}

function getStatusMeta(employee: EmployeeListItem) {
  const statusKey = getStatusKey(employee);

  return (
    STATUS_META[statusKey] ?? {
      label: statusKey,
      className: "border-border bg-muted text-muted-foreground",
    }
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function formatVND(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "—";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function getEmployeeName(employee: EmployeeListItem) {
  return employee.FullName || "Thông tin bị ẩn";
}

function getAvatarLabel(employee: EmployeeListItem) {
  const name = employee.FullName?.trim();

  if (name) {
    return name.split(" ").pop()?.[0] ?? "?";
  }

  return employee.EmployeeID.slice(-1);
}

export default function Employees() {
  const navigate = useNavigate();
  const { role } = useRole();

  const canSeeSensitive = SENSITIVE_ROLES.includes(role);

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const employeesQuery = useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: employeeService.getAll,
  });

  const employees = useMemo(
    () => employeesQuery.data ?? [],
    [employeesQuery.data],
  );

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        employees
          .map((employee) => employee.DepartmentName)
          .filter((name): name is string => Boolean(name)),
      ),
    ).sort((a, b) => a.localeCompare(b, "vi"));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return employees.filter((employee) => {
      const employeeStatus = getStatusKey(employee);

      if (department !== "all" && employee.DepartmentName !== department) {
        return false;
      }

      if (status !== "all" && employeeStatus !== status) {
        return false;
      }

      if (!normalizedQuery) return true;

      return [employee.EmployeeID, employee.FullName, employee.PhoneNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [department, employees, query, status]);

  const resetFilters = () => {
    setQuery("");
    setDepartment("all");
    setStatus("all");
  };

  const isFiltering =
    Boolean(query.trim()) || department !== "all" || status !== "all";
  const totalLabel = employeesQuery.isLoading
    ? "..."
    : filteredEmployees.length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Quản lý nhân viên
          </h1>
          <p className="text-sm text-muted-foreground">
            Tổng cộng{" "}
            <span className="font-medium text-foreground">{totalLabel}</span>{" "}
            nhân viên
            {canSeeSensitive && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Chế độ xem dữ liệu nhạy cảm
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={employeesQuery.isLoading}
          >
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>

          <Button size="sm">
            <Plus className="h-4 w-4" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm nhân viên (tên, mã NV, SĐT)"
              className="pl-9"
            />
          </div>

          <div className="md:col-span-3">
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {departments.map((departmentName) => (
                  <SelectItem key={departmentName} value={departmentName}>
                    {departmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang làm việc</SelectItem>
                <SelectItem value="ON_LEAVE">Nghỉ phép</SelectItem>
                <SelectItem value="TERMINATED">Đã nghỉ việc</SelectItem>
                <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1">
            <Button
              variant="outline"
              className="w-full"
              onClick={resetFilters}
              disabled={!isFiltering}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="whitespace-nowrap">Mã NV</TableHead>
                <TableHead className="whitespace-nowrap">Họ tên</TableHead>
                <TableHead className="whitespace-nowrap">Giới tính</TableHead>
                <TableHead className="whitespace-nowrap">Ngày sinh</TableHead>
                <TableHead className="whitespace-nowrap">SĐT</TableHead>
                <TableHead className="whitespace-nowrap">Phòng ban</TableHead>
                <TableHead className="whitespace-nowrap">Chức vụ</TableHead>
                <TableHead className="whitespace-nowrap">Trạng thái</TableHead>

                {canSeeSensitive && (
                  <>
                    <TableHead className="whitespace-nowrap text-right">
                      Lương thực nhận
                    </TableHead>
                    <TableHead className="whitespace-nowrap text-right">
                      Phụ cấp
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Mã số thuế
                    </TableHead>
                  </>
                )}

                <TableHead className="whitespace-nowrap text-right">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {employeesQuery.isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={canSeeSensitive ? 12 : 9}
                    className="py-12 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải danh sách nhân viên...
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {employeesQuery.isError && (
                <TableRow>
                  <TableCell
                    colSpan={canSeeSensitive ? 12 : 9}
                    className="py-12 text-center"
                  >
                    <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-muted-foreground">
                      <p>
                        {getApiErrorMessage(
                          employeesQuery.error,
                          "Không thể tải danh sách nhân viên.",
                        )}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => employeesQuery.refetch()}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Tải lại
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!employeesQuery.isLoading &&
                !employeesQuery.isError &&
                filteredEmployees.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={canSeeSensitive ? 12 : 9}
                      className="py-12 text-center text-muted-foreground"
                    >
                      {isFiltering
                        ? "Không tìm thấy nhân viên phù hợp"
                        : "Chưa có nhân viên nào"}
                    </TableCell>
                  </TableRow>
                )}

              {!employeesQuery.isLoading &&
                !employeesQuery.isError &&
                filteredEmployees.map((employee) => {
                  const statusMeta = getStatusMeta(employee);

                  return (
                    <TableRow key={employee.EmployeeID}>
                      <TableCell className="font-medium text-foreground">
                        {employee.EmployeeID}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {getAvatarLabel(employee)}
                          </div>
                          <span className="font-medium">
                            {getEmployeeName(employee)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{employee.Gender ?? "—"}</TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDate(employee.DateOfBirth)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {employee.PhoneNumber ?? "—"}
                      </TableCell>

                      <TableCell>{employee.DepartmentName ?? "—"}</TableCell>

                      <TableCell>
                        {getPositionLabel(employee.PositionID)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(statusMeta.className)}
                        >
                          {statusMeta.label}
                        </Badge>
                      </TableCell>

                      {canSeeSensitive && (
                        <>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {formatVND(employee.FinalSalary)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {formatVND(employee.Allowance)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            {employee.TaxID ?? "—"}
                          </TableCell>
                        </>
                      )}

                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    navigate(
                                      `/employees/${employee.EmployeeID}`,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Xem chi tiết</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Chỉnh sửa</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Tạo yêu cầu xóa</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
