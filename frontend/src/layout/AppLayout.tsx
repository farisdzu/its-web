import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen">
      {/* Sidebar - Fixed */}
        <AppSidebar />
        <Backdrop />
      
      {/* Header - Fixed, Full Width, Always on top */}
      <AppHeader />
      
      {/* Content Area - With margin for sidebar, padding top for header */}
      <div
        className={`transition-all duration-300 ease-in-out pt-16 lg:pt-16 ${
          isExpanded || isHovered ? "lg:ml-[260px]" : "lg:ml-[80px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
