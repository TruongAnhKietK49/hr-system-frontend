import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Eye,
  Check,
  X,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Search,
  ShieldAlert,
  Clock,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type RequestType = "add" | "delete";
type RequestStatus = "pending" | "approved" | "rejected";

type AddPayload = {
  name: string;
  gender: string;
  dob: string;
  phone: string;
  department: string;
  position: string;
  note?: string;
};

type DeletePayload = {
  employeeId: string;
  employeeName: string;
  department: string;
  reason: string;
};

type HRRequest = {
  id: string;
  type: RequestType;
  createdBy: string;
  createdAt: string;
  status: RequestStatus;
  add?: AddPayload;
  remove?: DeletePayload;
};

const INITIAL_REQUESTS: HRRequest[] = [
  {
    id: "YC-2026-0012",
    type: "add",
    createdBy: "Trần Thị Bình (HR)",
    createdAt: "02/05/2026 09:14",
    status: "pending",
    add: {
      name: "Phạm Hoàng Nam",
      gender: "Nam",
      dob: "18/07/1996",
      phone: "0905 112 233",
      department: "Kỹ thuật",
      position: "Kỹ sư phần mềm",
      note: "Ứng viên đã ký offer ngày 28/04/2026.",
    },
  },
  {
    id: "YC-2026-0013",
    type: "delete",
    createdBy: "Trần Thị Bình (HR)",
    createdAt: "02/05/2026 10:02",
    status: "pending",
    remove: {
      employeeId: "NV006",
      employeeName: "Vũ Thị Hà",
      department: "Nhân sự",
      reason: "Nhân viên đã nộp đơn nghỉ việc, hoàn tất bàn giao ngày 30/04/2026.",
    },
  },
  {
    id: "YC-2026-0014",
    type: "add",
    createdBy: "Nguyễn Thị Mai (HR)",
    createdAt: "03/05/2026 08:45",
    status: "pending",
    add: {
      name: "Lý Thu Trang",
      gender: "Nữ",
      dob: "22/11/1998",
      phone: "0934 556 778",
      department: "Marketing",
      position: "Designer",
    },
  },
  {
    id: "YC-2026-0010",
    type: "add",
    createdBy: "Trần Thị Bình (HR)",
    createdAt: "30/04/2026 14:21",
    status: "approved",
    add: {
      name: "Đỗ Quang Vinh",
      gender: "Nam",
      dob: "05/02/1993",
      phone: "0978 222 333",
      department: "Tài chính",
      position: "Kế toán viên",
    },
  },
  {
    id: "YC-2026-0009",
    type: "delete",
    createdBy: "Nguyễn Thị Mai (HR)",
    createdAt: "29/04/2026 16:08",
    status: "rejected",
    remove: {
      employeeId: "NV003",
      employeeName: "Lê Quốc Cường",
      department: "Tài chính",
      reason: "Đề xuất chấm dứt hợp đồng do hiệu suất.",
    },
  },
];

const TYPE_META: Record<RequestType, { label: string; icon: typeof UserPlus; className: string }> = {
  add: { label: "Thêm nhân viên", icon: UserPlus, className: "bg-blue-100 text-blue-700 border-blue-200" },
  delete: { label: "Xóa nhân viên", icon: UserMinus, className: "bg-rose-100 text-rose-700 border-rose-200" },
};

const STATUS_META: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100" },
  approved: { label: "Đã phê duyệt", className: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  rejected: { label: "Đã từ chối", className: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100" },
};

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

// ---- Approval form schema (only for add) ----
const approveAddSchema = z.object({
  salary: z
    .coerce.number({ invalid_type_error: "Lương phải là số" })
    .int("Lương phải là số nguyên")
    .min(1_000_000, "Lương tối thiểu 1.000.000 ₫")
    .max(1_000_000_000, "Lương tối đa 1.000.000.000 ₫"),
  allowance: z
    .coerce.number({ invalid_type_error: "Phụ cấp phải là số" })
    .int("Phụ cấp phải là số nguyên")
    .min(0, "Phụ cấp không được âm")
    .max(500_000_000, "Phụ cấp quá lớn"),
  note: z.string().trim().max(500, "Ghi chú không vượt quá 500 ký tự").optional(),
});
type ApproveAddForm = z.infer<typeof approveAddSchema>;

function FieldRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`col-span-2 text-sm text-foreground ${mono ? "font-mono" : "font-medium"}`}>{value}</div>
    </div>
  );
}

