import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarIcon,
  UserPlus,
  UserMinus,
  Send,
  Info,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DEPARTMENTS = ["Kỹ thuật", "Nhân sự", "Tài chính", "Marketing", "Vận hành"];
const POSITIONS = [
  "Kỹ sư phần mềm",
  "Chuyên viên tuyển dụng",
  "Kế toán viên",
  "Kế toán trưởng",
  "Trưởng nhóm",
  "Quản lý dự án",
  "Chuyên viên C&B",
  "Designer",
];

const EMPLOYEES = [
  { id: "NV001", name: "Nguyễn Văn An", department: "Kỹ thuật" },
  { id: "NV002", name: "Trần Thị Bình", department: "Nhân sự" },
  { id: "NV003", name: "Lê Quốc Cường", department: "Tài chính" },
  { id: "NV004", name: "Phạm Thị Dung", department: "Marketing" },
  { id: "NV005", name: "Hoàng Minh Đức", department: "Kỹ thuật" },
  { id: "NV006", name: "Vũ Thị Hà", department: "Nhân sự" },
  { id: "NV007", name: "Đặng Quang Huy", department: "Tài chính" },
  { id: "NV008", name: "Bùi Thị Lan", department: "Marketing" },
];

// ----- Schemas -----
const addSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Họ tên phải có ít nhất 2 ký tự" })
    .max(100, { message: "Họ tên không vượt quá 100 ký tự" }),
  gender: z.enum(["Nam", "Nữ", "Khác"], {
    required_error: "Vui lòng chọn giới tính",
  }),
  dob: z
    .date({ required_error: "Vui lòng chọn ngày sinh" })
    .refine((d) => d < new Date(), { message: "Ngày sinh phải nhỏ hơn hôm nay" }),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[0-9]{9,10}$/, {
      message: "Số điện thoại không hợp lệ (VD: 0901234567)",
    }),
  department: z.string().min(1, { message: "Vui lòng chọn phòng ban" }),
  position: z.string().min(1, { message: "Vui lòng chọn chức vụ" }),
  note: z
    .string()
    .trim()
    .max(500, { message: "Ghi chú không vượt quá 500 ký tự" })
    .optional(),
});

const deleteSchema = z.object({
  employeeId: z.string().min(1, { message: "Vui lòng chọn nhân viên" }),
  reason: z
    .string()
    .trim()
    .min(10, { message: "Lý do phải có ít nhất 10 ký tự" })
    .max(500, { message: "Lý do không vượt quá 500 ký tự" }),
});

type AddForm = z.infer<typeof addSchema>;
type DeleteForm = z.infer<typeof deleteSchema>;

export default function Requests() {
  const [tab, setTab] = useState<"add" | "delete">("add");

  const addForm = useForm<AddForm>({
    resolver: zodResolver(addSchema),
    defaultValues: { name: "", phone: "", note: "", department: "", position: "" },
  });

  const deleteForm = useForm<DeleteForm>({
    resolver: zodResolver(deleteSchema),
    defaultValues: { employeeId: "", reason: "" },
  });

  const onSubmitAdd = (data: AddForm) => {
    toast.success("Đã gửi yêu cầu thêm nhân viên", {
      description: `${data.name} · ${data.department} · ${data.position}`,
    });
    addForm.reset();
  };

  const onSubmitDelete = (data: DeleteForm) => {
    const emp = EMPLOYEES.find((e) => e.id === data.employeeId);
    toast.success("Đã gửi yêu cầu xóa nhân viên", {
      description: `${emp?.id} - ${emp?.name}`,
    });
    deleteForm.reset();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Yêu cầu nhân sự
        </h1>
        <p className="text-sm text-muted-foreground">
          Tạo yêu cầu thêm hoặc xóa nhân viên. Yêu cầu sẽ được gửi tới Giám đốc để phê duyệt.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "add" | "delete")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="add" className="gap-2">
            <UserPlus className="h-4 w-4" /> Thêm nhân viên
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-2">
            <UserMinus className="h-4 w-4" /> Xóa nhân viên
          </TabsTrigger>
        </TabsList>

        {/* ADD */}
        <TabsContent value="add" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Thông tin nhân viên mới</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 border-primary/30 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-sm">Lưu ý</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  Thông tin lương và phụ cấp sẽ do Giám đốc nhập trong bước phê duyệt.
                  HR chỉ nhập thông tin hành chính của nhân viên.
                </AlertDescription>
              </Alert>

              <Form {...addForm}>
                <form
                  onSubmit={addForm.handleSubmit(onSubmitAdd)}
                  className="grid gap-5 md:grid-cols-2"
                >
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Họ tên *</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: Nguyễn Văn A" maxLength={100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giới tính *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Nam">Nam</SelectItem>
                            <SelectItem value="Nữ">Nữ</SelectItem>
                            <SelectItem value="Khác">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Ngày sinh *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value
                                  ? format(field.value, "dd/MM/yyyy", { locale: vi })
                                  : "Chọn ngày sinh"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1940-01-01")
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại *</FormLabel>
                        <FormControl>
                          <Input placeholder="VD: 0901234567" maxLength={15} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phòng ban *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn phòng ban" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chức vụ *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn chức vụ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {POSITIONS.map((p) => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Ghi chú</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Thông tin bổ sung cho yêu cầu (không bắt buộc)"
                            rows={4}
                            maxLength={500}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Tối đa 500 ký tự. Không nhập thông tin lương/phụ cấp tại đây.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 md:col-span-2">
                    <Button type="button" variant="outline" onClick={() => addForm.reset()}>
                      Làm mới
                    </Button>
                    <Button type="submit">
                      <Send className="h-4 w-4" /> Gửi yêu cầu
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DELETE */}
        <TabsContent value="delete" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Yêu cầu xóa nhân viên</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-900">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle className="text-sm">Hành động cần phê duyệt</AlertTitle>
                <AlertDescription className="text-xs">
                  Yêu cầu xóa nhân viên sẽ được gửi tới Giám đốc và ghi vào nhật ký kiểm tra.
                </AlertDescription>
              </Alert>

              <Form {...deleteForm}>
                <form
                  onSubmit={deleteForm.handleSubmit(onSubmitDelete)}
                  className="space-y-5"
                >
                  <FormField
                    control={deleteForm.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nhân viên cần xóa *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nhân viên" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EMPLOYEES.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.id} — {e.name} ({e.department})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={deleteForm.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lý do xóa *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Mô tả chi tiết lý do xóa nhân viên (tối thiểu 10 ký tự)"
                            rows={5}
                            maxLength={500}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Vui lòng nêu rõ lý do để Giám đốc có cơ sở phê duyệt.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => deleteForm.reset()}
                    >
                      Làm mới
                    </Button>
                    <Button type="submit" variant="destructive">
                      <Send className="h-4 w-4" /> Gửi yêu cầu xóa
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
