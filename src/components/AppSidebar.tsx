import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CheckSquare,
  Wallet,
  Banknote,
  ScrollText,
  UserCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRole } from "@/context/RoleContext";
import { MenuKey, ROLE_MENUS } from "@/lib/roles";

const ALL_ITEMS: Record<
  MenuKey,
  { title: string; url: string; icon: typeof Users }
> = {
  dashboard: { title: "Tổng quan", url: "/dashboard", icon: LayoutDashboard },
  employees: { title: "Nhân viên", url: "/employees", icon: Users },
  departments: { title: "Phòng ban", url: "/departments", icon: Building2 },
  requests: { title: "Yêu cầu nhân sự", url: "/requests", icon: FileText },
  approvals: { title: "Phê duyệt", url: "/approvals", icon: CheckSquare },
  salary: { title: "Lương", url: "/salary", icon: Wallet },
  finance: { title: "Tài chính", url: "/finance", icon: Banknote },
  audit: { title: "Nhật ký kiểm tra", url: "/audit", icon: ScrollText },
  profile: { title: "Hồ sơ", url: "/profile", icon: UserCircle },
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { role } = useRole();

  const items = ROLE_MENUS[role].map((k) => ({ key: k, ...ALL_ITEMS[k] }));
  const isActive = (path: string) =>
    pathname === path || (path !== "/dashboard" && pathname.startsWith(path));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="flex h-14 items-center border-b border-border px-3">
        <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold leading-none text-foreground">
              HR System
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Quản lý nhân sự
            </p>
          </div>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Điều hướng</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
