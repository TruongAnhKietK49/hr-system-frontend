import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Check,
  ChevronsUpDown,
  Info,
  Loader2,
  Pencil,
  Send,
  ShieldAlert,
  UserMinus,
  UserPen,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { hrRequestService } from "@/services/hrRequestService";
import { masterDataService } from "@/services/masterDataService";
import {
  CreateHRRequestPayload,
  UpdateEmployeePayload,
} from "@/types/hrRequest";

import { cn } from "@/lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const POSITION_OPTIONS = [
  { id: 1, label: "Nhân viên" },
  { id: 2, label: "Trưởng phòng" },
  { id: 3, label: "Giám đốc" },
];

const ROLE_OPTIONS = [
  { value: "Employee", label: "Nhân viên" },
  { value: "Manager", label: "Trưởng phòng" },
  { value: "HR Staff", label: "Nhân viên nhân sự" },
  { value: "HR Manager", label: "Trưởng phòng nhân sự" },
  { value: "Finance Staff", label: "Nhân viên tài vụ" },
] as const;

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Đang làm việc" },
  { value: "ON_LEAVE", label: "Đang nghỉ phép" },
  { value: "TERMINATED", label: "Đã nghỉ việc" },
];

const createEmployeeSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên không vượt quá 100 ký tự"),
  gender: z.enum(["Nam", "Nữ", "Khác"], {
    required_error: "Vui lòng chọn giới tính",
  }),
  dateOfBirth: z
    .date({ required_error: "Vui lòng chọn ngày sinh" })
    .refine((date) => date < new Date(), "Ngày sinh phải nhỏ hơn hôm nay"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^(0|\+84)[0-9]{9,10}$/, "Số điện thoại không hợp lệ"),
  taxId: z.string().trim().min(5, "Mã số thuế không hợp lệ"),
  departmentId: z.string().min(1, "Vui lòng chọn phòng ban"),
  positionId: z.coerce.number().int().positive("Vui lòng chọn chức vụ"),
  username: z.string().trim().min(3, "Username phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  role: z.enum(
    ["Employee", "Manager", "HR Staff", "HR Manager", "Finance Staff"],
    {
      required_error: "Vui lòng chọn vai trò",
    },
  ),
});

const updateEmployeeSchema = z
  .object({
    employeeId: z.string().min(1, "Vui lòng chọn nhân viên"),
    fullName: z.string().trim().optional(),
    gender: z.enum(["Nam", "Nữ", "Khác"]).optional(),
    dateOfBirth: z.date().optional(),
    phoneNumber: z.string().trim().optional(),
    departmentId: z.string().optional(),
    positionId: z.coerce.number().int().positive().optional(),
    employmentStatus: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
  })
  .superRefine((value, ctx) => {
    const hasUpdateField = [
      value.fullName,
      value.gender,
      value.dateOfBirth,
      value.phoneNumber,
      value.departmentId,
      value.positionId,
      value.employmentStatus,
      value.isActive,
    ].some((field) => field !== undefined && field !== "");

    if (!hasUpdateField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập ít nhất một thông tin cần cập nhật",
        path: ["employeeId"],
      });
    }

    if (value.phoneNumber && !/^(0|\+84)[0-9]{9,10}$/.test(value.phoneNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Số điện thoại không hợp lệ",
        path: ["phoneNumber"],
      });
    }
  });

const deleteEmployeeSchema = z.object({
  employeeId: z.string().min(1, "Vui lòng chọn nhân viên"),
  reason: z
    .string()
    .trim()
    .min(10, "Lý do phải có ít nhất 10 ký tự")
    .max(500, "Lý do không vượt quá 500 ký tự"),
});

type CreateEmployeeForm = z.infer<typeof createEmployeeSchema>;
type UpdateEmployeeForm = z.infer<typeof updateEmployeeSchema>;
type DeleteEmployeeForm = z.infer<typeof deleteEmployeeSchema>;

type RequestTab = "create" | "update" | "delete";

function toApiDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

const MIN_BIRTH_DATE = "1940-01-01";
const MAX_BIRTH_DATE = format(new Date(), "yyyy-MM-dd");

