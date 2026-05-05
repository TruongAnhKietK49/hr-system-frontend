import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ShieldAlert,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Building2,
  Briefcase,
  BadgeCheck,
  CreditCard,
  Wallet,
  Receipt,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRole } from "@/context/RoleContext";
import type { Role } from "@/lib/roles";

const SENSITIVE_ROLES: Role[] = ["director", "manager", "finance"];
const EDIT_ROLES: Role[] = ["hrStaff", "hrManager"];
const DELETE_ROLES: Role[] = ["hrStaff", "hrManager"];

const EMPLOYEE = {
  id: "NV001",
  name: "Nguyễn Văn An",
  position: "Kỹ sư phần mềm cấp cao",
  department: "Phòng Kỹ thuật",
  status: "active" as const,
  email: "an.nguyen@company.vn",
  phone: "0901 234 567",
  gender: "Nam",
  dob: "12/04/1990",
  idNumber: "0123 4567 8910",
  address: "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
  maritalStatus: "Đã kết hôn",
  nationality: "Việt Nam",
  // work
  joinDate: "01/03/2018",
  contractType: "Hợp đồng không xác định thời hạn",
  manager: "Hoàng Minh Đức",
  workLocation: "Văn phòng HCM - Tầng 12",
  workEmail: "an.nguyen@company.vn",
  level: "Senior",
  // finance (sensitive)
  salary: 25000000,
  allowance: 2000000,
  bonus: 5000000,
  taxCode: "8123456789",
  bankName: "Vietcombank",
  bankAccount: "0071 0001 2345 67",
  insuranceCode: "DN1234567890",
};

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);

function Field({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className={`text-sm text-foreground ${mono ? "font-mono" : "font-medium"}`}>
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
  icon: React.ComponentType<{ className?: string }>;
  sensitive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={
        sensitive
          ? "border-amber-300/60 bg-amber-50/40 shadow-sm dark:bg-amber-950/10"
          : "shadow-sm"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                sensitive ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {sensitive && (
            <Badge
              variant="outline"
              className="gap-1 border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100"
            >
              <ShieldAlert className="h-3 w-3" /> Dữ liệu nhạy cảm
            </Badge>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

export default function EmployeeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role } = useRole();

  const canSeeSensitive = SENSITIVE_ROLES.includes(role);
  const canEdit = EDIT_ROLES.includes(role);
  const canDelete = DELETE_ROLES.includes(role);

  const emp = { ...EMPLOYEE, id: id ?? EMPLOYEE.id };
  const initials = emp.name.split(" ").slice(-2).map((s) => s[0]).join("");

  return (
    <div className="space-y-6 p-6">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button size="sm">
              <Pencil className="h-4 w-4" /> Chỉnh sửa
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" /> Tạo yêu cầu xóa
            </Button>
          )}
        </div>
      </div>

      {/* Profile header */}
      <Card className="overflow-hidden shadow-sm">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar className="-mt-10 h-20 w-20 border-4 border-background shadow-md">
                <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{emp.name}</h1>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    <BadgeCheck className="h-3 w-3" /> Đang làm việc
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {emp.position} · {emp.department}
                </p>
                <p className="text-xs text-muted-foreground">Mã NV: <span className="font-mono">{emp.id}</span></p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal info */}
        <SectionCard title="Thông tin cá nhân" description="Thông tin liên hệ và nhân khẩu" icon={User}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field icon={User} label="Họ và tên" value={emp.name} />
            <Field icon={User} label="Giới tính" value={emp.gender} />
            <Field icon={Calendar} label="Ngày sinh" value={emp.dob} />
            <Field label="Số CCCD" value={emp.idNumber} mono />
            <Field icon={Mail} label="Email cá nhân" value={emp.email} />
            <Field icon={Phone} label="Số điện thoại" value={emp.phone} />
            <Field label="Tình trạng hôn nhân" value={emp.maritalStatus} />
            <Field label="Quốc tịch" value={emp.nationality} />
            <div className="sm:col-span-2">
              <Field icon={MapPin} label="Địa chỉ thường trú" value={emp.address} />
            </div>
          </div>
        </SectionCard>

        {/* Work info */}
        <SectionCard title="Thông tin công việc" description="Hợp đồng, vị trí và đơn vị công tác" icon={Briefcase}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field icon={Building2} label="Phòng ban" value={emp.department} />
            <Field icon={Briefcase} label="Chức vụ" value={emp.position} />
            <Field label="Cấp bậc" value={emp.level} />
            <Field label="Quản lý trực tiếp" value={emp.manager} />
            <Field icon={Calendar} label="Ngày vào làm" value={emp.joinDate} />
            <Field label="Loại hợp đồng" value={emp.contractType} />
            <Field icon={Mail} label="Email công việc" value={emp.workEmail} />
            <Field icon={MapPin} label="Nơi làm việc" value={emp.workLocation} />
          </div>
        </SectionCard>

        {/* Financial - sensitive */}
        {canSeeSensitive ? (
          <SectionCard
            title="Thông tin tài chính"
            description="Lương, thuế và tài khoản ngân hàng"
            icon={Wallet}
            sensitive
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field icon={Wallet} label="Lương cơ bản" value={formatVND(emp.salary)} />
              <Field icon={Wallet} label="Phụ cấp" value={formatVND(emp.allowance)} />
              <Field icon={Wallet} label="Thưởng" value={formatVND(emp.bonus)} />
              <Field icon={Receipt} label="Mã số thuế" value={emp.taxCode} mono />
              <Field icon={Landmark} label="Ngân hàng" value={emp.bankName} />
              <Field icon={CreditCard} label="Số tài khoản" value={emp.bankAccount} mono />
              <div className="sm:col-span-2">
                <Field icon={ShieldAlert} label="Mã số BHXH" value={emp.insuranceCode} mono />
              </div>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-100/60 p-3 text-xs text-amber-800">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Dữ liệu trong mục này được phân loại nhạy cảm. Mọi truy cập đều được ghi vào nhật ký kiểm tra (audit log).
              </span>
            </div>
          </SectionCard>
        ) : (
          <Card className="border-dashed shadow-sm lg:col-span-1">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Thông tin tài chính bị hạn chế</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Bạn không có quyền xem dữ liệu lương, thuế và tài khoản ngân hàng của nhân viên này.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
