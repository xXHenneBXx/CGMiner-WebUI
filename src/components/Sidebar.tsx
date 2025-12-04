import { Home, Settings, Sliders, Cpu, Menu } from "lucide-react";
import { NavLink } from "./NavLink";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ currentPage, onNavigate, open, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-gray-200 border-r border-gray-300 
      transition-all duration-300 z-40
      ${open ? "w-64" : "w-0 overflow-hidden"}`}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-10 top-4 bg-gray-200 p-2 rounded-r-lg shadow"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="p-6 border-b border-gray-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h2 className="font-bold text-blue-600">CGMiner</h2>
            <p className="text-xs text-green-500">Web Mining UI</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        <NavLink
          icon={<Home className="w-5 h-5" />}
          label="Home"
          active={currentPage === "home"}
          onClick={() => onNavigate("home")}
        />
        <NavLink
          icon={<Settings className="w-5 h-5" />}
          label="Pool Settings"
          active={currentPage === "settings"}
          onClick={() => onNavigate("settings")}
        />
        <NavLink
          icon={<Sliders className="w-5 h-5" />}
          label="Device Configuration"
          active={currentPage === "config"}
          onClick={() => onNavigate("config")}
        />
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-300">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">Connected</span>
        </div>
        <p className="text-xs text-yellow-500 mt-2 animate-pulse">Created by xXHenneBXx</p>
      </div>
    </aside>
  );
}
