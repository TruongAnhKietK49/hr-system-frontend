import { useMemo, useState } from "react";
import { Search, Eye, Pencil, Trash2, Plus, Filter, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Role } from "@/lib/roles";

type Status = "active" | "leave" | "inactive";

type Employee = {
  id: string;
  name: string;
  gender: "Nam" | "Nữ";
  dob: string;
  phone: string;
  department: string;
  position: string;
  status: Status;
  salary: number;
  allowance: number;
  taxCode: string;
};

const EMPLOYEES: Employee[] = [
  { id: "NV001", name: "Nguyễn Văn An", gender: "Nam", dob: "12/04/1990", phone: "0901 234 567", department: "Kỹ thuật", position: "Kỹ sư phần mềm", status: "active", salary: 25000000, allowance: 2000000, taxCode: "8123456789" },
  { id: "NV002", name: "Trần Thị Bình", gender: "Nữ", dob: "08/09/1992", phone: "0912 345 678", department: "Nhân sự", position: "Chuyên viên tuyển dụng", status: "active", salary: 18000000, allowance: 1500000, taxCode: "8223456789" },
  { id: "NV003", name: "Lê Quốc Cường", gender: "Nam", dob: "21/02/1988", phone: "0987 654 321", department: "Tài chính", position: "Kế toán trưởng", status: "leave", salary: 32000000, allowance: 3000000, taxCode: "8323456789" },
  { id: "NV004", name: "Phạm Thị Dung", gender: "Nữ", dob: "30/11/1995", phone: "0934 222 111", department: "Marketing", position: "Trưởng nhóm", status: "active", salary: 22000000, allowance: 1800000, taxCode: "8423456789" },
  { id: "NV005", name: "Hoàng Minh Đức", gender: "Nam", dob: "15/06/1985", phone: "0978 111 222", department: "Kỹ thuật", position: "Quản lý dự án", status: "active", salary: 35000000, allowance: 4000000, taxCode: "8523456789" },
  { id: "NV006", name: "Vũ Thị Hà", gender: "Nữ", dob: "03/03/1993", phone: "0945 555 666", department: "Nhân sự", position: "Chuyên viên C&B", status: "inactive", salary: 19000000, allowance: 1200000, taxCode: "8623456789" },
  { id: "NV007", name: "Đặng Quang Huy", gender: "Nam", dob: "27/07/1991", phone: "0967 333 444", department: "Tài chính", position: "Kế toán viên", status: "active", salary: 16000000, allowance: 1000000, taxCode: "8723456789" },
  { id: "NV008", name: "Bùi Thị Lan", gender: "Nữ", dob: "19/12/1994", phone: "0923 888 999", department: "Marketing", position: "Designer", status: "leave", salary: 17500000, allowance: 1300000, taxCode: "8823456789" },
];

const DEPARTMENTS = ["Kỹ thuật", "Nhân sự", "Tài chính", "Marketing"];
const POSITIONS = ["Kỹ sư phần mềm", "Chuyên viên tuyển dụng", "Kế toán trưởng", "Trưởng nhóm", "Quản lý dự án", "Chuyên viên C&B", "Kế toán viên", "Designer"];

const STATUS_META: Record<Status, { label: string; className: string }> = {
  active: { label: "Đang làm việc", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
  leave: { label: "Nghỉ phép", className: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200" },
  inactive: { label: "Đã nghỉ việc", className: "bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200" },
};

const SENSITIVE_ROLES: Role[] = ["director", "manager", "finance"];

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

export default function Employees() {
  const { role } = useRole();
  const canSeeSensitive = SENSITIVE_ROLES.includes(role);

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EMPLOYEES.filter((e) => {
      if (department !== "all" && e.department !== department) return false;
      if (position !== "all" && e.position !== position) return false;
      if (status !== "all" && e.status !== status) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q)
      );
    });
  }, [query, department, position, status]);

  const resetFilters = () => {
    setQuery("");
    setDepartment("all");
    setPosition("all");
    setStatus("all");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quản lý nhân viên</h1>
          <p className="text-sm text-muted-foreground">
            Tổng cộng <span className="font-medium text-foreground">{filtered.length}</span> nhân viên
            {canSeeSensitive && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Chế độ xem dữ liệu nhạy cảm
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Xuất Excel
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" /> Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm nhân viên (tên, mã NV, SĐT)"
              className="pl-9"
            />
          </div>

          <div className="md:col-span-2">
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue placeholder="Phòng ban" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger><SelectValue placeholder="Chức vụ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chức vụ</SelectItem>
                {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang làm việc</SelectItem>
                <SelectItem value="leave">Nghỉ phép</SelectItem>
                <SelectItem value="inactive">Đã nghỉ việc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1">
            <Button variant="outline" className="w-full" onClick={resetFilters}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="whitespace-nowrap">Mã NV</TableHead>
                <TableHead className="whitespace-nowrap">Họ tên</TableHead>
                <TableHead className="whitespace-nowrap">Giới tính</TableHead>
                <TableHead className="whitespace-nowrap">Ngày sinh</TableHead>
                <TableHead className="whitespace-nowrap">SĐT</TableHead>
                <TableHead className="whitespace-nowrap">Phòng ban</TableHead>
                <TableHead className="whitespace-nowrap">Chức vụ</TableHead>
                <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                {canSeeSensitive && (
                  <>
                    <TableHead className="whitespace-nowrap text-right">Lương</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Phụ cấp</TableHead>
                    <TableHead className="whitespace-nowrap">Mã số thuế</TableHead>
                  </>
                )}
                <TableHead className="whitespace-nowrap text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canSeeSensitive ? 12 : 9} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy nhân viên phù hợp
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((e) => {
                const meta = STATUS_META[e.status];
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium text-foreground">{e.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {e.name.split(" ").pop()?.[0]}
                        </div>
                        <span className="font-medium">{e.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{e.gender}</TableCell>
                    <TableCell className="whitespace-nowrap">{e.dob}</TableCell>
                    <TableCell className="whitespace-nowrap">{e.phone}</TableCell>
                    <TableCell>{e.department}</TableCell>
                    <TableCell>{e.position}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                    </TableCell>
                    {canSeeSensitive && (
                      <>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">{formatVND(e.salary)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">{formatVND(e.allowance)}</TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">{e.taxCode}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xem chi tiết</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Chỉnh sửa</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Tạo yêu cầu xóa</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
