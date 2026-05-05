import { useMemo, useState } from "react";
import { Search, Pencil, ShieldAlert, Wallet, TrendingUp, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SalaryRow = {
  id: string;
  name: string;
  department: string;
  position: string;
  salary: number;
  allowance: number;
  taxCode: string;
  updatedAt: string;
};

const INITIAL: SalaryRow[] = [
  { id: "NV001", name: "Nguyễn Văn An", department: "Kỹ thuật", position: "Kỹ sư phần mềm", salary: 25000000, allowance: 2000000, taxCode: "8123456789", updatedAt: "03/05/2026" },
  { id: "NV002", name: "Trần Thị Bình", department: "Nhân sự", position: "Chuyên viên HR", salary: 18000000, allowance: 1500000, taxCode: "8223456789", updatedAt: "02/05/2026" },
  { id: "NV003", name: "Lê Quốc Cường", department: "Tài chính", position: "Kế toán trưởng", salary: 32000000, allowance: 3000000, taxCode: "8323456789", updatedAt: "01/05/2026" },
  { id: "NV005", name: "Hoàng Minh Đức", department: "Kỹ thuật", position: "Trưởng phòng", salary: 35000000, allowance: 4000000, taxCode: "8523456789", updatedAt: "29/04/2026" },
];

const formatVND = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

export default function Salary() {
  const [rows, setRows] = useState(INITIAL);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<SalaryRow | null>(null);
  const [salary, setSalary] = useState(0);
  const [allowance, setAllowance] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q));
  }, [rows, query]);

  const totalPayroll = rows.reduce((s, r) => s + r.salary + r.allowance, 0);

  const openEdit = (row: SalaryRow) => {
    setEditing(row);
    setSalary(row.salary);
    setAllowance(row.allowance);
  };

  const save = () => {
    if (!editing) return;
    setRows((prev) => prev.map((r) => r.id === editing.id ? { ...r, salary, allowance, updatedAt: "04/05/2026" } : r));
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý lương và phụ cấp</h1>
          <p className="text-sm text-muted-foreground">Chỉ vai trò Giám đốc được phép cập nhật trường lương và phụ cấp.</p>
        </div>
        <Badge variant="outline" className="gap-1.5"><ShieldAlert className="h-3.5 w-3.5" /> Dữ liệu nhạy cảm</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Tổng quỹ lương</p><p className="mt-2 text-2xl font-bold">{formatVND(totalPayroll)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Số nhân viên</p><p className="mt-2 text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Cập nhật gần nhất</p><p className="mt-2 text-2xl font-bold">04/05/2026</p></CardContent></Card>
      </div>

      <Alert className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/10">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Kiểm soát truy cập</AlertTitle>
        <AlertDescription>Giao diện này mô phỏng luồng Director cập nhật lương/phụ cấp. Backend sẽ kiểm tra JWT, role và gọi stored procedure tương ứng.</AlertDescription>
      </Alert>

      <Card className="shadow-sm">
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-4 w-4" /> Danh sách lương</CardTitle>
          <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Tìm mã NV, họ tên, phòng ban..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Mã NV</TableHead><TableHead>Họ tên</TableHead><TableHead>Phòng ban</TableHead><TableHead className="text-right">Lương</TableHead><TableHead className="text-right">Phụ cấp</TableHead><TableHead>Mã số thuế</TableHead><TableHead>Cập nhật</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map((r) => <TableRow key={r.id}><TableCell className="font-mono font-medium">{r.id}</TableCell><TableCell><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.position}</div></TableCell><TableCell>{r.department}</TableCell><TableCell className="text-right font-medium">{formatVND(r.salary)}</TableCell><TableCell className="text-right">{formatVND(r.allowance)}</TableCell><TableCell className="font-mono">{r.taxCode}</TableCell><TableCell>{r.updatedAt}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /> Sửa</Button></TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cập nhật lương/phụ cấp</DialogTitle><DialogDescription>{editing?.id} - {editing?.name}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2"><div className="space-y-2"><Label>Lương</Label><Input type="number" value={salary} onChange={(e) => setSalary(Number(e.target.value))} /></div><div className="space-y-2"><Label>Phụ cấp</Label><Input type="number" value={allowance} onChange={(e) => setAllowance(Number(e.target.value))} /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button><Button onClick={save}><History className="h-4 w-4" /> Lưu thay đổi</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
