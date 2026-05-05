import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  UserCog,
  Trash2,
  Search,
  Building2,
  Users,
  AlertTriangle,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Department = {
  id: string;
  code: string;
  name: string;
  manager: string | null;
  employeeCount: number;
  description?: string;
};

const MANAGER_CANDIDATES = [
  "Nguyễn Văn An",
  "Trần Thị Bình",
  "Lê Quốc Cường",
  "Phạm Thị Dung",
  "Hoàng Minh Đức",
  "Vũ Thị Hà",
  "Đặng Quang Huy",
  "Bùi Thị Lan",
];

const INITIAL: Department[] = [
  { id: "1", code: "KT", name: "Phòng Kỹ thuật", manager: "Hoàng Minh Đức", employeeCount: 24, description: "Phát triển và vận hành sản phẩm" },
  { id: "2", code: "NS", name: "Phòng Nhân sự", manager: "Trần Thị Bình", employeeCount: 6, description: "Tuyển dụng, đào tạo và C&B" },
  { id: "3", code: "TC", name: "Phòng Tài chính", manager: "Lê Quốc Cường", employeeCount: 8, description: "Kế toán, thuế, ngân quỹ" },
  { id: "4", code: "MKT", name: "Phòng Marketing", manager: "Phạm Thị Dung", employeeCount: 12, description: "Truyền thông và thương hiệu" },
  { id: "5", code: "VH", name: "Phòng Vận hành", manager: null, employeeCount: 0, description: "Phòng mới thành lập" },
];

const deptSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Mã phòng ban tối thiểu 2 ký tự")
    .max(10, "Mã phòng ban tối đa 10 ký tự")
    .regex(/^[A-Z0-9]+$/, "Chỉ dùng chữ in hoa và số (VD: KT, NS, MKT)"),
  name: z
    .string()
    .trim()
    .min(2, "Tên phòng ban tối thiểu 2 ký tự")
    .max(100, "Tên phòng ban tối đa 100 ký tự"),
  manager: z.string().optional(),
  description: z.string().trim().max(300, "Mô tả tối đa 300 ký tự").optional(),
});
type DeptForm = z.infer<typeof deptSchema>;

const assignSchema = z.object({
  manager: z.string().min(1, "Vui lòng chọn trưởng phòng"),
});
type AssignForm = z.infer<typeof assignSchema>;

