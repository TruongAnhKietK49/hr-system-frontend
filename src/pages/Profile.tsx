import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  Calendar,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  Save,
  ShieldAlert,
  UserCircle,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { ROLE_LABELS } from "@/lib/roles";

import { authService } from "@/services/authService";
import { employeeKeys, employeeService } from "@/services/employeeService";
import type {
  EmployeeDetail,
  UpdateEmployeeProfilePayload,
} from "@/types/employee";

const POSITION_LABELS: Record<number, string> = {
  1: "Nhân viên",
  2: "Trưởng phòng",
  3: "Giám đốc",
};

type ProfileFormState = {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  phoneNumber: string;
};

const DEFAULT_FORM_STATE: ProfileFormState = {
  fullName: "",
  gender: "",
  dateOfBirth: "",
  phoneNumber: "",
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const DEFAULT_PASSWORD_FORM_STATE: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function getPositionLabel(positionId?: number | null) {
  if (!positionId) return "—";
  return POSITION_LABELS[positionId] ?? `Position #${positionId}`;
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

function toFormState(employee?: EmployeeDetail | null): ProfileFormState {
  if (!employee) return DEFAULT_FORM_STATE;

  return {
    fullName: employee.FullName ?? "",
    gender: employee.Gender ?? "",
    dateOfBirth: toDateInputValue(employee.DateOfBirth),
    phoneNumber: employee.PhoneNumber ?? "",
  };
}

function getInitials(name: string, fallback: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return fallback.slice(-2).toUpperCase();
  }

  return trimmedName
    .split(" ")
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function buildPayload(
  form: ProfileFormState,
  currentEmployee: EmployeeDetail,
): UpdateEmployeeProfilePayload | null {
  const payload: UpdateEmployeeProfilePayload = {};

  const fullName = form.fullName.trim();
  const phoneNumber = form.phoneNumber.trim();
  const gender = form.gender || null;
  const dateOfBirth = form.dateOfBirth;

  if (fullName && fullName !== (currentEmployee.FullName ?? "")) {
    payload.fullName = fullName;
  }

  if (gender !== (currentEmployee.Gender ?? null)) {
    payload.gender = gender;
  }

  if (
    dateOfBirth &&
    dateOfBirth !== toDateInputValue(currentEmployee.DateOfBirth)
  ) {
    payload.dateOfBirth = dateOfBirth;
  }

  if (phoneNumber && phoneNumber !== (currentEmployee.PhoneNumber ?? "")) {
    payload.phoneNumber = phoneNumber;
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

function Field({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div
        className={
          mono ? "font-mono text-sm font-medium" : "text-sm font-medium"
        }
      >
        {value || "—"}
      </div>
    </div>
  );
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  const { role, username, employeeId } = useRole();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormState>(DEFAULT_FORM_STATE);

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(
    DEFAULT_PASSWORD_FORM_STATE,
  );

  const profileQuery = useQuery({
    queryKey: employeeKeys.detail(employeeId),
    queryFn: () => employeeService.getById(employeeId),
    enabled: Boolean(employeeId),
  });

  const profile = profileQuery.data;

  useEffect(() => {
    if (profile) {
      setForm(toFormState(profile));
    }
  }, [profile]);

  const updatePasswordField = (
    field: keyof PasswordFormState,
    value: string,
  ) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateProfileMutation = useMutation({
    mutationFn: ({
      targetEmployeeId,
      payload,
    }: {
      targetEmployeeId: string;
      payload: UpdateEmployeeProfilePayload;
    }) => employeeService.update(targetEmployeeId, payload),

    onSuccess: async (_updatedEmployee, variables) => {
      if (variables.payload.fullName) {
        updateUser({
          fullName: variables.payload.fullName,
        });
      }

      toast.success("Cập nhật hồ sơ cá nhân thành công");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: employeeKeys.detail(employeeId),
        }),
        queryClient.invalidateQueries({
          queryKey: employeeKeys.all,
        }),
      ]);

      setIsEditing(false);
    },

    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Không thể cập nhật hồ sơ cá nhân."),
      );
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,

    onSuccess: () => {
      toast.success("Đổi mật khẩu thành công", {
        description: "Bạn có thể tiếp tục sử dụng tài khoản với mật khẩu mới.",
      });

      setPasswordForm(DEFAULT_PASSWORD_FORM_STATE);
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể đổi mật khẩu."));
    },
  });

  const submitChangePassword = () => {
    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin mật khẩu.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const displayName = profile?.FullName ?? username;
  const initials = useMemo(
    () => getInitials(displayName, employeeId),
    [displayName, employeeId],
  );

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const cancelEdit = () => {
    if (profile) {
      setForm(toFormState(profile));
    }

    setIsEditing(false);
  };

  const submitProfile = () => {
    if (!profile) return;

    if (!form.fullName.trim()) {
      toast.error("Họ tên không được để trống.");
      return;
    }

    if (!form.phoneNumber.trim()) {
      toast.error("Số điện thoại không được để trống.");
      return;
    }

    const payload = buildPayload(form, profile);

    if (!payload) {
      toast.info("Không có thay đổi nào để cập nhật.");
      setIsEditing(false);
      return;
    }

    updateProfileMutation.mutate({
      targetEmployeeId: employeeId,
      payload,
    });
  };

  if (profileQuery.isLoading) {
    return (
      <div className="min-w-0 space-y-6 p-6">
        <Card className="p-8 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải hồ sơ cá nhân...
          </div>
        </Card>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="min-w-0 space-y-6 p-6">
        <Card className="p-8 text-center shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-sm text-muted-foreground">
            <p>
              {getApiErrorMessage(
                profileQuery.error,
                "Không thể tải hồ sơ cá nhân.",
              )}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={() => profileQuery.refetch()}
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-w-0 space-y-6 p-6">
        <Card className="p-8 text-center text-sm text-muted-foreground shadow-sm">
          Không tìm thấy hồ sơ cá nhân.
        </Card>
      </div>
    );
  }

  const isSubmitting = updateProfileMutation.isPending;
  const isChangingPassword = changePasswordMutation.isPending;

  return (
    <div className="min-w-0 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground">
          Xem và cập nhật thông tin cá nhân không nhạy cảm của tài khoản đang
          đăng nhập.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <CardTitle>{displayName}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{ROLE_LABELS[role]}</Badge>
              <Badge variant="outline" className="gap-1">
                <BadgeCheck className="h-3 w-3" />
                {profile.IsActive ? "Đang hoạt động" : "Không hoạt động"}
              </Badge>
              <Badge variant="outline" className="font-mono">
                {profile.EmployeeID}
              </Badge>
            </div>
          </div>

          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Chỉnh sửa thông tin cá nhân
            </Button>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="grid gap-6 p-6 md:grid-cols-2">
          {!isEditing ? (
            <>
              <Field
                icon={UserCircle}
                label="Mã nhân viên"
                value={profile.EmployeeID}
                mono
              />
              <Field icon={Mail} label="Tên đăng nhập" value={username} />
              <Field
                icon={Phone}
                label="Số điện thoại"
                value={profile.PhoneNumber ?? "—"}
              />
              <Field
                icon={Building2}
                label="Phòng ban"
                value={profile.DepartmentName ?? "—"}
              />
              <Field
                label="Chức vụ"
                value={getPositionLabel(profile.PositionID)}
              />
              <Field
                icon={Calendar}
                label="Ngày sinh"
                value={formatDate(profile.DateOfBirth)}
              />
              <Field label="Giới tính" value={profile.Gender ?? "—"} />
              <Field
                label="Trạng thái làm việc"
                value={profile.EmploymentStatus ?? "—"}
              />

              <div className="rounded-lg border border-amber-300/60 bg-amber-50/60 p-4 text-sm dark:bg-amber-950/10 md:col-span-2">
                <div className="flex gap-2 font-medium">
                  <ShieldAlert className="h-4 w-4" />
                  Lưu ý bảo mật
                </div>
                <p className="mt-1 text-muted-foreground">
                  Lương, phụ cấp, mã số thuế và dữ liệu phân quyền không được
                  chỉnh sửa tại hồ sơ cá nhân. Các trường này chỉ được xử lý bởi
                  vai trò có thẩm quyền.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Giới tính</Label>
                <Select
                  value={form.gender || "unknown"}
                  onValueChange={(value) =>
                    updateField("gender", value === "unknown" ? "" : value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Chưa cập nhật</SelectItem>
                    <SelectItem value="Male">Nam</SelectItem>
                    <SelectItem value="Female">Nữ</SelectItem>
                    <SelectItem value="Other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) =>
                    updateField("dateOfBirth", event.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  value={form.phoneNumber}
                  onChange={(event) =>
                    updateField("phoneNumber", event.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="rounded-lg border border-amber-300/60 bg-amber-50/60 p-4 text-sm dark:bg-amber-950/10 md:col-span-2">
                <div className="flex gap-2 font-medium">
                  <ShieldAlert className="h-4 w-4" />
                  Phạm vi chỉnh sửa
                </div>
                <p className="mt-1 text-muted-foreground">
                  Hồ sơ cá nhân chỉ cho chỉnh sửa họ tên, giới tính, ngày sinh
                  và số điện thoại. Phòng ban, chức vụ, trạng thái và thông tin
                  lương không chỉnh sửa ở màn này.
                </p>
              </div>

              <div className="flex justify-end gap-2 md:col-span-2">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>

                <Button onClick={submitProfile} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Lưu thay đổi
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Đổi mật khẩu
          </CardTitle>
        </CardHeader>

        <Separator />

        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                updatePasswordField("currentPassword", event.target.value)
              }
              disabled={isChangingPassword}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                updatePasswordField("newPassword", event.target.value)
              }
              disabled={isChangingPassword}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                updatePasswordField("confirmPassword", event.target.value)
              }
              disabled={isChangingPassword}
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground md:col-span-2">
            <div className="flex gap-2 font-medium text-foreground">
              <ShieldAlert className="h-4 w-4" />
              Lưu ý bảo mật
            </div>
            <p className="mt-1">
              Mật khẩu mới nên khác mật khẩu hiện tại và có tối thiểu 6 ký tự.
              Không chia sẻ mật khẩu cho người khác.
            </p>
          </div>

          <div className="flex items-end justify-end">
            <Button
              onClick={submitChangePassword}
              disabled={isChangingPassword}
              className="w-full md:w-auto"
            >
              {isChangingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              Đổi mật khẩu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
