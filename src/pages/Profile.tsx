import { UserCircle, Mail, Phone, Building2, BadgeCheck, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRole } from "@/context/RoleContext";
import { ROLE_LABELS } from "@/lib/roles";

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return <div className="space-y-1"><div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</div><div className="text-sm font-medium">{value}</div></div>;
}

export default function Profile() {
  const { role, username } = useRole();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Hồ sơ cá nhân</h1><p className="text-sm text-muted-foreground">Người dùng có thể xem và cập nhật thông tin cá nhân không nhạy cảm.</p></div>
      <Card className="shadow-sm"><CardHeader className="flex flex-row items-center gap-4"><Avatar className="h-16 w-16"><AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">{username.split(" ").pop()?.[0] ?? "U"}</AvatarFallback></Avatar><div><CardTitle>{username}</CardTitle><div className="mt-2 flex gap-2"><Badge>{ROLE_LABELS[role]}</Badge><Badge variant="outline" className="gap-1"><BadgeCheck className="h-3 w-3" /> Đang hoạt động</Badge></div></div></CardHeader><Separator /><CardContent className="grid gap-6 p-6 md:grid-cols-2"><Field icon={UserCircle} label="Mã nhân viên" value="NV001" /><Field icon={Mail} label="Email" value="an.nguyen@company.vn" /><Field icon={Phone} label="Số điện thoại" value="0901 234 567" /><Field icon={Building2} label="Phòng ban" value="Phòng Kỹ thuật" /><Field label="Chức vụ" value="Kỹ sư phần mềm" /><Field label="Ngày sinh" value="12/04/1990" /><div className="md:col-span-2 rounded-lg border border-amber-300/60 bg-amber-50/60 p-4 text-sm dark:bg-amber-950/10"><div className="flex gap-2 font-medium"><ShieldAlert className="h-4 w-4" /> Lưu ý bảo mật</div><p className="mt-1 text-muted-foreground">Lương, phụ cấp và mã số thuế không được chỉnh sửa tại hồ sơ cá nhân. Các trường này chỉ được xử lý bởi vai trò có thẩm quyền.</p></div><div className="md:col-span-2 flex justify-end"><Button>Chỉnh sửa thông tin cá nhân</Button></div></CardContent></Card>
    </div>
  );
}
