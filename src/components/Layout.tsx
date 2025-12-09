import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex-1 min-h-screen md:px-8 bg-gray-900">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 md:ml-50 md:ml-34 transition-all duration-300">
        {/* toggle button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="m-2 bg-gray-200 p-2 rounded-lg shadow md:show"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        <header className="bg-gray border-r border-gray-200 sticky top-0 z-10">
          <div className="md:px-8 py-4">
            <h1 className="text-2xl font-bold text-blue-600">
              {currentPage === "home" && "Dashboard"}
              {currentPage === "settings" && "Pool Settings"}
              {currentPage === "config" && "Configuration"}
            </h1>
            <p className="text-sm text-orange-500 mt-1">
              {currentPage === "home" && "Monitor Your Mining Performance, Pools and Device Statistics"}
              {currentPage === "settings" && "Manage mining pools and failover settings"}
              {currentPage === "config" && "Configure device frequency, fan speed, and more"}
            </p>
          </div>
        </header>

        <main className="md:p-8">{children}</main>
      </div>
    </div>
  );
}
