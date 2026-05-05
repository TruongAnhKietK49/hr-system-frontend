import { useMemo, useState } from "react";
import { Search, ScrollText, ShieldCheck, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Action = "LOGIN" | "INSERT" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT";
const logs: { id: string; actor: string; action: Action; table: string; time: string; detail: string }[] = [
  { id: "LOG-1001", actor: "director", action: "UPDATE", table: "EmployeeSalaryResult", time: "04/05/2026 09:12", detail: "Cập nhật lương/phụ cấp cho NV001" },
  { id: "LOG-1002", actor: "hr.tran", action: "INSERT", table: "HR_Request", time: "04/05/2026 09:20", detail: "Tạo yêu cầu thêm nhân viên mới" },
  { id: "LOG-1003", actor: "director", action: "APPROVE", table: "HR_Request", time: "04/05/2026 10:04", detail: "Phê duyệt yêu cầu YC-2026-0012" },
  { id: "LOG-1004", actor: "finance.le", action: "LOGIN", table: "Account", time: "04/05/2026 10:30", detail: "Đăng nhập thành công" },
  { id: "LOG-1005", actor: "hr.manager", action: "DELETE", table: "Department", time: "04/05/2026 11:12", detail: "Thử xóa phòng ban còn nhân viên - bị từ chối" },
];

const actionClass: Record<Action, string> = {
  LOGIN: "bg-blue-100 text-blue-700 border-blue-200",
  INSERT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  UPDATE: "bg-amber-100 text-amber-700 border-amber-200",
  DELETE: "bg-rose-100 text-rose-700 border-rose-200",
  APPROVE: "bg-violet-100 text-violet-700 border-violet-200",
  REJECT: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function Audit() {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const filtered = useMemo(() => logs.filter((l) => {
    if (action !== "all" && l.action !== action) return false;
    const q = query.trim().toLowerCase();
    return !q || l.actor.toLowerCase().includes(q) || l.table.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.id.toLowerCase().includes(q);
  }), [query, action]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Nhật ký kiểm tra</h1><p className="text-sm text-muted-foreground">Theo dõi thao tác quan trọng để phục vụ giám sát và truy vết.</p></div>
      <div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Tổng log</p><p className="mt-2 text-2xl font-bold">{logs.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Thao tác cập nhật</p><p className="mt-2 text-2xl font-bold">{logs.filter(l => l.action === "UPDATE").length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Quyền xem</p><p className="mt-2 flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-5 w-5" /> HR Manager</p></CardContent></Card></div>
      <Card className="shadow-sm"><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="flex items-center gap-2 text-base"><ScrollText className="h-4 w-4" /> Danh sách log</CardTitle><div className="flex w-full gap-2 sm:w-auto"><div className="relative flex-1 sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Tìm actor, bảng, chi tiết..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><Select value={action} onValueChange={setAction}><SelectTrigger className="w-36"><Filter className="h-4 w-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả</SelectItem><SelectItem value="LOGIN">LOGIN</SelectItem><SelectItem value="INSERT">INSERT</SelectItem><SelectItem value="UPDATE">UPDATE</SelectItem><SelectItem value="DELETE">DELETE</SelectItem><SelectItem value="APPROVE">APPROVE</SelectItem></SelectContent></Select></div></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Log ID</TableHead><TableHead>Người thực hiện</TableHead><TableHead>Hành động</TableHead><TableHead>Bảng tác động</TableHead><TableHead>Thời gian</TableHead><TableHead>Chi tiết</TableHead></TableRow></TableHeader><TableBody>{filtered.map((l) => <TableRow key={l.id}><TableCell className="font-mono font-medium">{l.id}</TableCell><TableCell>{l.actor}</TableCell><TableCell><Badge variant="outline" className={actionClass[l.action]}>{l.action}</Badge></TableCell><TableCell className="font-mono text-xs">{l.table}</TableCell><TableCell>{l.time}</TableCell><TableCell>{l.detail}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  );
}
