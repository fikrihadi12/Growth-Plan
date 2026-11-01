import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./authContext";

export default function AuthPage({ mode }: { mode: "login" | "register" | "forgot" }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const next = params.get("next")?.startsWith("/app/") ? params.get("next")! : "/app/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (session && mode !== "forgot") return <Navigate to={next} replace />;
  if (!supabase) return <Navigate to="/setup" replace />;
  const client = supabase;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (pending) return;
    if (mode !== "forgot" && password.length < 8) { setError("Kata sandi minimal 8 karakter."); return; }
    if (mode === "register" && password !== confirmPassword) { setError("Konfirmasi kata sandi tidak cocok."); return; }
    setPending(true);
    try {
      if (mode === "forgot") {
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage("Jika alamat terdaftar, tautan pemulihan telah dikirim. Periksa inbox dan spam.");
      } else if (mode === "register") {
        const { data, error } = await client.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/app/dashboard` },
        });
        if (error) throw error;
        if (data.session) navigate(next, { replace: true });
        else setMessage("Periksa email untuk mengonfirmasi akun sebelum login. Jika email sudah dipakai, gunakan halaman masuk.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate(next, { replace: true });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Terjadi kesalahan autentikasi.");
    } finally { setPending(false); }
  }

  const label = mode === "login" ? "Masuk" : mode === "register" ? "Buat akun" : "Lupa kata sandi";
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 dark:text-white">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-9">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white"><LockKeyhole /></div>
      <h1 className="text-2xl font-extrabold">{label} ke GrowthPlan</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kelola rencana, tujuan, dan kebiasaan dengan akun pribadi.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-semibold">Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </label>
        {mode !== "forgot" && <label className="block text-sm font-semibold">Kata sandi
          <input type="password" required minLength={8} autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </label>}
        {mode === "register" && <label className="block text-sm font-semibold">Ulangi kata sandi
          <input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900 outline-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        </label>}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
        {message && <p role="status" className="flex gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><CheckCircle2 className="shrink-0" size={17} />{message}</p>}
        <button disabled={pending} className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60" type="submit">{pending ? "Memproses…" : label}</button>
      </form>
      <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm">
        {mode !== "login" && <Link to="/login" className="font-semibold text-brand-600">Sudah punya akun? Masuk</Link>}
        {mode === "login" && <><Link to="/register" className="font-semibold text-brand-600">Buat akun baru</Link><Link to="/forgot-password" className="font-semibold text-slate-500">Lupa sandi?</Link></>}
        {mode === "forgot" && <Link to="/login" className="text-slate-500">Kembali</Link>}
      </div>
      {location.pathname === "/register" && <p className="mt-5 text-xs text-slate-500">Gunakan kata sandi unik. Jangan memasukkan informasi sensitif pada data demo lama.</p>}
    </div>
  </main>;
}
