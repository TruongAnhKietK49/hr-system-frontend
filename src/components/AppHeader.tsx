import { Bell, LogOut, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRole } from "@/context/RoleContext";
import { ROLE_LABELS } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";

export function AppHeader() {
  const { role, fullName } = useRole();
  const { logout } = useAuth();

  const avatarFallback =
    fullName.split(" ").filter(Boolean).pop()?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur flex items-center gap-3 px-4 sticky top-0 z-30">
      <SidebarTrigger />

      <div className="hidden md:flex relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm nhân viên, phòng ban..."
          className="pl-9 h-9 bg-background"
        />
      </div>

      <div className="flex-1 md:hidden" />

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
      </Button>

      <div className="flex items-center gap-2 pl-2 border-l border-border">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>

        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-xs font-medium">{fullName}</span>
          <span className="text-[10px] text-muted-foreground">
            {ROLE_LABELS[role]}
          </span>
        </div>

        <Button variant="ghost" size="icon" onClick={logout} title="Đăng xuất">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