function toDateInputValue(date?: Date) {
  return date ? format(date, "yyyy-MM-dd") : "";
}

function fromDateInputValue(value: string) {
  return value ? new Date(`${value}T00:00:00`) : undefined;
}

function removeEmptyFields<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      return value !== undefined && value !== null && value !== "";
    }),
  ) as Partial<T>;
}

type DepartmentOption = {
  DepartmentID: string;
  DepartmentName: string;
};

type DepartmentComboboxProps = {
  departments: DepartmentOption[];
  value?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  allowClear?: boolean;
  onChange: (value: string) => void;
};

function DepartmentCombobox({
  departments,
  value,
  placeholder = "Chọn phòng ban",
  searchPlaceholder = "Tìm phòng ban...",
  emptyMessage = "Không tìm thấy phòng ban.",
  disabled = false,
  allowClear = false,
  onChange,
}: DepartmentComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedDepartment = departments.find(
    (department) => department.DepartmentID === value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-background font-normal",
            !selectedDepartment && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {selectedDepartment?.DepartmentName ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />

          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>

            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__clear_department__"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  Không thay đổi
                </CommandItem>
              )}

              {departments.map((department) => (
                <CommandItem
                  key={department.DepartmentID}
                  value={`${department.DepartmentName} ${department.DepartmentID}`}
                  onSelect={() => {
                    if (allowClear && value === department.DepartmentID) {
                      onChange("");
                    } else {
                      onChange(department.DepartmentID);
                    }

                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === department.DepartmentID
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />

                  <span className="truncate">{department.DepartmentName}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function Requests() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<RequestTab>("create");

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: masterDataService.getDepartments,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: masterDataService.getEmployees,
  });

  const createForm = useForm<CreateEmployeeForm>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      fullName: "",
      gender: undefined,
      phoneNumber: "",
      taxId: "",
      departmentId: "",
      positionId: undefined,
      username: "",
      password: "",
      role: "Employee",
    },
  });

  const updateForm = useForm<UpdateEmployeeForm>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      employeeId: "",
      fullName: "",
      phoneNumber: "",
      departmentId: "",
      employmentStatus: "",
      isActive: undefined,
    },
  });

  const deleteForm = useForm<DeleteEmployeeForm>({
    resolver: zodResolver(deleteEmployeeSchema),
    defaultValues: {
      employeeId: "",
      reason: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: hrRequestService.create,
    onSuccess: (data) => {
      toast.success("Đã gửi yêu cầu nhân sự", {
        description: `Mã yêu cầu: #${data.RequestID}`,
      });

      queryClient.invalidateQueries({ queryKey: ["hr-requests"] });

      if (data.RequestType === "CREATE_EMPLOYEE") {
        createForm.reset();
      }

      if (data.RequestType === "UPDATE_EMPLOYEE") {
        updateForm.reset();
      }

      if (data.RequestType === "DELETE_EMPLOYEE") {
        deleteForm.reset();
      }
    },
    onError: (error) => {
      toast.error("Không thể gửi yêu cầu", {
        description: getApiErrorMessage(
          error,
          "Có lỗi xảy ra khi gửi yêu cầu nhân sự.",
        ),
      });
    },
  });

  const departments = departmentsQuery.data ?? [];
  const employees = useMemo(() => {
    return (employeesQuery.data ?? []).filter((employee) => employee.IsActive);
  }, [employeesQuery.data]);

  const isLoadingMasterData =
    departmentsQuery.isLoading || employeesQuery.isLoading;

  const isSubmitting = createRequestMutation.isPending;

  const submitCreateEmployee = (values: CreateEmployeeForm) => {
    const payload: CreateHRRequestPayload = {
      requestType: "CREATE_EMPLOYEE",
      payload: {
        fullName: values.fullName.trim(),
        gender: values.gender,
        dateOfBirth: toApiDate(values.dateOfBirth),
        phoneNumber: values.phoneNumber.trim(),
        taxId: values.taxId.trim(),
        departmentId: values.departmentId,
        positionId: values.positionId,
        username: values.username.trim(),
        password: values.password,
        role: values.role,
      },
    };

    createRequestMutation.mutate(payload);
  };

  const submitUpdateEmployee = (values: UpdateEmployeeForm) => {
    const cleanedPayload = removeEmptyFields({
      employeeId: values.employeeId,
      fullName: values.fullName?.trim(),
      gender: values.gender,
      dateOfBirth: values.dateOfBirth
        ? toApiDate(values.dateOfBirth)
        : undefined,
      phoneNumber: values.phoneNumber?.trim(),
      departmentId: values.departmentId,
      positionId: values.positionId,
      employmentStatus: values.employmentStatus,
      isActive:
        values.isActive === undefined ? undefined : values.isActive === "true",
    }) as UpdateEmployeePayload;

    const payload = {
      requestType: "UPDATE_EMPLOYEE",
      payload: cleanedPayload,
    } satisfies CreateHRRequestPayload;

    createRequestMutation.mutate(payload);
  };

  const submitDeleteEmployee = (values: DeleteEmployeeForm) => {
    const selectedEmployee = employees.find(
      (employee) => employee.EmployeeID === values.employeeId,
    );

    const payload: CreateHRRequestPayload = {
      requestType: "DELETE_EMPLOYEE",
      payload: {
        employeeId: values.employeeId,
        reason: values.reason.trim(),
      },
    };

    createRequestMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success("Đã gửi yêu cầu xóa nhân viên", {
          description: `${selectedEmployee?.EmployeeID ?? values.employeeId} - ${
            selectedEmployee?.FullName ?? "Nhân viên"
          } · Mã yêu cầu #${data.RequestID}`,
        });

        queryClient.invalidateQueries({ queryKey: ["hr-requests"] });
        deleteForm.reset();
      },
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Yêu cầu nhân sự
        </h1>
        <p className="text-sm text-muted-foreground">
          Tạo yêu cầu thêm, cập nhật hoặc xóa nhân viên. Yêu cầu sẽ được gửi tới
          Giám đốc để phê duyệt.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as RequestTab)}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="create" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Thêm
          </TabsTrigger>
          <TabsTrigger value="update" className="gap-2">
            <UserPen className="h-4 w-4" />
            Cập nhật
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-2">
            <UserMinus className="h-4 w-4" />
            Xóa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Thông tin nhân viên mới
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Alert className="mb-6 border-primary/30 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-sm">Lưu ý</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  HR nhập thông tin hành chính và tài khoản. Thông tin lương sẽ
                  do Giám đốc nhập ở bước phê duyệt.
                </AlertDescription>
              </Alert>

              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(submitCreateEmployee)}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <FormField
                    control={createForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Họ tên *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VD: Nguyễn Văn A"
                            maxLength={100}
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giới tính *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Nam">Nam</SelectItem>
                            <SelectItem value="Nữ">Nữ</SelectItem>
                            <SelectItem value="Khác">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày sinh *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={MIN_BIRTH_DATE}
                            max={MAX_BIRTH_DATE}
                            value={toDateInputValue(field.value)}
                            onChange={(event) => {
                              field.onChange(
                                fromDateInputValue(event.target.value),
                              );
                            }}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VD: 0901234567"
                            maxLength={15}
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã số thuế *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VD: 0312345678"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phòng ban *</FormLabel>
                        <FormControl>
                          <DepartmentCombobox
                            departments={departments}
                            value={field.value}
                            placeholder="Chọn phòng ban"
                            searchPlaceholder="Tìm phòng ban..."
                            disabled={isSubmitting || isLoadingMasterData}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="positionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vị trí công việc *</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={field.value ? String(field.value) : ""}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn vị trí công việc" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {POSITION_OPTIONS.map((position) => (
                              <SelectItem
                                key={position.id}
                                value={String(position.id)}
                              >
                                {position.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Vị trí nhân sự trong cơ cấu công ty, không phải quyền
                          đăng nhập hệ thống.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quyền truy cập hệ thống *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn quyền truy cập" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Quyền dùng để phân quyền menu và API, ví dụ HR Staff,
                          Finance Staff, Manager.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div />

                  <FormField
                    control={createForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VD: nguyenvana"
                            autoComplete="off"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mật khẩu *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Tối thiểu 6 ký tự"
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 md:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => createForm.reset()}
                    >
                      Làm mới
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Gửi yêu cầu
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="update" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Yêu cầu cập nhật nhân viên
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Alert className="mb-6 border-blue-300 bg-blue-50 text-blue-900">
                <Pencil className="h-4 w-4" />
                <AlertTitle className="text-sm">
                  Chỉ nhập field cần thay đổi
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Các ô bỏ trống sẽ không được gửi lên backend. Yêu cầu sau khi
                  tạo vẫn cần Giám đốc phê duyệt.
                </AlertDescription>
              </Alert>

              <Form {...updateForm}>
                <form
                  onSubmit={updateForm.handleSubmit(submitUpdateEmployee)}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <FormField
                    control={updateForm.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nhân viên cần cập nhật *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting || employeesQuery.isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nhân viên" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem
                                key={employee.EmployeeID}
                                value={employee.EmployeeID}
                              >
                                {employee.EmployeeID} — {employee.FullName} (
                                {employee.DepartmentName})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ tên mới</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Để trống nếu không đổi"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giới tính mới</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Không thay đổi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Nam">Nam</SelectItem>
                            <SelectItem value="Nữ">Nữ</SelectItem>
                            <SelectItem value="Khác">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày sinh mới</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={MIN_BIRTH_DATE}
                            max={MAX_BIRTH_DATE}
                            value={toDateInputValue(field.value)}
                            onChange={(event) => {
                              field.onChange(
                                fromDateInputValue(event.target.value),
                              );
                            }}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại mới</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Để trống nếu không đổi"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phòng ban mới</FormLabel>
                        <FormControl>
                          <DepartmentCombobox
                            departments={departments}
                            value={field.value}
                            placeholder="Không thay đổi"
                            searchPlaceholder="Tìm phòng ban..."
                            disabled={
                              isSubmitting || departmentsQuery.isLoading
                            }
                            allowClear
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="positionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chức vụ mới</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={field.value ? String(field.value) : ""}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Không thay đổi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {POSITION_OPTIONS.map((position) => (
                              <SelectItem
                                key={position.id}
                                value={String(position.id)}
                              >
                                {position.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="employmentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trạng thái làm việc</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Không thay đổi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EMPLOYMENT_STATUS_OPTIONS.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={updateForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tình trạng tài khoản</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Không thay đổi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Đang hoạt động</SelectItem>
                            <SelectItem value="false">Vô hiệu hóa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 md:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => updateForm.reset()}
                    >
                      Làm mới
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Gửi yêu cầu cập nhật
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delete" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Yêu cầu xóa nhân viên</CardTitle>
            </CardHeader>

            <CardContent>
              <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-900">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle className="text-sm">
                  Lưu ý trước khi xóa nhân viên
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Nhân viên sẽ được chuyển sang trạng thái ngừng hoạt động và
                  tài khoản đăng nhập sẽ bị vô hiệu hóa. Dữ liệu hồ sơ, lương và
                  lịch sử yêu cầu liên quan vẫn được giữ lại để phục vụ tra cứu
                  và đối soát sau này.
                </AlertDescription>
              </Alert>

              <Form {...deleteForm}>
                <form
                  onSubmit={deleteForm.handleSubmit(submitDeleteEmployee)}
                  className="space-y-5"
                >
                  <FormField
                    control={deleteForm.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nhân viên cần xóa *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSubmitting || employeesQuery.isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nhân viên" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem
                                key={employee.EmployeeID}
                                value={employee.EmployeeID}
                              >
                                {employee.EmployeeID} — {employee.FullName} (
                                {employee.DepartmentName})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={deleteForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lý do xóa *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Mô tả lý do xóa/vô hiệu hóa nhân viên"
                            rows={5}
                            maxLength={500}
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Tối thiểu 10 ký tự, tối đa 500 ký tự.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => deleteForm.reset()}
                    >
                      Làm mới
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Gửi yêu cầu xóa
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
