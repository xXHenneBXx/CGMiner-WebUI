import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <div className="flex-1">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentPage === 'home' && 'Dashboard'}
              {currentPage === 'settings' && 'Pool Settings'}
              {currentPage === 'config' && 'Configuration'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {currentPage === 'home' && 'Monitor your mining performance in real-time'}
              {currentPage === 'settings' && 'Manage mining pools and failover settings'}
              {currentPage === 'config' && 'Configure device frequency, fan speed, and more'}
            </p>
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
