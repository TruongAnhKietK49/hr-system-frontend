import { Bell, LogOut, Menu, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, mapBackendRoleToFrontendRole } from "@/lib/roles";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getAvatarFallback(fullName?: string | null) {
  if (!fullName?.trim()) return "U";

  const words = fullName.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  const firstLetter = words[0][0];
  const lastLetter = words[words.length - 1][0];

  return `${firstLetter}${lastLetter}`.toUpperCase();
}

export function AppHeader() {
  const { user, logout } = useAuth();

  const fullName = user?.fullName ?? "Unknown User";
  const frontendRole = user ? mapBackendRoleToFrontendRole(user.role) : null;
  const roleLabel = frontendRole ? ROLE_LABELS[frontendRole] : "Người dùng";

  const avatarFallback = getAvatarFallback(fullName);

  const notifications = [
    {
      id: "1",
      title: "Có yêu cầu nhân sự đang chờ duyệt",
      description: "3 yêu cầu cần được kiểm tra và xử lý.",
      time: "Vừa xong",
      unread: true,
    },
    {
      id: "2",
      title: "Yêu cầu tạo nhân viên đã được duyệt",
      description: "Hồ sơ nhân viên mới đã được tạo thành công.",
      time: "1 giờ trước",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-card/80 px-4 backdrop-blur">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="h-9 w-9 rounded-lg">
          <Menu className="h-4 w-4" />
        </SidebarTrigger>

        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-semibold text-foreground">
            HR Management System
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Quản lý nhân sự, phòng ban, lương và phê duyệt
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-lg"
              title="Thông báo"
            >
              <Bell className="h-4 w-4" />

              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground ring-2 ring-card">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Thông báo</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {unreadCount} mới
                </span>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-sm font-medium text-foreground">
                  Không có thông báo mới
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Các cập nhật quan trọng sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex cursor-pointer items-start gap-3 p-3"
                >
                  <span
                    className={
                      notification.unread
                        ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                        : "mt-1 h-2 w-2 shrink-0 rounded-full bg-muted"
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-foreground">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {notification.time}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer justify-center text-xs font-medium text-primary">
              Xem tất cả thông báo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="mx-1 h-6 w-px bg-border" />

        <div className="flex items-center gap-2 rounded-xl px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>

          <div className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="max-w-[160px] truncate text-xs font-semibold text-foreground">
              {fullName}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <UserRound className="h-3 w-3" />
              {roleLabel}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg"
          onClick={logout}
          title="Đăng xuất"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
