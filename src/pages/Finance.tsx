import { useMemo, useState } from "react";
import { Search, Banknote, LockKeyhole, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rows = [
  { id: "NV001", name: "Nguyễn Văn An", department: "Kỹ thuật", sameDept: false, salary: 25000000, allowance: 2000000, taxCode: "8123456789" },
  { id: "NV003", name: "Lê Quốc Cường", department: "Tài chính", sameDept: true, salary: 32000000, allowance: 3000000, taxCode: "8323456789" },
  { id: "NV007", name: "Đặng Quang Huy", department: "Tài chính", sameDept: true, salary: 21000000, allowance: 1600000, taxCode: "8723456789" },
  { id: "NV008", name: "Bùi Thị Lan", department: "Marketing", sameDept: false, salary: 20000000, allowance: 1300000, taxCode: "8823456789" },
];

const formatVND = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

export default function Finance() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => !q || r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Giao diện tài vụ</h1><p className="text-sm text-muted-foreground">Xem thông tin tài chính theo phạm vi quyền của nhân viên tài vụ.</p></div>
        <Button variant="outline"><Download className="h-4 w-4" /> Xuất báo cáo</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Bản ghi tài chính</p><p className="mt-2 text-2xl font-bold">{rows.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Cùng phòng tài vụ</p><p className="mt-2 text-2xl font-bold">{rows.filter(r => r.sameDept).length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Dữ liệu nhạy cảm</p><p className="mt-2 text-2xl font-bold">Đã kiểm soát</p></CardContent></Card></div>
      <Card className="shadow-sm"><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4" /> Thông tin tài chính nhân viên</CardTitle><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Tìm kiếm..." value={query} onChange={(e) => setQuery(e.target.value)} /></div></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Mã NV</TableHead><TableHead>Họ tên</TableHead><TableHead>Phòng ban</TableHead><TableHead className="text-right">Lương</TableHead><TableHead className="text-right">Phụ cấp</TableHead><TableHead>Mã số thuế</TableHead><TableHead>Phạm vi</TableHead></TableRow></TableHeader><TableBody>{filtered.map((r) => <TableRow key={r.id}><TableCell className="font-mono font-medium">{r.id}</TableCell><TableCell>{r.sameDept ? r.name : <span className="text-muted-foreground">Ẩn theo quyền</span>}</TableCell><TableCell>{r.department}</TableCell><TableCell className="text-right font-medium">{formatVND(r.salary)}</TableCell><TableCell className="text-right">{formatVND(r.allowance)}</TableCell><TableCell className="font-mono">{r.taxCode}</TableCell><TableCell>{r.sameDept ? <Badge>Đầy đủ cùng phòng</Badge> : <Badge variant="outline" className="gap-1"><LockKeyhole className="h-3 w-3" /> Giới hạn</Badge>}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  );
}
