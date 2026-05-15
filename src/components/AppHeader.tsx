import { Bell, LogOut, Menu, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, mapBackendRoleToFrontendRole } from "@/lib/roles";

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
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg"
          title="Thông báo"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        </Button>

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
