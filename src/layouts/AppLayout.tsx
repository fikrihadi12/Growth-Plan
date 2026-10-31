import { Link, NavLink, Outlet, useLocation } from "react-router";
import { CheckCircle2, FolderKanban, LayoutDashboard, ListTodo, Moon, Sun, Settings2, Repeat2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../hooks/themeContext";

const navigation: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/plans", label: "Rencana", icon: FolderKanban },
  { to: "/app/tasks", label: "Semua Tugas", icon: ListTodo },
  { to: "/app/habits", label: "Habits", icon: Repeat2 },
  { to: "/app/settings/profile", label: "Pengaturan", icon: Settings2 },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
      title={theme === "light" ? "Mode gelap" : "Mode terang"}
      className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {theme === "light" ? <Moon size={19} aria-hidden="true" /> : <Sun size={19} aria-hidden="true" />}
    </button>
  );
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav aria-label="Navigasi utama" className={mobile ? "flex gap-2 overflow-x-auto pb-1" : "space-y-1.5"}>
      {navigation.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600 ${isActive ? "bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"}`}
        >
          <Icon size={18} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const { pathname } = useLocation();
  const current = navigation.find(({ to }) => pathname === to || pathname.startsWith(`${to}/`));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar desktop; navigasi mobile ditampilkan di bawah header. */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 lg:flex">
          <Link to="/app/dashboard" className="mb-10 flex items-center gap-3 px-3 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><CheckCircle2 size={23} /></span>
            TaskFlow
          </Link>
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <Navigation />
          <div className="mt-auto rounded-xl border border-dashed border-slate-200 p-3 dark:border-slate-700">
            <p className="text-sm font-semibold">Mode Demo</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Rencana, tugas, dan habit tersimpan di browser ini. Belum ada akun atau sinkronisasi cloud.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
              <div>
                <p className="text-xs font-medium text-slate-400 lg:hidden">TaskFlow · Demo</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">{current?.label ?? "TaskFlow"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 sm:inline-flex">● Local demo</span>
                <ThemeToggle />
              </div>
            </div>
            <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800 lg:hidden"><Navigation mobile /></div>
          </header>
          <main id="main-content" className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-9">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
