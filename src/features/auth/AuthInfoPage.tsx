import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Link } from "react-router";
import { Card } from "../../components/ui/Card";

export function AuthInfoPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-600/20 dark:text-brand-100"><LockKeyhole size={28} /></div>
        <h1 className="mt-5 text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Fitur akun belum aktif pada tahap Design System. Autentikasi aman akan dibuat menggunakan Supabase pada tahap berikutnya.</p>
        <Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700" to="/app/dashboard"><ArrowLeft size={16} /> Buka demo TaskFlow</Link>
      </Card>
    </div>
  );
}