export default function Approvals() {
  const [requests, setRequests] = useState<HRRequest[]>(INITIAL_REQUESTS);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const [selected, setSelected] = useState<HRRequest | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const form = useForm<ApproveAddForm>({
    resolver: zodResolver(approveAddSchema),
    defaultValues: { salary: undefined as unknown as number, allowance: 0, note: "" },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      const target = r.type === "add" ? r.add?.name : r.remove?.employeeName;
      return (
        r.id.toLowerCase().includes(q) ||
        r.createdBy.toLowerCase().includes(q) ||
        (target?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [requests, query, typeFilter, statusFilter]);

  const openDetail = (r: HRRequest) => {
    setSelected(r);
    form.reset({ salary: undefined as unknown as number, allowance: 0, note: "" });
  };
  const closeDetail = () => setSelected(null);

  const updateStatus = (id: string, status: RequestStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleApprove = (data?: ApproveAddForm) => {
    if (!selected) return;
    if (selected.type === "add") {
      toast.success(`Đã phê duyệt yêu cầu ${selected.id}`, {
        description: `Lương: ${formatVND(data!.salary)} · Phụ cấp: ${formatVND(data!.allowance)}`,
      });
    } else {
      toast.success(`Đã phê duyệt yêu cầu ${selected.id}`);
    }
    updateStatus(selected.id, "approved");
    closeDetail();
  };

  const handleReject = () => {
    if (!selected) return;
    if (rejectReason.trim().length < 5) {
      toast.error("Vui lòng nhập lý do từ chối (ít nhất 5 ký tự)");
      return;
    }
    toast.success(`Đã từ chối yêu cầu ${selected.id}`);
    updateStatus(selected.id, "rejected");
    setRejectOpen(false);
    setRejectReason("");
    closeDetail();
  };

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Phê duyệt yêu cầu</h1>
          <p className="text-sm text-muted-foreground">
            Xem và phê duyệt các yêu cầu nhân sự do bộ phận HR gửi lên.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={STATUS_META.pending.className}>
            <Clock className="h-3 w-3" /> {counts.pending} chờ duyệt
          </Badge>
          <Badge variant="outline" className={STATUS_META.approved.className}>
            {counts.approved} đã duyệt
          </Badge>
          <Badge variant="outline" className={STATUS_META.rejected.className}>
            {counts.rejected} đã từ chối
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo mã yêu cầu, người tạo, nhân viên liên quan"
              className="pl-9"
            />
          </div>
          <div className="md:col-span-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Loại yêu cầu" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="add">Thêm nhân viên</SelectItem>
                <SelectItem value="delete">Xóa nhân viên</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã phê duyệt</SelectItem>
                <SelectItem value="rejected">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className="md:col-span-1"
            onClick={() => {
              setQuery("");
              setTypeFilter("all");
              setStatusFilter("pending");
            }}
          >
            Đặt lại
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="whitespace-nowrap">Mã yêu cầu</TableHead>
                <TableHead className="whitespace-nowrap">Loại yêu cầu</TableHead>
                <TableHead className="whitespace-nowrap">Người tạo</TableHead>
                <TableHead className="whitespace-nowrap">Nhân viên liên quan</TableHead>
                <TableHead className="whitespace-nowrap">Ngày tạo</TableHead>
                <TableHead className="whitespace-nowrap">Trạng thái</TableHead>
                <TableHead className="whitespace-nowrap text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    Không có yêu cầu phù hợp
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => {
                const tMeta = TYPE_META[r.type];
                const sMeta = STATUS_META[r.status];
                const TIcon = tMeta.icon;
                const target =
                  r.type === "add"
                    ? r.add?.name
                    : `${r.remove?.employeeId} - ${r.remove?.employeeName}`;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs font-medium">{r.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tMeta.className}>
                        <TIcon className="h-3 w-3" /> {tMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{r.createdBy}</TableCell>
                    <TableCell className="whitespace-nowrap">{target}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{r.createdAt}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={sMeta.className}>{sMeta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openDetail(r)}>
                        <Eye className="h-4 w-4" /> Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && closeDetail()}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={TYPE_META[selected.type].className}>
                    {TYPE_META[selected.type].label}
                  </Badge>
                  <Badge variant="outline" className={STATUS_META[selected.status].className}>
                    {STATUS_META[selected.status].label}
                  </Badge>
                </div>
                <DialogTitle className="mt-2 font-mono text-base">{selected.id}</DialogTitle>
                <DialogDescription>
                  Tạo bởi {selected.createdBy} · {selected.createdAt}
                </DialogDescription>
              </DialogHeader>

              <Separator />

              <div className="max-h-[55vh] overflow-y-auto pr-1">
                {/* Submitted info */}
                <h3 className="mb-2 text-sm font-semibold text-foreground">Thông tin gửi lên</h3>
                <div className="rounded-lg border bg-muted/30 p-4">
                  {selected.type === "add" && selected.add && (
                    <div className="divide-y">
                      <FieldRow label="Họ tên" value={selected.add.name} />
                      <FieldRow label="Giới tính" value={selected.add.gender} />
                      <FieldRow label="Ngày sinh" value={selected.add.dob} />
                      <FieldRow label="Số điện thoại" value={selected.add.phone} />
                      <FieldRow label="Phòng ban" value={selected.add.department} />
                      <FieldRow label="Chức vụ" value={selected.add.position} />
                      {selected.add.note && <FieldRow label="Ghi chú" value={selected.add.note} />}
                    </div>
                  )}
                  {selected.type === "delete" && selected.remove && (
                    <div className="divide-y">
                      <FieldRow label="Mã NV" value={selected.remove.employeeId} mono />
                      <FieldRow label="Họ tên" value={selected.remove.employeeName} />
                      <FieldRow label="Phòng ban" value={selected.remove.department} />
                      <FieldRow label="Lý do" value={selected.remove.reason} />
                    </div>
                  )}
                </div>

                {/* Salary form for add + pending */}
                {selected.type === "add" && selected.status === "pending" && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Thông tin tài chính (Giám đốc nhập)
                      </h3>
                      <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
                        <ShieldAlert className="h-3 w-3" /> Nhạy cảm
                      </Badge>
                    </div>
                    <Form {...form}>
                      <form
                        id="approve-form"
                        onSubmit={form.handleSubmit(handleApprove)}
                        className="grid gap-4 rounded-lg border border-amber-300/60 bg-amber-50/40 p-4 sm:grid-cols-2"
                      >
                        <FormField
                          control={form.control}
                          name="salary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lương (VND) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  placeholder="VD: 20000000"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="allowance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phụ cấp (VND) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  placeholder="VD: 2000000"
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="note"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Ghi chú phê duyệt</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={3}
                                  maxLength={500}
                                  placeholder="Ghi chú nội bộ (không bắt buộc)"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>Tối đa 500 ký tự.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="ghost" onClick={closeDetail}>
                  <ArrowLeft className="h-4 w-4" /> Quay lại
                </Button>
                {selected.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setRejectOpen(true)}
                    >
                      <X className="h-4 w-4" /> Từ chối
                    </Button>
                    {selected.type === "add" ? (
                      <Button type="submit" form="approve-form">
                        <Check className="h-4 w-4" /> Phê duyệt
                      </Button>
                    ) : (
                      <Button onClick={() => handleApprove()}>
                        <Check className="h-4 w-4" /> Phê duyệt
                      </Button>
                    )}
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject reason dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối. Lý do sẽ được gửi tới người tạo yêu cầu.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            maxLength={500}
            placeholder="Nhập lý do từ chối (tối thiểu 5 ký tự)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject}>
              <X className="h-4 w-4" /> Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
