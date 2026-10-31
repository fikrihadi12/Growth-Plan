import { RotateCcw, ShieldCheck, SunMoon } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useTheme } from "../../hooks/themeContext";
import { useTasks } from "../tasks/taskContext";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { resetDemo } = useTasks();

  function confirmReset() {
    if (window.confirm("Kembalikan seluruh tugas ke data contoh awal? Perubahanmu akan hilang.")) resetDemo();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-3xl font-bold">Pengaturan</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Atur tampilan dan data demo TaskFlow.</p></div>
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6"><div className="flex items-center gap-3"><SunMoon className="text-brand-600" /><div><h2 className="font-bold">Tema aplikasi</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tema aktif: {theme === "light" ? "Terang" : "Gelap"}</p></div></div><Button variant="secondary" onClick={toggleTheme}>Ganti tema</Button></Card>
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6"><div className="flex items-center gap-3"><RotateCcw className="text-brand-600" /><div><h2 className="font-bold">Reset data demo</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kembalikan daftar tugas ke contoh awal.</p></div></div><Button variant="danger" onClick={confirmReset}>Reset tugas</Button></Card>
      <Card className="flex items-start gap-3 p-6"><ShieldCheck className="shrink-0 text-amber-600" /><div><h2 className="font-bold">Status keamanan: mode demo</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Belum ada akun, autentikasi, atau database. Jangan menyimpan data sensitif. Sistem keamanan multi-user akan dikembangkan pada tahap integrasi Supabase.</p></div></Card>
    </div>
  );
}
