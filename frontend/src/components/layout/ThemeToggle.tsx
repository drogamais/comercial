import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-zinc-900 dark:hover:bg-zinc-800",
        className
      )}
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-slate-600" />
      ) : (
        <Sun className="h-4 w-4 text-slate-400" />
      )}
    </button>
  );
}
