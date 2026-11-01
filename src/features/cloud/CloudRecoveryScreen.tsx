import { AlertTriangle, Cloud, Download, RotateCcw, Trash2 } from "lucide-react";
import { useCloud } from "./cloudContext";

export default function CloudRecoveryScreen() {
  const { phase, error, draft, recoverDraft, discardDraft, reloadCloud, exportBackup } = useCloud();
  const isRecovery = phase === "recovery" && Boolean(draft);
  const isConflict = phase === "conflict";
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 dark:bg-slate-950 dark:text-white">
    <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950"><AlertTriangle /></div>
      <h1 className="text-xl font-bold">{isConflict ? "Terjadi konflik penyimpanan" : isRecovery ? "Ada perubahan belum tersinkron" : "Tidak dapat membuka workspace"}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {isConflict ? "Data cloud berubah dari tab atau perangkat lain. Penyuntingan dihentikan. Unduh perubahan pada perangkat ini sebagai cadangan, lalu muat ulang cloud. Pemulihan otomatis hanya diizinkan jika versinya cocok." : isRecovery ? "Perangkat ini menyimpan cadangan perubahan sebelumnya. Tentukan apakah akan memulihkannya atau menggunakan data cloud. Jangan membuang cadangan sebelum memeriksanya." : "Data cloud tidak dapat dibaca. Demi melindungi data, aplikasi tidak menampilkan workspace kosong atau menyimpan perubahan baru."}
      </p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        {isRecovery && <>
          <button onClick={recoverDraft} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"><Cloud size={17}/>Pulihkan cadangan</button>
          <button onClick={exportBackup} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm"><Download size={17}/>Unduh cadangan</button>
          <button onClick={() => { if (window.confirm("Abaikan perubahan lokal yang belum tersinkron dan gunakan data cloud?")) discardDraft(); }} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm text-red-600"><Trash2 size={17}/>Abaikan cadangan</button>
        </>}
        {isConflict && <button onClick={exportBackup} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm"><Download size={17}/>Unduh cadangan</button>}
        {!isRecovery && !isConflict && draft && <button onClick={exportBackup} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm"><Download size={17}/>Unduh cadangan</button>}
        {!isRecovery && <button onClick={() => { void reloadCloud(); }} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"><RotateCcw size={17}/>{isConflict ? "Muat ulang cloud" : "Coba kembali"}</button>}
      </div>
    </section>
  </main>;
}
