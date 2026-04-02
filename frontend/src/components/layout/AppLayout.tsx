import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar.tsx'
import { ThemeProvider } from '../../context/ThemeContext'

export function AppLayout() {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}
