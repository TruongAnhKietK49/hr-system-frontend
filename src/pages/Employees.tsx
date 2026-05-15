import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Eye,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { employeeKeys, employeeService } from "@/services/employeeService";
import { hrRequestService } from "@/services/hrRequestService";
import type { EmployeeListItem } from "@/types/employee";
import type { CreateHRRequestPayload } from "@/types/hrRequest";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { cn } from "@/lib/utils";
import { useRole } from "@/context/RoleContext";
import type { Role } from "@/lib/roles";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
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

const POSITION_OPTIONS = [
  { id: 1, label: "Nhân viên" },
  { id: 2, label: "Trưởng phòng" },
  { id: 3, label: "Giám đốc" },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Đang làm việc" },
  { value: "ON_LEAVE", label: "Đang nghỉ phép" },
  { value: "TERMINATED", label: "Đã nghỉ việc" },
];

const GENDER_OPTIONS = [
  { value: "Male", label: "Nam" },
  { value: "Female", label: "Nữ" },
  { value: "Other", label: "Khác" },
];

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

type EmployeeEditFormState = {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
  departmentId: string;
  positionId: string;
  employmentStatus: string;
  isActive: string;
};

const EMPTY_EDIT_FORM: EmployeeEditFormState = {
  fullName: "",
  gender: "",
  dateOfBirth: "",
  phoneNumber: "",
  departmentId: "",
  positionId: "",
  employmentStatus: "",
  isActive: "",
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

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
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

function toEditFormState(employee: EmployeeListItem): EmployeeEditFormState {
  return {
    fullName: employee.FullName ?? "",
    gender: employee.Gender ?? "",
    dateOfBirth: toDateInputValue(employee.DateOfBirth),
    phoneNumber: employee.PhoneNumber ?? "",
    departmentId: employee.DepartmentID ?? "",
    positionId: employee.PositionID ? String(employee.PositionID) : "",
    employmentStatus: employee.EmploymentStatus ?? "",
    isActive: String(employee.IsActive),
  };
}

function removeEmptyFields<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    }),
  ) as Partial<T>;
}

function buildUpdatePayload(
  employee: EmployeeListItem,
  form: EmployeeEditFormState,
) {
  const updateFields = removeEmptyFields({
    fullName:
      form.fullName.trim() !== (employee.FullName ?? "")
        ? form.fullName.trim()
        : undefined,
    gender: form.gender !== (employee.Gender ?? "") ? form.gender : undefined,
    dateOfBirth:
      form.dateOfBirth !== toDateInputValue(employee.DateOfBirth)
        ? form.dateOfBirth
        : undefined,
    phoneNumber:
      form.phoneNumber.trim() !== (employee.PhoneNumber ?? "")
        ? form.phoneNumber.trim()
        : undefined,
    departmentId:
      form.departmentId !== (employee.DepartmentID ?? "")
        ? form.departmentId
        : undefined,
    positionId:
      form.positionId && Number(form.positionId) !== employee.PositionID
        ? Number(form.positionId)
        : undefined,
    employmentStatus:
      form.employmentStatus !== (employee.EmploymentStatus ?? "")
        ? form.employmentStatus
        : undefined,
    isActive:
      form.isActive !== String(employee.IsActive)
        ? form.isActive === "true"
        : undefined,
  });

  return {
    employeeId: employee.EmployeeID,
    ...updateFields,
  };
}

