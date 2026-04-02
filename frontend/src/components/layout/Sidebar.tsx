import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  LogOut,
  ChevronRight,
  Store,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/campanhas', label: 'Campanhas', icon: Megaphone },
  { to: '/parceiros', label: 'Parceiros', icon: Users },
  { to: '/metas', label: 'Metas', icon: Target },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <aside 
      className={cn(
        "sticky top-0 h-screen flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out dark:bg-zinc-900 dark:border-slate-800 z-50",
        isHovered ? "w-64 shadow-2xl" : "w-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section - Fixed top */}
      <div className="flex h-20 shrink-0 items-center px-6 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/20">
            <Store className="h-6 w-6" />
          </div>
          <div className={cn(
            "flex flex-col transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0 invisible w-0"
          )}>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              Comercial
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
              Drogamais
            </span>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable if items overflow */}
      <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto overflow-x-hidden scrollbar-none hover:scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => cn(
              "group flex items-center gap-4 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-slate-200"
            )}
          >
            <Icon className={cn(
              "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
            )} />
            <span className={cn(
              "transition-all duration-300 whitespace-nowrap",
              isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 invisible w-0"
            )}>
              {label}
            </span>
            {isHovered && (
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile - Fixed bottom */}
      <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-center">
            <ThemeToggle className={cn(!isHovered && "w-10 h-10")} />
        </div>
        
        <div className={cn(
            "flex items-center gap-3 rounded-xl p-2 transition-all duration-300 overflow-hidden",
            isHovered ? "bg-slate-50 dark:bg-zinc-800/50" : ""
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-slate-400">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className={cn(
            "flex flex-col transition-opacity duration-300 min-w-0",
            isHovered ? "opacity-100" : "opacity-0 invisible w-0"
          )}>
            <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
              {user?.name}
            </p>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-[10px] font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
