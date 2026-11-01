import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./authContext";

export default function ResetPasswordPage() {
  const { session } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    if (password.length < 8 || password !== confirm) { setError("Kata sandi minimal 8 karakter dan harus sama."); return; }
    if (!supabase || !session) { setError("Sesi pemulihan tidak tersedia. Minta tautan baru."); return; }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Kata sandi berhasil diperbarui.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Gagal memperbarui kata sandi."); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 dark:bg-slate-950 dark:text-white"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
    <h1 className="text-2xl font-bold">Atur ulang kata sandi</h1>
    {!session && <p className="text-sm text-slate-500">Buka tautan pemulihan yang dikirim ke email terlebih dahulu.</p>}
    <label className="block text-sm">Kata sandi baru<input className="mt-2 w-full rounded-lg border p-3 text-slate-900" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    <label className="block text-sm">Ulangi kata sandi<input className="mt-2 w-full rounded-lg border p-3 text-slate-900" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}{message && <p role="status" className="text-sm text-green-600">{message}</p>}
    <button disabled={!session || busy} className="w-full rounded-xl bg-brand-600 p-3 font-semibold text-white disabled:opacity-50" type="submit">{busy ? "Menyimpan…" : "Simpan sandi baru"}</button><Link to="/app/dashboard" className="block text-sm font-semibold text-brand-600">Kembali ke GrowthPlan</Link>
  </form></main>;
}
