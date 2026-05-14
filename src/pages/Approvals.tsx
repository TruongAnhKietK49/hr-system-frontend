import { useMemo, useState, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FilePenLine,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  UserMinus,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { approvalService } from "@/services/approvalService";
import {
  ApproveCreateEmployeePayload,
  ParsedApprovalPayload,
  PendingApproval,
} from "@/types/approval";
import {
  CreateEmployeePayload,
  DeleteEmployeePayload,
  UpdateEmployeePayload,
} from "@/types/hrRequest";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type ApprovalAction = "approve" | "reject";

type SalaryFormState = {
  baseSalary: string;
  salaryCoefficient: string;
  positionCoefficient: string;
  allowance: string;
  formulaVersion: string;
};

const INITIAL_SALARY_FORM: SalaryFormState = {
  baseSalary: "",
  salaryCoefficient: "1",
  positionCoefficient: "1",
  allowance: "0",
  formulaVersion: "v1",
};

const POSITION_LABELS: Record<number, string> = {
  1: "Nhân viên",
  2: "Trưởng phòng",
  3: "Giám đốc",
};

function getPositionLabel(positionId?: number | string | null) {
  if (positionId === undefined || positionId === null || positionId === "") {
    return "—";
  }

  const numericPositionId = Number(positionId);

  return POSITION_LABELS[numericPositionId] ?? `Position #${positionId}`;
}

function getUpdateFieldLabel(key: string) {
  const labels: Record<string, string> = {
    employeeId: "Mã nhân viên",
    fullName: "Họ tên",
    gender: "Giới tính",
    dateOfBirth: "Ngày sinh",
    phoneNumber: "Số điện thoại",
    departmentId: "Phòng ban",
    positionId: "Vị trí công việc",
    employmentStatus: "Trạng thái làm việc",
    isActive: "Tình trạng tài khoản",
  };

  return labels[key] ?? key;
}

function getUpdateFieldValue(key: string, value: unknown) {
  if (key === "positionId") {
    return getPositionLabel(value as number | string);
  }

  if (key === "isActive") {
    return value ? "Đang hoạt động" : "Vô hiệu hóa";
  }

  return String(value);
}

const REQUEST_TYPE_META = {
  CREATE_EMPLOYEE: {
    label: "Thêm nhân viên",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300",
    icon: UserPlus,
  },
  UPDATE_EMPLOYEE: {
    label: "Cập nhật nhân viên",
    badgeClass:
      "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300",
    icon: FilePenLine,
  },
  DELETE_EMPLOYEE: {
    label: "Xóa nhân viên",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    icon: UserMinus,
  },
} as const;

function parseRequestPayload(request: PendingApproval): ParsedApprovalPayload {
  try {
    return JSON.parse(request.RequestPayload) as ParsedApprovalPayload;
  } catch {
    return {} as ParsedApprovalPayload;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "—";
  }

  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm");
  } catch {
    return value;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function getEmployeeDisplayName(request: PendingApproval) {
  const payload = parseRequestPayload(request);

  if (request.RequestType === "CREATE_EMPLOYEE") {
    return (payload as CreateEmployeePayload).fullName || "Nhân viên mới";
  }

  if (request.RequestType === "UPDATE_EMPLOYEE") {
    return (payload as UpdateEmployeePayload).employeeId || "Nhân viên";
  }

  return (payload as DeleteEmployeePayload).employeeId || "Nhân viên";
}

function getRequestDescription(request: PendingApproval) {
  const payload = parseRequestPayload(request);

  if (request.RequestType === "CREATE_EMPLOYEE") {
    const createPayload = payload as CreateEmployeePayload;

    return [
      createPayload.fullName,
      createPayload.departmentId,
      createPayload.role,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  if (request.RequestType === "UPDATE_EMPLOYEE") {
    const updatePayload = payload as UpdateEmployeePayload;
    const updatedFields = Object.keys(updatePayload).filter(
      (key) => key !== "employeeId",
    );

    return `Cập nhật ${updatedFields.length} trường thông tin`;
  }

  const deletePayload = payload as DeleteEmployeePayload;
  return deletePayload.reason || "Yêu cầu vô hiệu hóa nhân viên";
}

function buildSalaryApprovalPayload(
  form: SalaryFormState,
): ApproveCreateEmployeePayload {
  return {
    baseSalary: Number(form.baseSalary),
    salaryCoefficient: Number(form.salaryCoefficient),
    positionCoefficient: Number(form.positionCoefficient),
    allowance: Number(form.allowance),
    formulaVersion: form.formulaVersion || "v1",
  };
}

function validateSalaryForm(form: SalaryFormState) {
  const payload = buildSalaryApprovalPayload(form);

  if (!payload.baseSalary || payload.baseSalary <= 0) {
    return "Lương cơ bản phải lớn hơn 0.";
  }

  if (!payload.salaryCoefficient || payload.salaryCoefficient <= 0) {
    return "Hệ số lương phải lớn hơn 0.";
  }

  if (!payload.positionCoefficient || payload.positionCoefficient <= 0) {
    return "Hệ số chức vụ phải lớn hơn 0.";
  }

  if (payload.allowance < 0) {
    return "Phụ cấp không được nhỏ hơn 0.";
  }

  return null;
}

function DialogScrollableBody({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-1 pr-3">
      <div className="space-y-4 pb-2">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value === undefined || value === null || value === ""
          ? "—"
          : String(value)}
      </p>
    </div>
  );
}

function PayloadDetails({ request }: { request: PendingApproval }) {
  const payload = parseRequestPayload(request);

  if (request.RequestType === "CREATE_EMPLOYEE") {
    const data = payload as CreateEmployeePayload;

    return (
      <div className="grid gap-3 md:grid-cols-2">
        <DetailRow label="Họ tên" value={data.fullName} />
        <DetailRow label="Giới tính" value={data.gender} />
        <DetailRow label="Ngày sinh" value={data.dateOfBirth} />
        <DetailRow label="Số điện thoại" value={data.phoneNumber} />
        <DetailRow label="Mã số thuế" value={data.taxId} />
        <DetailRow label="Phòng ban" value={data.departmentId} />
        <DetailRow
          label="Vị trí công việc"
          value={getPositionLabel(data.positionId)}
        />
        <DetailRow label="Quyền truy cập" value={data.role} />
        <DetailRow label="Username" value={data.username} />
        <DetailRow label="Password" value="Đã được ẩn" />
      </div>
    );
  }

  if (request.RequestType === "UPDATE_EMPLOYEE") {
    const data = payload as UpdateEmployeePayload;
    const entries = Object.entries(data).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    );

    return (
      <div className="space-y-4">
        <Alert className="border-blue-500/30 bg-blue-500/5">
          <FilePenLine className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-sm">
            Chỉ các trường bên dưới sẽ được cập nhật
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Các field không xuất hiện trong request sẽ được giữ nguyên ở
            backend.
          </AlertDescription>
        </Alert>

        {entries.map(([key, value]) => (
          <DetailRow
            key={key}
            label={getUpdateFieldLabel(key)}
            value={getUpdateFieldValue(key, value)}
          />
        ))}
      </div>
    );
  }

  const data = payload as DeleteEmployeePayload;

  return (
    <div className="space-y-4">
      <Alert className="border-destructive/30 bg-destructive/5">
        <ShieldAlert className="h-4 w-4 text-destructive" />
        <AlertTitle className="text-sm">Yêu cầu xóa nhân viên</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Backend xử lý theo hướng soft delete: vô hiệu hóa nhân viên và tài
          khoản, không xóa vật lý dữ liệu.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 md:grid-cols-2">
        <DetailRow label="Mã nhân viên" value={data.employeeId} />
        <DetailRow label="Lý do" value={data.reason} />
      </div>
    </div>
  );
}

export default function Approvals() {
  const queryClient = useQueryClient();

  const [selectedRequest, setSelectedRequest] =
    useState<PendingApproval | null>(null);
  const [action, setAction] = useState<ApprovalAction | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [salaryForm, setSalaryForm] =
    useState<SalaryFormState>(INITIAL_SALARY_FORM);

  const pendingQuery = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: approvalService.getPending,
  });

  const approveMutation = useMutation({
    mutationFn: ({
      request,
      payload,
    }: {
      request: PendingApproval;
      payload?: ApproveCreateEmployeePayload;
    }) =>
      approvalService.approve(request.RequestID, payload).then((result) => ({
        request,
        result,
      })),

    onSuccess: ({ request, result }) => {
      const employeeId = result?.EmployeeID
        ? ` · Nhân viên: ${result.EmployeeID}`
        : "";

      toast.success("Đã duyệt yêu cầu", {
        description: `Request #${request.RequestID} đã được phê duyệt${employeeId}.`,
      });

      closeActionDialog();
      queryClient.invalidateQueries({ queryKey: ["approvals", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["hr-requests"] });
    },

    onError: (error) => {
      toast.error("Không thể duyệt yêu cầu", {
        description: getApiErrorMessage(
          error,
          "Có lỗi xảy ra khi duyệt yêu cầu.",
        ),
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      request,
      rejectionReason,
    }: {
      request: PendingApproval;
      rejectionReason: string;
    }) =>
      approvalService
        .reject(request.RequestID, {
          rejectionReason,
        })
        .then((result) => ({
          request,
          result,
        })),

    onSuccess: ({ request }) => {
      toast.success("Đã từ chối yêu cầu", {
        description: `Request #${request.RequestID} đã bị từ chối.`,
      });

      closeActionDialog();
      queryClient.invalidateQueries({ queryKey: ["approvals", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["hr-requests"] });
    },

    onError: (error) => {
      toast.error("Không thể từ chối yêu cầu", {
        description: getApiErrorMessage(
          error,
          "Có lỗi xảy ra khi từ chối yêu cầu.",
        ),
      });
    },
  });

  const groupedRequests = useMemo(() => {
    const requests = pendingQuery.data ?? [];

    return {
      all: requests,
      create: requests.filter(
        (request) => request.RequestType === "CREATE_EMPLOYEE",
      ),
      update: requests.filter(
        (request) => request.RequestType === "UPDATE_EMPLOYEE",
      ),
      delete: requests.filter(
        (request) => request.RequestType === "DELETE_EMPLOYEE",
      ),
    };
  }, [pendingQuery.data]);

  const isSubmitting = approveMutation.isPending || rejectMutation.isPending;

  const openApproveDialog = (request: PendingApproval) => {
    setSelectedRequest(request);
    setAction("approve");
    setRejectReason("");
    setSalaryForm(INITIAL_SALARY_FORM);
  };

  const openRejectDialog = (request: PendingApproval) => {
    setSelectedRequest(request);
    setAction("reject");
    setRejectReason("");
    setSalaryForm(INITIAL_SALARY_FORM);
  };

  const closeActionDialog = () => {
    setSelectedRequest(null);
    setAction(null);
    setRejectReason("");
    setSalaryForm(INITIAL_SALARY_FORM);
  };

  const handleApprove = () => {
    if (!selectedRequest) {
      return;
    }

    if (selectedRequest.RequestType === "CREATE_EMPLOYEE") {
      const errorMessage = validateSalaryForm(salaryForm);

      if (errorMessage) {
        toast.error("Thông tin lương chưa hợp lệ", {
          description: errorMessage,
        });
        return;
      }

      approveMutation.mutate({
        request: selectedRequest,
        payload: buildSalaryApprovalPayload(salaryForm),
      });

      return;
    }

    approveMutation.mutate({
      request: selectedRequest,
    });
  };

  const handleReject = () => {
    if (!selectedRequest) {
      return;
    }

    const trimmedReason = rejectReason.trim();

    if (trimmedReason.length < 5) {
      toast.error("Lý do từ chối chưa hợp lệ", {
        description: "Vui lòng nhập lý do từ chối ít nhất 5 ký tự.",
      });
      return;
    }

    rejectMutation.mutate({
      request: selectedRequest,
      rejectionReason: trimmedReason,
    });
  };

  const renderRequestCard = (request: PendingApproval) => {
    const meta = REQUEST_TYPE_META[request.RequestType];
    const Icon = meta.icon;

    return (
      <Card key={request.RequestID} className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("gap-1", meta.badgeClass)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </Badge>

                <Badge variant="outline" className="gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  PENDING
                </Badge>

                <span className="text-xs text-muted-foreground">
                  #{request.RequestID}
                </span>
              </div>

              <div>
                <h3 className="truncate text-base font-semibold text-foreground">
                  {getEmployeeDisplayName(request)}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getRequestDescription(request)}
                </p>
              </div>

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                <span>
                  Người tạo: {request.RequesterName || request.RequesterID}
                </span>
                <span>Ngày tạo: {formatDateTime(request.CreatedAt)}</span>
                <span>Trạng thái: {request.Status}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(request)}
              >
                <Eye className="h-4 w-4" />
                Chi tiết
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openRejectDialog(request)}
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </Button>

              <Button size="sm" onClick={() => openApproveDialog(request)}>
                <CheckCircle2 className="h-4 w-4" />
                Duyệt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRequestList = (items: PendingApproval[]) => {
    if (pendingQuery.isLoading) {
      return (
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải danh sách yêu cầu...
          </div>
        </div>
      );
    }

    if (pendingQuery.isError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Không thể tải danh sách yêu cầu</AlertTitle>
          <AlertDescription>
            {getApiErrorMessage(
              pendingQuery.error,
              "Có lỗi xảy ra khi tải danh sách yêu cầu cần duyệt.",
            )}
          </AlertDescription>
        </Alert>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
          <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">
            Không có yêu cầu đang chờ duyệt
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Khi HR tạo yêu cầu thêm, cập nhật hoặc xóa nhân viên, chúng sẽ xuất
            hiện tại đây.
          </p>
        </div>
      );
    }

    return <div className="space-y-3">{items.map(renderRequestCard)}</div>;
  };

  const isDetailDialogOpen = Boolean(selectedRequest && !action);
  const isActionDialogOpen = Boolean(selectedRequest && action);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Phê duyệt yêu cầu nhân sự
          </h1>
          <p className="text-sm text-muted-foreground">
            Director xem và xử lý các yêu cầu thêm, cập nhật hoặc xóa nhân viên.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => pendingQuery.refetch()}
          disabled={pendingQuery.isFetching}
        >
          {pendingQuery.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Tổng pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {groupedRequests.all.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Thêm nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {groupedRequests.create.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Cập nhật
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {groupedRequests.update.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Xóa nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {groupedRequests.delete.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Tất cả ({groupedRequests.all.length})
          </TabsTrigger>
          <TabsTrigger value="create">
            Thêm ({groupedRequests.create.length})
          </TabsTrigger>
          <TabsTrigger value="update">
            Cập nhật ({groupedRequests.update.length})
          </TabsTrigger>
          <TabsTrigger value="delete">
            Xóa ({groupedRequests.delete.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderRequestList(groupedRequests.all)}
        </TabsContent>

        <TabsContent value="create">
          {renderRequestList(groupedRequests.create)}
        </TabsContent>

        <TabsContent value="update">
          {renderRequestList(groupedRequests.update)}
        </TabsContent>

        <TabsContent value="delete">
          {renderRequestList(groupedRequests.delete)}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailDialogOpen} onOpenChange={closeActionDialog}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Chi tiết yêu cầu #{selectedRequest.RequestID}
                </DialogTitle>
                <DialogDescription>
                  {REQUEST_TYPE_META[selectedRequest.RequestType].label} · Tạo
                  lúc {formatDateTime(selectedRequest.CreatedAt)}
                </DialogDescription>
              </DialogHeader>

              <DialogScrollableBody>
                <PayloadDetails request={selectedRequest} />
              </DialogScrollableBody>

              <DialogFooter className="shrink-0 border-t border-border pt-4">
                <Button variant="outline" onClick={closeActionDialog}>
                  Đóng
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openRejectDialog(selectedRequest)}
                >
                  <XCircle className="h-4 w-4" />
                  Từ chối
                </Button>
                <Button onClick={() => openApproveDialog(selectedRequest)}>
                  <CheckCircle2 className="h-4 w-4" />
                  Duyệt
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isActionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeActionDialog();
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
          {selectedRequest && action === "approve" && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Duyệt yêu cầu #{selectedRequest.RequestID}
                </DialogTitle>
                <DialogDescription>
                  {REQUEST_TYPE_META[selectedRequest.RequestType].label}
                </DialogDescription>
              </DialogHeader>

              <DialogScrollableBody>
                {selectedRequest.RequestType === "CREATE_EMPLOYEE" && (
                  <>
                    <Alert className="border-primary/30 bg-primary/5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertTitle className="text-sm">
                        Nhập thông tin lương
                      </AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground">
                        Request thêm nhân viên cần thông tin lương để backend
                        tạo cấu hình lương ban đầu.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-x-6 gap-y-5 lg:grid-cols-2">
                      <div className="min-w-0 space-y-2">
                        <Label htmlFor="baseSalary">Lương cơ bản *</Label>
                        <Input
                          id="baseSalary"
                          type="number"
                          min={0}
                          placeholder="VD: 12000000"
                          value={salaryForm.baseSalary}
                          onChange={(event) =>
                            setSalaryForm((current) => ({
                              ...current,
                              baseSalary: event.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="allowance">Phụ cấp *</Label>
                        <Input
                          id="allowance"
                          type="number"
                          min={0}
                          placeholder="VD: 1000000"
                          value={salaryForm.allowance}
                          onChange={(event) =>
                            setSalaryForm((current) => ({
                              ...current,
                              allowance: event.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salaryCoefficient">Hệ số lương *</Label>
                        <Input
                          id="salaryCoefficient"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="VD: 1.5"
                          value={salaryForm.salaryCoefficient}
                          onChange={(event) =>
                            setSalaryForm((current) => ({
                              ...current,
                              salaryCoefficient: event.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="positionCoefficient">
                          Hệ số chức vụ *
                        </Label>
                        <Input
                          id="positionCoefficient"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="VD: 1.2"
                          value={salaryForm.positionCoefficient}
                          onChange={(event) =>
                            setSalaryForm((current) => ({
                              ...current,
                              positionCoefficient: event.target.value,
                            }))
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Lương dự kiến theo công thức hiện tại
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(
                          (Number(salaryForm.baseSalary) || 0) *
                            (Number(salaryForm.salaryCoefficient) || 0) *
                            (Number(salaryForm.positionCoefficient) || 0) +
                            (Number(salaryForm.allowance) || 0),
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Công thức hệ thống: v1
                      </p>
                    </div>
                  </>
                )}

                {selectedRequest.RequestType === "UPDATE_EMPLOYEE" && (
                  <Alert className="border-blue-500/30 bg-blue-500/5">
                    <FilePenLine className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-sm">
                      Xác nhận cập nhật nhân viên
                    </AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      Request này không cần nhập thông tin lương. Backend sẽ cập
                      nhật các field có trong RequestPayload.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedRequest.RequestType === "DELETE_EMPLOYEE" && (
                  <Alert className="border-destructive/30 bg-destructive/5">
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                    <AlertTitle className="text-sm">
                      Xác nhận xóa nhân viên
                    </AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      Backend sẽ vô hiệu hóa nhân viên và tài khoản liên quan.
                      Đây là hành động nhạy cảm, hãy kiểm tra kỹ trước khi
                      duyệt.
                    </AlertDescription>
                  </Alert>
                )}

                <PayloadDetails request={selectedRequest} />
              </DialogScrollableBody>

              <DialogFooter className="shrink-0 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={closeActionDialog}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button onClick={handleApprove} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Xác nhận duyệt
                </Button>
              </DialogFooter>
            </>
          )}

          {selectedRequest && action === "reject" && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Từ chối yêu cầu #{selectedRequest.RequestID}
                </DialogTitle>
                <DialogDescription>
                  Nhập lý do từ chối để HR có thể điều chỉnh và gửi lại nếu cần.
                </DialogDescription>
              </DialogHeader>

              <DialogScrollableBody>
                <PayloadDetails request={selectedRequest} />

                <div className="space-y-2">
                  <Label htmlFor="rejectReason">Lý do từ chối *</Label>
                  <Textarea
                    id="rejectReason"
                    rows={4}
                    placeholder="VD: Thiếu thông tin hợp lệ hoặc cần bổ sung hồ sơ..."
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </DialogScrollableBody>

              <DialogFooter className="shrink-0 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={closeActionDialog}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Xác nhận từ chối
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
