import { ReactNode } from 'react';

interface NavLinkProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function NavLink({ icon, label, active, onClick }: NavLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