const NONE = "__none__";

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>(INITIAL);
  const [query, setQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Department | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const form = useForm<DeptForm>({
    resolver: zodResolver(deptSchema),
    defaultValues: { code: "", name: "", manager: NONE, description: "" },
  });

  const assignForm = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
    defaultValues: { manager: "" },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        (d.manager?.toLowerCase().includes(q) ?? false),
    );
  }, [departments, query]);

  const totals = useMemo(
    () => ({
      depts: departments.length,
      employees: departments.reduce((s, d) => s + d.employeeCount, 0),
      vacant: departments.filter((d) => !d.manager).length,
    }),
    [departments],
  );

  const openCreate = () => {
    setEditing(null);
    form.reset({ code: "", name: "", manager: NONE, description: "" });
    setFormOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    form.reset({
      code: d.code,
      name: d.name,
      manager: d.manager ?? NONE,
      description: d.description ?? "",
    });
    setFormOpen(true);
  };

  const onSubmit = (data: DeptForm) => {
    const manager = data.manager && data.manager !== NONE ? data.manager : null;
    if (editing) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === editing.id ? { ...d, ...data, manager } : d)),
      );
      toast.success(`Đã cập nhật phòng ban ${data.name}`);
    } else {
      if (departments.some((d) => d.code.toLowerCase() === data.code.toLowerCase())) {
        form.setError("code", { message: "Mã phòng ban đã tồn tại" });
        return;
      }
      setDepartments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          code: data.code,
          name: data.name,
          manager,
          employeeCount: 0,
          description: data.description,
        },
      ]);
      toast.success(`Đã tạo phòng ban ${data.name}`);
    }
    setFormOpen(false);
  };

  const openAssign = (d: Department) => {
    setAssignTarget(d);
    assignForm.reset({ manager: d.manager ?? "" });
    setAssignOpen(true);
  };

  const onAssign = (data: AssignForm) => {
    if (!assignTarget) return;
    setDepartments((prev) =>
      prev.map((d) => (d.id === assignTarget.id ? { ...d, manager: data.manager } : d)),
    );
    toast.success(`Đã gán ${data.manager} làm trưởng phòng ${assignTarget.name}`);
    setAssignOpen(false);
  };

  const tryDelete = (d: Department) => {
    if (d.employeeCount > 0) {
      toast.error("Không thể xóa phòng ban", {
        description: `Phòng ${d.name} vẫn còn ${d.employeeCount} nhân viên. Vui lòng chuyển nhân viên trước khi xóa.`,
      });
      return;
    }
    setDeleteTarget(d);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setDepartments((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    toast.success(`Đã xóa phòng ban ${deleteTarget.name}`);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Quản lý phòng ban
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý cơ cấu tổ chức, trưởng phòng và phân bổ nhân sự.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Thêm phòng ban
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng phòng ban</p>
            <p className="text-xl font-semibold">{totals.depts}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng nhân viên</p>
            <p className="text-xl font-semibold">{totals.employees}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Chưa có trưởng phòng</p>
            <p className="text-xl font-semibold">{totals.vacant}</p>
          </div>
        </Card>
      </div>

      <Card className="p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo mã, tên phòng ban, trưởng phòng"
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="whitespace-nowrap">Mã phòng ban</TableHead>
                <TableHead className="whitespace-nowrap">Tên phòng ban</TableHead>
                <TableHead className="whitespace-nowrap">Trưởng phòng</TableHead>
                <TableHead className="whitespace-nowrap text-right">Số lượng nhân viên</TableHead>
                <TableHead className="whitespace-nowrap text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    Không tìm thấy phòng ban phù hợp
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs font-semibold">{d.code}</TableCell>
                  <TableCell>
                    <div className="font-medium">{d.name}</div>
                    {d.description && (
                      <div className="text-xs text-muted-foreground">{d.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {d.manager ? (
                      <span className="font-medium">{d.manager}</span>
                    ) : (
                      <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100">
                        Chưa gán
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Badge
                      variant="outline"
                      className={
                        d.employeeCount > 0
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {d.employeeCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(d)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Chỉnh sửa</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openAssign(d)}>
                              <UserCog className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Gán trưởng phòng</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => tryDelete(d)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Xóa phòng ban</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Chỉnh sửa phòng ban" : "Thêm phòng ban mới"}</DialogTitle>
            <DialogDescription>
              {editing ? "Cập nhật thông tin phòng ban hiện có." : "Điền thông tin để tạo một phòng ban mới."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form id="dept-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã phòng ban *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: KT, NS, MKT"
                        maxLength={10}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên phòng ban *</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Phòng Kỹ thuật" maxLength={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Trưởng phòng</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trưởng phòng" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NONE}>— Chưa gán —</SelectItem>
                        {MANAGER_CANDIDATES.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea rows={3} maxLength={300} placeholder="Mô tả ngắn về phòng ban" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button type="submit" form="dept-form">
              {editing ? "Lưu thay đổi" : "Tạo phòng ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign manager dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gán trưởng phòng</DialogTitle>
            <DialogDescription>
              {assignTarget && (
                <>Chọn trưởng phòng cho <span className="font-medium text-foreground">{assignTarget.name}</span>.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form id="assign-form" onSubmit={assignForm.handleSubmit(onAssign)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trưởng phòng *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhân sự" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MANAGER_CANDIDATES.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>Hủy</Button>
            <Button type="submit" form="assign-form">Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phòng ban</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa phòng ban{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
