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

const ALL_ITEMS: Record<MenuKey, { title: string; url: string; icon: typeof Users }> = {
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
  const isActive = (path: string) => pathname === path || (path !== "/dashboard" && pathname.startsWith(path));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Building2 className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">HR System</span>
            <span className="text-[10px] text-muted-foreground">Quản lý nhân sự</span>
          </div>
        )}
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
