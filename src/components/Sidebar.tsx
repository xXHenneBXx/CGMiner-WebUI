import { Home, Settings, Sliders, Activity } from 'lucide-react';
import { NavLink } from './NavLink';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">CGMiner</h2>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        <NavLink
          icon={<Home className="w-5 h-5" />}
          label="Home"
          active={currentPage === 'home'}
          onClick={() => onNavigate('home')}
        />
        <NavLink
          icon={<Settings className="w-5 h-5" />}
          label="Pool Settings"
          active={currentPage === 'settings'}
          onClick={() => onNavigate('settings')}
        />
        <NavLink
          icon={<Sliders className="w-5 h-5" />}
          label="Configuration"
          active={currentPage === 'config'}
          onClick={() => onNavigate('config')}
        />
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-600">Connected</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Created by xXHenneBXx</p>
      </div>
    </aside>
  );
}
