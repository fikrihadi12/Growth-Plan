import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { CheckCircle2, FolderKanban, LayoutDashboard, ListTodo, Moon, Sun, Settings2, Repeat2, ChartNoAxesCombined, LogOut, AlertTriangle, Download, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "../hooks/themeContext";
import { useAuth } from "../features/auth/authContext";
import { useCloud } from "../features/cloud/cloudContext";
import { supabase } from "../lib/supabase";

const navigation: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/plans", label: "Rencana", icon: FolderKanban },
  { to: "/app/tasks", label: "Semua Tugas", icon: ListTodo },
  { to: "/app/habits", label: "Habits", icon: Repeat2 },
  { to: "/app/analytics", label: "Analitik", icon: ChartNoAxesCombined },
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
  const { session } = useAuth();
  const { phase, error, retrySave, reloadCloud, exportBackup } = useCloud();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  async function signOut() {
    // Jangan logout sebelum perubahan terakhir benar-benar tersimpan di cloud.
    if (phase !== "saved" || !supabase) return;
    setSigningOut(true); setSignOutError("");
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
    } catch (caught) { setSignOutError(caught instanceof Error ? caught.message : "Gagal keluar dari akun."); }
    finally { setSigningOut(false); }
  }
  const current = navigation.find(({ to }) => pathname === to || pathname.startsWith(`${to}/`));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar desktop; navigasi mobile ditampilkan di bawah header. */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 lg:flex">
          <Link to="/app/dashboard" className="mb-10 flex items-center gap-3 px-3 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><CheckCircle2 size={23} /></span>
            GrowthPlan
          </Link>
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <Navigation />
          <div className="mt-auto rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="truncate text-sm font-semibold" title={session?.user.email}>{session?.user.email ?? "Akun GrowthPlan"}</p>
            <p className="mt-1 text-xs text-slate-500">Data pribadi tersimpan di Supabase.</p>
            <button type="button" disabled={phase !== "saved" || signingOut} onClick={() => { void signOut(); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:bg-slate-800"><LogOut size={16}/>Keluar</button>
            {phase !== "saved" && <p className="mt-2 text-xs text-amber-600">Logout dinonaktifkan sampai sinkronisasi selesai.</p>}
            {signOutError && <p role="alert" className="mt-2 text-xs text-red-600">{signOutError}</p>}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
              <div>
                <p className="text-xs font-medium text-slate-400 lg:hidden">GrowthPlan · Akun</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">{current?.label ?? "GrowthPlan"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span role="status" className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${phase === "saved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}>{phase === "saved" ? "● Tersimpan di cloud" : phase === "saving" ? "◌ Menyimpan…" : "⚠ Sinkronisasi bermasalah"}</span>
                <ThemeToggle />
                {/* Sidebar tersembunyi di ponsel: logout juga harus tersedia di header. */}
                <button type="button" aria-label="Keluar akun" title={phase === "saved" ? "Keluar" : "Tunggu data tersimpan sebelum keluar"} disabled={phase !== "saved" || signingOut} onClick={() => { void signOut(); }} className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2.5 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 lg:hidden"><LogOut size={19}/></button>
              </div>
            </div>
            <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800 lg:hidden"><Navigation mobile /></div>
          </header>
          <main id="main-content" className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-9">
            {phase === "offline" && <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18}/>Perubahan belum tersimpan di cloud</p>
              <p className="mt-1">{error} Jangan tutup tab sebelum berhasil menyimpan; unduh cadangan jika koneksi terus bermasalah.</p>
              <div className="mt-3 flex flex-wrap gap-2"><button className="rounded-lg bg-amber-800 px-3 py-2 text-white" onClick={retrySave}>Coba simpan lagi</button><button className="inline-flex items-center gap-2 rounded-lg border border-amber-700 px-3 py-2" onClick={exportBackup}><Download size={16}/>Unduh cadangan</button></div>
            </div>}
            {phase === "conflict" && <div role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={18}/>Perubahan dari perangkat lain terdeteksi</p>
              <p className="mt-1">{error} Penyimpanan dihentikan untuk mencegah data tertimpa. Ekspor cadangan, lalu muat ulang versi cloud.</p>
              <div className="mt-3 flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-lg border border-red-700 px-3 py-2" onClick={exportBackup}><Download size={16}/>Unduh cadangan</button><button className="inline-flex items-center gap-2 rounded-lg bg-red-800 px-3 py-2 text-white" onClick={() => { void reloadCloud(); }}><RotateCcw size={16}/>Muat ulang cloud</button></div>
            </div>}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
