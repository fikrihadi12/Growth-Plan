export default function SetupPage() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 dark:bg-slate-950 dark:text-white">
    <div className="max-w-lg rounded-xl border border-amber-200 bg-white p-8 dark:border-amber-800 dark:bg-slate-900">
      <h1 className="text-2xl font-bold">Konfigurasi Supabase diperlukan</h1>
      <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">Buat project Supabase, jalankan SQL pada folder <code>supabase/</code>, lalu isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> di <code>.env.local</code>. Restart Vite sesudahnya.</p>
      <p className="mt-3 text-sm text-red-700 dark:text-red-300">Jangan pernah memakai service_role atau secret key di aplikasi browser.</p>
    </div>
  </main>;
}
