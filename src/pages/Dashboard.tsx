import { Users, Building2, FileText, ScrollText, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/context/RoleContext";
import { ROLE_LABELS } from "@/lib/roles";

const stats = [
  {
    label: "Tổng nhân viên",
    value: "1.248",
    delta: "+24 tháng này",
    icon: Users,
    tint: "from-blue-500/15 to-blue-500/5",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  {
    label: "Tổng phòng ban",
    value: "32",
    delta: "+2 quý này",
    icon: Building2,
    tint: "from-emerald-500/15 to-emerald-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  {
    label: "Yêu cầu chờ duyệt",
    value: "57",
    delta: "12 ưu tiên cao",
    icon: FileText,
    tint: "from-amber-500/15 to-amber-500/5",
    iconBg: "bg-amber-500/10 text-amber-600",
  },
  {
    label: "Nhật ký gần đây",
    value: "342",
    delta: "Cập nhật 5 phút trước",
    icon: ScrollText,
    tint: "from-violet-500/15 to-violet-500/5",
    iconBg: "bg-violet-500/10 text-violet-600",
  },
];

const recentLogs = [
  { user: "admin", action: "Cập nhật lương nhân viên #1042", time: "2 phút trước", level: "info" },
  { user: "hr.mai", action: "Thêm nhân viên mới: Trần Thị B", time: "18 phút trước", level: "success" },
  { user: "manager.hung", action: "Phê duyệt yêu cầu nghỉ phép #88", time: "1 giờ trước", level: "success" },
  { user: "finance.lan", action: "Xuất báo cáo lương tháng 04", time: "3 giờ trước", level: "info" },
  { user: "admin", action: "Đăng nhập thất bại từ IP 10.0.0.21", time: "5 giờ trước", level: "warn" },
];

const pendingRequests = [
  { id: "REQ-201", type: "Nghỉ phép", from: "Lê Văn C", dept: "Kỹ thuật", priority: "Cao" },
  { id: "REQ-202", type: "Tăng lương", from: "Phạm Thị D", dept: "Marketing", priority: "Thường" },
  { id: "REQ-203", type: "Chuyển phòng ban", from: "Hoàng Văn E", dept: "Vận hành", priority: "Cao" },
  { id: "REQ-204", type: "Nghỉ phép", from: "Vũ Thị F", dept: "Nhân sự", priority: "Thấp" },
];

const levelStyle: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-700 border-amber-500/20",
};

const priorityStyle: Record<string, string> = {
  Cao: "bg-destructive/10 text-destructive border-destructive/20",
  Thường: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Thấp: "bg-muted text-muted-foreground border-border",
};

export default function Dashboard() {
  const { role, username } = useRole();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Xin chào, {username} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Bạn đang đăng nhập với vai trò <span className="font-medium text-foreground">{ROLE_LABELS[role]}</span>.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5">
          <TrendingUp className="h-3 w-3" />
          Hệ thống hoạt động bình thường
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className={`relative overflow-hidden border-border rounded-2xl bg-gradient-to-br ${s.tint}`}
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {s.label}
                  </p>
                  <p className="text-3xl font-bold mt-2 text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    {s.delta}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending requests */}
        <Card className="lg:col-span-2 rounded-2xl border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Yêu cầu chờ xử lý</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Các yêu cầu nhân sự cần phê duyệt</p>
            </div>
            <Badge variant="secondary">{pendingRequests.length} yêu cầu</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pendingRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                      <span className="text-sm font-medium truncate">{r.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {r.from} · {r.dept}
                    </p>
                  </div>
                  <Badge variant="outline" className={priorityStyle[r.priority]}>
                    {r.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audit logs */}
        <Card className="rounded-2xl border-border" style={{ boxShadow: "var(--shadow-soft)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nhật ký gần đây</CardTitle>
            <p className="text-xs text-muted-foreground">Hoạt động kiểm tra hệ thống</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLogs.map((l, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    l.level === "warn"
                      ? "bg-amber-500"
                      : l.level === "success"
                      ? "bg-emerald-500"
                      : "bg-blue-500"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug truncate">{l.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {l.user}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{l.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
