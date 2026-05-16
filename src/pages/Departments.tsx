import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

import { useRole } from "@/context/RoleContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/common/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import {
  departmentKeys,
  departmentService,
} from "@/services/departmentService";
import { employeeKeys, employeeService } from "@/services/employeeService";
import type {
  CreateDepartmentPayload,
  DepartmentRecord,
  ManagerCandidate,
  UpdateDepartmentPayload,
} from "@/types/department";
import type { EmployeeListItem } from "@/types/employee";

const NONE = "__none__";

const departmentSchema = z.object({
  departmentName: z
    .string()
    .trim()
    .min(2, "Tên phòng ban tối thiểu 2 ký tự")
    .max(100, "Tên phòng ban tối đa 100 ký tự"),
  managerId: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;
type DepartmentSortOrder = "none" | "az" | "za";

const POSITION_LABEL_BY_ID: Record<number, string> = {
  3: "Giám đốc",
  2: "Trưởng phòng",
  1: "Nhân viên",
};

function getPositionNameById(positionId?: number | null) {
  if (!positionId) return null;

  return POSITION_LABEL_BY_ID[positionId] ?? `Chức vụ #${positionId}`;
}

function getManagerLabel(
  managerId: string | null | undefined,
  employeesById: Map<string, EmployeeListItem>,
) {
  if (!managerId) return null;

  const manager = employeesById.get(managerId);

  if (!manager?.FullName) {
    return managerId;
  }

  return `${manager.FullName} (${managerId})`;
}

function getCandidateLabel(candidate: ManagerCandidate) {
  return candidate.FullName
    ? `${candidate.FullName} (${candidate.EmployeeID})`
    : candidate.EmployeeID;
}

function getEmployeeCount(
  departmentId: string,
  employeeCountsByDepartment: Map<string, number>,
) {
  return employeeCountsByDepartment.get(departmentId) ?? 0;
}

function toCreatePayload(
  values: DepartmentFormValues,
): CreateDepartmentPayload {
  return {
    departmentName: values.departmentName.trim(),
    managerEmployeeId:
      values.managerId && values.managerId !== NONE ? values.managerId : null,
  };
}

function toUpdatePayload(
  values: DepartmentFormValues,
): UpdateDepartmentPayload {
  return {
    departmentName: values.departmentName.trim(),
    managerEmployeeId:
      values.managerId && values.managerId !== NONE ? values.managerId : null,
  };
}

export default function Departments() {
  const queryClient = useQueryClient();
  const { role } = useRole();

  const canManageDepartments = role === "director" || role === "hrManager";

  const [query, setQuery] = useState("");
  const [showVacantOnly, setShowVacantOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<DepartmentSortOrder>("none");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRecord | null>(
    null,
  );
  const [managerComboboxOpen, setManagerComboboxOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");
  const [debouncedManagerSearch, setDebouncedManagerSearch] = useState("");

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      departmentName: "",
      managerId: NONE,
    },
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedManagerSearch(managerSearch.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [managerSearch]);

  const departmentsQuery = useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: departmentService.getAll,
  });

  const employeesQuery = useQuery({
    queryKey: employeeKeys.lists(),
    queryFn: employeeService.getAll,
  });

  const departments = useMemo(
    () => departmentsQuery.data ?? [],
    [departmentsQuery.data],
  );

  const employees = useMemo(
    () => employeesQuery.data ?? [],
    [employeesQuery.data],
  );

  const managerCandidates = useMemo(() => {
    const normalizedSearch = debouncedManagerSearch.toLowerCase();

    return employees
      .filter((employee) => employee.IsActive)
      .filter((employee) => {
        const positionName = getPositionNameById(employee.PositionID);

        if (!normalizedSearch) return true;

        return [
          employee.EmployeeID,
          employee.FullName,
          employee.DepartmentID,
          employee.DepartmentName,
          positionName,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );
      })
      .slice(0, 20)
      .map(
        (employee): ManagerCandidate => ({
          EmployeeID: employee.EmployeeID,
          FullName: employee.FullName ?? null,
          DepartmentID: employee.DepartmentID ?? null,
          DepartmentName: employee.DepartmentName ?? null,
          PositionID: employee.PositionID ?? null,
          PositionName: getPositionNameById(employee.PositionID),
          IsActive: employee.IsActive,
          IsManagingDepartment: departments.some(
            (department) => department.ManagerID === employee.EmployeeID,
          ),
        }),
      );
  }, [debouncedManagerSearch, departments, employees]);

  const employeesById = useMemo(() => {
    return new Map(
      employees.map((employee) => [employee.EmployeeID, employee]),
    );
  }, [employees]);

  const employeeCountsByDepartment = useMemo(() => {
    const counts = new Map<string, number>();

    employees.forEach((employee) => {
      if (!employee.DepartmentID || !employee.IsActive) return;

      counts.set(
        employee.DepartmentID,
        (counts.get(employee.DepartmentID) ?? 0) + 1,
      );
    });

    return counts;
  }, [employees]);

  const filteredDepartments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = departments.filter((department) => {
      if (showVacantOnly && department.ManagerID) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const managerLabel = getManagerLabel(department.ManagerID, employeesById);

      return [
        department.DepartmentID,
        department.DepartmentName,
        department.ManagerID,
        managerLabel,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });

    if (sortOrder === "none") {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const result = a.DepartmentName.localeCompare(b.DepartmentName, "vi", {
        sensitivity: "base",
      });

      return sortOrder === "az" ? result : -result;
    });
  }, [departments, employeesById, query, showVacantOnly, sortOrder]);

  const {
    page: departmentPage,
    pageSize: departmentPageSize,
    paginatedItems: paginatedDepartments,
    setPage: setDepartmentPage,
    setPageSize: setDepartmentPageSize,
  } = usePagination({
    items: filteredDepartments,
    initialPageSize: 10,
    resetDeps: [query, showVacantOnly, sortOrder],
  });

  const totals = useMemo(() => {
    const totalEmployees = departments.reduce((total, department) => {
      return (
        total +
        getEmployeeCount(department.DepartmentID, employeeCountsByDepartment)
      );
    }, 0);

    return {
      departments: departments.length,
      employees: totalEmployees,
      vacantManagers: departments.filter((department) => !department.ManagerID)
        .length,
    };
  }, [departments, employeeCountsByDepartment]);

  const createDepartmentMutation = useMutation({
    mutationFn: departmentService.create,
    onSuccess: async (department) => {
      toast.success(
        department?.DepartmentID
          ? `Đã tạo phòng ban ${department.DepartmentID}`
          : "Đã tạo phòng ban mới",
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: departmentKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: employeeKeys.all,
        }),
      ]);

      setFormOpen(false);
      setManagerSearch("");
      setDebouncedManagerSearch("");
      form.reset({
        departmentName: "",
        managerId: NONE,
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể tạo phòng ban."));
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: ({
      departmentId,
      payload,
    }: {
      departmentId: string;
      payload: UpdateDepartmentPayload;
    }) => departmentService.update(departmentId, payload),
    onSuccess: async (department) => {
      toast.success(`Đã cập nhật phòng ban ${department.DepartmentName}`);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: departmentKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: employeeKeys.all,
        }),
      ]);

      setFormOpen(false);
      setEditingDepartment(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật phòng ban."));
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: departmentService.delete,
    onSuccess: async () => {
      toast.success("Đã xóa phòng ban");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: departmentKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: employeeKeys.all,
        }),
      ]);

      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể xóa phòng ban."));
    },
  });

  const isSubmitting =
    createDepartmentMutation.isPending || updateDepartmentMutation.isPending;

  const openCreate = () => {
    if (!canManageDepartments) {
      toast.error("Bạn không có quyền tạo phòng ban.");
      return;
    }

    setEditingDepartment(null);
    setManagerSearch("");
    setDebouncedManagerSearch("");
    form.reset({
      departmentName: "",
      managerId: NONE,
    });
    setFormOpen(true);
  };

  const openEdit = (department: DepartmentRecord) => {
    if (!canManageDepartments) {
      toast.error("Bạn không có quyền chỉnh sửa phòng ban.");
      return;
    }

    setEditingDepartment(department);
    setManagerSearch("");
    setDebouncedManagerSearch("");
    form.reset({
      departmentName: department.DepartmentName,
      managerId: department.ManagerID ?? NONE,
    });
    setFormOpen(true);
  };

  const tryDelete = (department: DepartmentRecord) => {
    if (!canManageDepartments) {
      toast.error("Bạn không có quyền xóa phòng ban.");
      return;
    }

    const employeeCount = getEmployeeCount(
      department.DepartmentID,
      employeeCountsByDepartment,
    );

    if (employeeCount > 0) {
      toast.error("Không thể xóa phòng ban", {
        description: `Phòng ${department.DepartmentName} vẫn còn ${employeeCount} nhân viên đang hoạt động.`,
      });
      return;
    }

    setDeleteTarget(department);
  };

  const onSubmit = (values: DepartmentFormValues) => {
    if (!canManageDepartments) {
      toast.error("Bạn không có quyền thao tác phòng ban.");
      return;
    }

    if (editingDepartment) {
      updateDepartmentMutation.mutate({
        departmentId: editingDepartment.DepartmentID,
        payload: toUpdatePayload(values),
      });
      return;
    }

    createDepartmentMutation.mutate(toCreatePayload(values));
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    deleteDepartmentMutation.mutate(deleteTarget.DepartmentID);
  };

  const isLoading = departmentsQuery.isLoading;
  const isError = departmentsQuery.isError;
  const isEmpty = !isLoading && !isError && filteredDepartments.length === 0;

  useEffect(() => {
    if (!formOpen) {
      form.reset({
        departmentName: "",
        managerId: NONE,
      });
    }
  }, [form, formOpen]);

  return (
    <div className="min-w-0 space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Quản lý phòng ban
          </h1>
          <p className="text-sm text-muted-foreground">
            Dữ liệu phòng ban được lấy từ API thật. HR Manager và Director được
            phép tạo, sửa, xóa phòng ban.
          </p>
        </div>

        {canManageDepartments && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm phòng ban
          </Button>
        )}
      </div>

      {!canManageDepartments && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Chế độ chỉ xem</AlertTitle>
          <AlertDescription>
            Tài khoản hiện tại chỉ có quyền xem danh sách phòng ban, không được
            tạo, sửa hoặc xóa phòng ban.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng phòng ban</p>
            <p className="text-xl font-semibold">
              {isLoading ? "..." : totals.departments}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng nhân viên</p>
            <p className="text-xl font-semibold">
              {employeesQuery.isLoading ? "..." : totals.employees}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Chưa có trưởng phòng
            </p>
            <p className="text-xl font-semibold">
              {isLoading ? "..." : totals.vacantManagers}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo mã, tên phòng ban, trưởng phòng"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={showVacantOnly ? "default" : "outline"}
              onClick={() => setShowVacantOnly((current) => !current)}
            >
              <AlertTriangle className="h-4 w-4" />
              Chưa có trưởng phòng
            </Button>

            <Button
              type="button"
              variant={sortOrder === "az" ? "default" : "outline"}
              onClick={() =>
                setSortOrder((current) => (current === "az" ? "none" : "az"))
              }
            >
              A → Z
            </Button>

            <Button
              type="button"
              variant={sortOrder === "za" ? "default" : "outline"}
              onClick={() =>
                setSortOrder((current) => (current === "za" ? "none" : "za"))
              }
            >
              Z → A
            </Button>
          </div>
        </div>
      </Card>

      <Card className="min-w-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="whitespace-nowrap">
                  Mã phòng ban
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  Tên phòng ban
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  Trưởng phòng
                </TableHead>
                <TableHead className="whitespace-nowrap text-right">
                  Số lượng nhân viên
                </TableHead>
                {canManageDepartments && (
                  <TableHead className="whitespace-nowrap text-right">
                    Hành động
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={canManageDepartments ? 5 : 4}
                    className="py-12 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải danh sách phòng ban...
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {isError && (
                <TableRow>
                  <TableCell
                    colSpan={canManageDepartments ? 5 : 4}
                    className="py-12 text-center"
                  >
                    <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-muted-foreground">
                      <p>
                        {getApiErrorMessage(
                          departmentsQuery.error,
                          "Không thể tải danh sách phòng ban.",
                        )}
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => departmentsQuery.refetch()}
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
                    colSpan={canManageDepartments ? 5 : 4}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {query.trim() || showVacantOnly || sortOrder !== "none"
                      ? "Không tìm thấy phòng ban phù hợp với bộ lọc hiện tại"
                      : "Chưa có phòng ban nào"}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                paginatedDepartments.map((department) => {
                  const employeeCount = getEmployeeCount(
                    department.DepartmentID,
                    employeeCountsByDepartment,
                  );

                  return (
                    <TableRow key={department.DepartmentID}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {department.DepartmentID}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-foreground">
                          {department.DepartmentName}
                        </div>
                      </TableCell>

                      <TableCell>
                        {department.ManagerID ? (
                          <span className="font-medium">
                            {getManagerLabel(
                              department.ManagerID,
                              employeesById,
                            )}
                          </span>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                          >
                            Chưa gán
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        <Badge
                          variant="outline"
                          className={
                            employeeCount > 0
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {employeesQuery.isLoading ? "..." : employeeCount}
                        </Badge>
                      </TableCell>

                      {canManageDepartments && (
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => openEdit(department)}
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
                                    className="h-8 w-8"
                                    onClick={() => openEdit(department)}
                                  >
                                    <UserCog className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Gán trưởng phòng
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => tryDelete(department)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Xóa phòng ban</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>

        {!isLoading && !isError && filteredDepartments.length > 0 && (
          <PaginationControls
            page={departmentPage}
            pageSize={departmentPageSize}
            totalItems={filteredDepartments.length}
            onPageChange={setDepartmentPage}
            onPageSizeChange={setDepartmentPageSize}
          />
        )}
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Chỉnh sửa phòng ban" : "Thêm phòng ban mới"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Cập nhật tên phòng ban và trưởng phòng."
                : "Tạo phòng ban mới từ API thật."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              id="department-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4"
            >
              {editingDepartment ? (
                <div className="space-y-2">
                  <FormLabel>Mã phòng ban</FormLabel>
                  <Input
                    value={editingDepartment.DepartmentID}
                    readOnly
                    disabled
                    className="bg-muted font-mono"
                  />
                </div>
              ) : (
                <Alert>
                  <Building2 className="h-4 w-4" />
                  <AlertDescription>
                    Mã phòng ban sẽ được hệ thống tự động tạo sau khi lưu.
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="departmentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên phòng ban *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Human Resources"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => {
                  const selectedManagerId =
                    field.value && field.value !== NONE ? field.value : null;
                  const selectedManagerLabel = selectedManagerId
                    ? getManagerLabel(selectedManagerId, employeesById)
                    : null;

                  return (
                    <FormItem>
                      <FormLabel>Trưởng phòng</FormLabel>
                      <Popover
                        open={managerComboboxOpen}
                        onOpenChange={setManagerComboboxOpen}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              disabled={isSubmitting}
                              className={cn(
                                "w-full justify-between font-normal",
                                !selectedManagerId && "text-muted-foreground",
                              )}
                            >
                              <span className="truncate">
                                {selectedManagerId
                                  ? (selectedManagerLabel ?? selectedManagerId)
                                  : "Chưa gán"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>

                        <PopoverContent
                          align="start"
                          className="w-[--radix-popover-trigger-width] p-0"
                        >
                          <Command shouldFilter={false}>
                            <CommandInput
                              value={managerSearch}
                              onValueChange={setManagerSearch}
                              placeholder="Tìm theo tên, mã NV hoặc phòng ban..."
                            />
                            <CommandList>
                              <CommandEmpty>
                                {employeesQuery.isLoading
                                  ? "Đang tải danh sách nhân viên..."
                                  : "Không tìm thấy nhân viên phù hợp"}
                              </CommandEmpty>

                              <CommandGroup>
                                <CommandItem
                                  value={NONE}
                                  onSelect={() => {
                                    field.onChange(NONE);
                                    setManagerComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      !selectedManagerId
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  Chưa gán trưởng phòng
                                </CommandItem>

                                {managerCandidates.map((candidate) => (
                                  <CommandItem
                                    key={candidate.EmployeeID}
                                    value={`${candidate.EmployeeID} ${
                                      candidate.FullName ?? ""
                                    } ${candidate.DepartmentName ?? ""}`}
                                    onSelect={() => {
                                      field.onChange(candidate.EmployeeID);
                                      setManagerComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedManagerId ===
                                          candidate.EmployeeID
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate font-medium">
                                        {getCandidateLabel(candidate)}
                                      </div>
                                      <div className="truncate text-xs text-muted-foreground">
                                        {candidate.DepartmentName ??
                                          "Chưa có phòng ban"}
                                        {candidate.PositionName
                                          ? ` · ${candidate.PositionName}`
                                          : ""}
                                        {candidate.IsManagingDepartment
                                          ? " · Đang quản lý phòng ban"
                                          : ""}
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        Danh sách chỉ hiển thị tối đa 20 nhân viên phù hợp với
                        từ khóa tìm kiếm.
                      </p>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </form>
          </Form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>

            <Button
              type="submit"
              form="department-form"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingDepartment ? "Lưu thay đổi" : "Tạo phòng ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa phòng ban?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang chuẩn bị xóa phòng ban{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.DepartmentName}
              </span>
              . Thao tác này sẽ gọi API xóa phòng ban thật và không nên thực
              hiện nếu dữ liệu đang được dùng ở nơi khác.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDepartmentMutation.isPending}>
              Hủy
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteDepartmentMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDepartmentMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Xóa phòng ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
