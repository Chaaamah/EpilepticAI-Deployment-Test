
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  // Lire DIRECTEMENT depuis localStorage AVANT de rendre
  const savedState = typeof window !== 'undefined' 
    ? localStorage.getItem('sidebar-state') 
    : null;
  
  const initialState = savedState ? JSON.parse(savedState) : true;

  return (
    <SidebarProvider defaultOpen={initialState}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-[73px] border-b border-border bg-card flex items-center px-6 sticky top-0 z-10 shrink-0">
            <SidebarTrigger className="mr-4" />
            <div className="ml-auto flex items-center gap-4">
              {/* Header content */}
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;