export default function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useRole();

  const canSeeSensitive = SENSITIVE_ROLES.includes(role);
  const canCreateEmployeeRequest = role === "hrStaff" || role === "hrManager";

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");

  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeListItem | null>(null);
  const [editForm, setEditForm] =
    useState<EmployeeEditFormState>(EMPTY_EDIT_FORM);

  const [deleteTarget, setDeleteTarget] = useState<EmployeeListItem | null>(
    null,
  );
  const [deleteReason, setDeleteReason] = useState("");

  const employeesQuery = useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: employeeService.getAll,
  });

  const createEmployeeRequestMutation = useMutation({
    mutationFn: hrRequestService.create,

    onSuccess: async (data) => {
      toast.success("Đã gửi yêu cầu nhân sự", {
        description: `Mã yêu cầu: #${data.RequestID}`,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hr-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["approvals", "pending"] }),
      ]);

      setEditingEmployee(null);
      setEditForm(EMPTY_EDIT_FORM);
      setDeleteTarget(null);
      setDeleteReason("");
    },

    onError: (error) => {
      toast.error("Không thể gửi yêu cầu nhân sự", {
        description: getApiErrorMessage(
          error,
          "Có lỗi xảy ra khi gửi yêu cầu nhân sự.",
        ),
      });
    },
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

  const departmentOptions = useMemo(() => {
    const map = new Map<string, string>();

    employees.forEach((employee) => {
      if (!employee.DepartmentID || !employee.DepartmentName) return;

      map.set(employee.DepartmentID, employee.DepartmentName);
    });

    return Array.from(map.entries())
      .map(([departmentId, departmentName]) => ({
        departmentId,
        departmentName,
      }))
      .sort((a, b) => a.departmentName.localeCompare(b.departmentName, "vi"));
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

  const openEditDialog = (employee: EmployeeListItem) => {
    if (!canCreateEmployeeRequest) {
      toast.error("Bạn không có quyền tạo yêu cầu cập nhật nhân viên.");
      return;
    }

    setEditingEmployee(employee);
    setEditForm(toEditFormState(employee));
  };

  const openDeleteDialog = (employee: EmployeeListItem) => {
    if (!canCreateEmployeeRequest) {
      toast.error("Bạn không có quyền tạo yêu cầu xóa nhân viên.");
      return;
    }

    setDeleteTarget(employee);
    setDeleteReason("");
  };

  const closeEditDialog = () => {
    if (createEmployeeRequestMutation.isPending) return;

    setEditingEmployee(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const closeDeleteDialog = () => {
    if (createEmployeeRequestMutation.isPending) return;

    setDeleteTarget(null);
    setDeleteReason("");
  };

  const updateEditField = (
    field: keyof EmployeeEditFormState,
    value: string,
  ) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitUpdateRequest = () => {
    if (!editingEmployee) return;

    if (!editForm.fullName.trim()) {
      toast.error("Họ tên không được để trống.");
      return;
    }

    if (!editForm.phoneNumber.trim()) {
      toast.error("Số điện thoại không được để trống.");
      return;
    }

    const updatePayload = buildUpdatePayload(editingEmployee, editForm);

    const updatedFields = Object.keys(updatePayload).filter(
      (key) => key !== "employeeId",
    );

    if (updatedFields.length === 0) {
      toast.info("Không có thay đổi nào để tạo yêu cầu cập nhật.");
      return;
    }

    const payload = {
      requestType: "UPDATE_EMPLOYEE",
      payload: updatePayload,
    } satisfies CreateHRRequestPayload;

    createEmployeeRequestMutation.mutate(payload);
  };

  const submitDeleteRequest = () => {
    if (!deleteTarget) return;

    const reason = deleteReason.trim();

    if (reason.length < 10) {
      toast.error("Lý do xóa chưa hợp lệ", {
        description: "Vui lòng nhập ít nhất 10 ký tự.",
      });
      return;
    }

    const payload = {
      requestType: "DELETE_EMPLOYEE",
      payload: {
        employeeId: deleteTarget.EmployeeID,
        reason,
      },
    } satisfies CreateHRRequestPayload;

    createEmployeeRequestMutation.mutate(payload);
  };

  const isFiltering =
    Boolean(query.trim()) || department !== "all" || status !== "all";
  const totalLabel = employeesQuery.isLoading
    ? "..."
    : filteredEmployees.length;

  return (
    <div className="min-w-0 space-y-6 p-6">
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

          {canCreateEmployeeRequest && (
            <Button size="sm" onClick={() => navigate("/requests")}>
              <Plus className="h-4 w-4" />
              Thêm nhân viên
            </Button>
          )}
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

      <Card className="min-w-0 overflow-hidden shadow-sm">
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

                            {canCreateEmployeeRequest && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => openEditDialog(employee)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Tạo yêu cầu cập nhật
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => openDeleteDialog(employee)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Tạo yêu cầu xóa
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
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

      <Dialog
        open={Boolean(editingEmployee)}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Tạo yêu cầu cập nhật nhân viên
            </DialogTitle>
            <DialogDescription>
              Yêu cầu sẽ được gửi tới Giám đốc phê duyệt. Nhân viên chỉ được cập
              nhật sau khi request được duyệt.
            </DialogDescription>
          </DialogHeader>

          {editingEmployee && (
            <div className="grid gap-4 py-2 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mã nhân viên</Label>
                <Input value={editingEmployee.EmployeeID} disabled />
              </div>

              <div className="space-y-2">
                <Label>Họ tên</Label>
                <Input
                  value={editForm.fullName}
                  onChange={(event) =>
                    updateEditField("fullName", event.target.value)
                  }
                  disabled={createEmployeeRequestMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>Giới tính</Label>
                <Select
                  value={editForm.gender}
                  onValueChange={(value) => updateEditField("gender", value)}
                  disabled={createEmployeeRequestMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((gender) => (
                      <SelectItem key={gender.value} value={gender.value}>
                        {gender.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ngày sinh</Label>
                <Input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(event) =>
                    updateEditField("dateOfBirth", event.target.value)
                  }
                  disabled={createEmployeeRequestMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  value={editForm.phoneNumber}
                  onChange={(event) =>
                    updateEditField("phoneNumber", event.target.value)
                  }
                  disabled={createEmployeeRequestMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>Phòng ban</Label>
                <Select
                  value={editForm.departmentId}
                  onValueChange={(value) =>
                    updateEditField("departmentId", value)
                  }
                  disabled={createEmployeeRequestMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((item) => (
                      <SelectItem
                        key={item.departmentId}
                        value={item.departmentId}
                      >
                        {item.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Chức vụ</Label>
                <Select
                  value={editForm.positionId}
                  onValueChange={(value) =>
                    updateEditField("positionId", value)
                  }
                  disabled={createEmployeeRequestMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chức vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((position) => (
                      <SelectItem key={position.id} value={String(position.id)}>
                        {position.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái làm việc</Label>
                <Select
                  value={editForm.employmentStatus}
                  onValueChange={(value) =>
                    updateEditField("employmentStatus", value)
                  }
                  disabled={createEmployeeRequestMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tình trạng tài khoản</Label>
                <Select
                  value={editForm.isActive}
                  onValueChange={(value) => updateEditField("isActive", value)}
                  disabled={createEmployeeRequestMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tình trạng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Vô hiệu hóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEditDialog}
              disabled={createEmployeeRequestMutation.isPending}
            >
              Hủy
            </Button>

            <Button
              onClick={submitUpdateRequest}
              disabled={createEmployeeRequestMutation.isPending}
            >
              {createEmployeeRequestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Gửi yêu cầu cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Tạo yêu cầu xóa nhân viên?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không xóa trực tiếp nhân viên. Hệ thống sẽ tạo yêu
              cầu xóa và chờ Giám đốc phê duyệt.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteTarget && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Mã nhân viên:</span>{" "}
                  <span className="font-mono font-semibold">
                    {deleteTarget.EmployeeID}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Họ tên:</span>{" "}
                  <span className="font-semibold">
                    {deleteTarget.FullName ?? "—"}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Lý do xóa / vô hiệu hóa *</Label>
                <Textarea
                  value={deleteReason}
                  onChange={(event) => setDeleteReason(event.target.value)}
                  placeholder="Nhập lý do xóa/vô hiệu hóa nhân viên..."
                  rows={4}
                  disabled={createEmployeeRequestMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Tối thiểu 10 ký tự.
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={createEmployeeRequestMutation.isPending}
            >
              Hủy
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={submitDeleteRequest}
              disabled={createEmployeeRequestMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {createEmployeeRequestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Gửi yêu cầu xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
