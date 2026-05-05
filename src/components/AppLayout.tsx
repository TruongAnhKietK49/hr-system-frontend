import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { RoleProvider } from "@/context/RoleContext";

export default function AppLayout() {
  return (
    <RoleProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </RoleProvider>
  );
}
