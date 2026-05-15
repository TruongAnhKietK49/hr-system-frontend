import type { ComponentType, ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  RefreshCcw,
  ShieldAlert,
  Trash2,
  User,
  Wallet,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/roles";
import { employeeKeys, employeeService } from "@/services/employeeService";
import type { EmployeeDetail as EmployeeDetailType } from "@/types/employee";
import { useRole } from "@/context/RoleContext";

const SENSITIVE_ROLES: Role[] = ["director", "manager", "finance"];
const EDIT_ROLES: Role[] = ["hrStaff", "hrManager"];
const DELETE_ROLES: Role[] = ["hrStaff", "hrManager"];

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

type IconComponent = ComponentType<{ className?: string }>;

function getPositionLabel(positionId?: number | null) {
  if (!positionId) return "—";
  return POSITION_LABELS[positionId] ?? `Position #${positionId}`;
}

function getStatusKey(employee: EmployeeDetailType) {
  if (!employee.IsActive) return "INACTIVE";
  return employee.EmploymentStatus || "ACTIVE";
}

function getStatusMeta(employee: EmployeeDetailType) {
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

function formatDecimal(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "—";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);

  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function getEmployeeName(employee: EmployeeDetailType) {
  return employee.FullName || "Thông tin bị ẩn";
}

function getInitials(employee: EmployeeDetailType) {
  const name = employee.FullName?.trim();

  if (!name) {
    return employee.EmployeeID.slice(-2).toUpperCase();
  }

  return name
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Field({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: IconComponent;
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div
        className={cn(
          "text-sm text-foreground",
          mono ? "font-mono" : "font-medium",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  sensitive,
  children,
}: {
  title: string;
  description?: string;
  icon: IconComponent;
  sensitive?: boolean;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "shadow-sm",
        sensitive && "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                sensitive
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>

            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>

          {sensitive && (
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300"
            >
              <ShieldAlert className="h-3 w-3" />
              Dữ liệu nhạy cảm
            </Badge>
          )}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function EmployeeDetailLoading() {
  return (
    <div className="space-y-6 p-6">
      <Card className="p-8 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải chi tiết nhân viên...
        </div>
      </Card>
    </div>
  );
}

export default function EmployeeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { role } = useRole();

  const canSeeSensitive = SENSITIVE_ROLES.includes(role);
  const canEdit = EDIT_ROLES.includes(role);
  const canDelete = DELETE_ROLES.includes(role);

  const employeeQuery = useQuery({
    queryKey: employeeKeys.detail(id ?? ""),
    queryFn: () => employeeService.getById(id as string),
    enabled: Boolean(id),
  });

  if (!id) {
    return (
      <div className="space-y-6 p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

        <Card className="p-8 text-center text-sm text-muted-foreground shadow-sm">
          Không tìm thấy mã nhân viên trên URL.
        </Card>
      </div>
    );
  }

  if (employeeQuery.isLoading) {
    return <EmployeeDetailLoading />;
  }

  if (employeeQuery.isError) {
    return (
      <div className="space-y-6 p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

        <Card className="p-8 text-center shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-muted-foreground">
            <p>
              {getApiErrorMessage(
                employeeQuery.error,
                "Không thể tải chi tiết nhân viên.",
              )}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => employeeQuery.refetch()}
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const employee = employeeQuery.data;

  if (!employee) {
    return (
      <div className="space-y-6 p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

        <Card className="p-8 text-center text-sm text-muted-foreground shadow-sm">
          Không tìm thấy nhân viên.
        </Card>
      </div>
    );
  }

  const statusMeta = getStatusMeta(employee);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="-ml-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>

      </div>

      <Card className="overflow-hidden shadow-sm">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar className="-mt-10 h-20 w-20 border-4 border-background shadow-md">
                <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                  {getInitials(employee)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {getEmployeeName(employee)}
                  </h1>

                  <Badge
                    variant="outline"
                    className={cn("gap-1", statusMeta.className)}
                  >
                    <BadgeCheck className="h-3 w-3" />
                    {statusMeta.label}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {getPositionLabel(employee.PositionID)} ·{" "}
                  {employee.DepartmentName ?? "—"}
                </p>

                <p className="text-xs text-muted-foreground">
                  Mã NV:{" "}
                  <span className="font-mono">{employee.EmployeeID}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Thông tin cá nhân"
          description="Thông tin cơ bản backend hiện trả về"
          icon={User}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              icon={User}
              label="Họ và tên"
              value={getEmployeeName(employee)}
            />
            <Field
              icon={User}
              label="Giới tính"
              value={employee.Gender ?? "—"}
            />
            <Field
              icon={Calendar}
              label="Ngày sinh"
              value={formatDate(employee.DateOfBirth)}
            />
            <Field
              icon={Phone}
              label="Số điện thoại"
              value={employee.PhoneNumber ?? "—"}
            />
            <Field
              icon={Receipt}
              label="Mã số thuế"
              value={employee.TaxID ?? "—"}
              mono
            />
            <Field icon={Mail} label="Email" value="—" />

            <div className="sm:col-span-2">
              <Field icon={MapPin} label="Địa chỉ thường trú" value="—" />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Thông tin công việc"
          description="Đơn vị công tác và trạng thái làm việc"
          icon={Briefcase}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              icon={Building2}
              label="Mã phòng ban"
              value={employee.DepartmentID ?? "—"}
              mono
            />
            <Field
              icon={Building2}
              label="Phòng ban"
              value={employee.DepartmentName ?? "—"}
            />
            <Field
              icon={Briefcase}
              label="Chức vụ"
              value={getPositionLabel(employee.PositionID)}
            />
            <Field label="Mã chức vụ" value={employee.PositionID ?? "—"} mono />
            <Field
              icon={Calendar}
              label="Ngày tạo hồ sơ"
              value={formatDate(employee.CreatedAt)}
            />
            <Field label="Trạng thái" value={statusMeta.label} />
            <Field
              label="Tài khoản hoạt động"
              value={employee.IsActive ? "Có" : "Không"}
            />
            <Field label="Quản lý trực tiếp" value="—" />
          </div>
        </SectionCard>

        {canSeeSensitive ? (
          <SectionCard
            title="Thông tin tài chính"
            description="Dữ liệu hiển thị theo quyền RBAC từ backend"
            icon={Wallet}
            sensitive
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                icon={Wallet}
                label="Lương cơ bản"
                value={formatVND(employee.BaseSalary)}
              />
              <Field
                icon={Wallet}
                label="Lương thực nhận"
                value={formatVND(employee.FinalSalary)}
              />
              <Field
                icon={Wallet}
                label="Phụ cấp"
                value={formatVND(employee.Allowance)}
              />
              <Field
                label="Hệ số lương"
                value={formatDecimal(employee.SalaryCoefficient)}
              />
              <Field
                label="Hệ số chức vụ"
                value={formatDecimal(employee.PositionCoefficient)}
              />
              <Field
                icon={Receipt}
                label="Mã số thuế"
                value={employee.TaxID ?? "—"}
                mono
              />
              <Field icon={Landmark} label="Ngân hàng" value="—" />
              <Field icon={CreditCard} label="Số tài khoản" value="—" mono />
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Backend đang áp dụng RBAC theo role. Một số field tài chính có
                thể không xuất hiện nếu API không trả về cho quyền hiện tại.
              </span>
            </div>
          </SectionCard>
        ) : (
          <Card className="border-dashed shadow-sm lg:col-span-1">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <p className="text-sm font-medium">
                Thông tin tài chính bị hạn chế
              </p>

              <p className="max-w-xs text-xs text-muted-foreground">
                Bạn không có quyền xem dữ liệu lương, thuế và tài khoản ngân
                hàng của nhân viên này.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
