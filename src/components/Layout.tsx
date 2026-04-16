import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Layout({ children }: { children?: React.ReactNode }) {
  const { signOut } = useAuth();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b px-4 bg-card justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="ml-2" />
              <h1 className="text-lg font-semibold mr-4">מערכת ניהול תורמים</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1">
              <LogOut className="h-4 w-4" /> התנתק
            </Button>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children || <Outlet />}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
