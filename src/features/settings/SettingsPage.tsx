import { Download, ShieldCheck, SunMoon, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useTheme } from "../../hooks/themeContext";
import { useAuth } from "../auth/authContext";
import { useCloud } from "../cloud/cloudContext";
import { workspaceIsEmpty } from "../cloud/cloudRules";
import { usePlans } from "../plans/planContext";
import { useTasks } from "../tasks/taskContext";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { resetDemo, tasks } = useTasks();
  const { plans, milestones } = usePlans();
  const { phase, availableLocalData, importLocalData, exportBackup } = useCloud();
  const { session } = useAuth();
  const [feedback, setFeedback] = useState("");
  // Tombol impor hanya aktif bila akun belum memiliki rencana/tugas; tidak menimpa data cloud.
  const cloudEmpty = workspaceIsEmpty({ plans, tasks, milestones, habits: [], habitLogs: [], habitTargets: [], reflections: [] });
  function importLegacy() {
    if (!window.confirm("Salin data browser Tahap 4B ke akun ini? Data lokal asli tetap disimpan sebagai cadangan.")) return;
    setFeedback(importLocalData() ? "Impor dimulai. Periksa indikator sinkronisasi sampai status Tersimpan di cloud." : "Impor tidak dapat dilakukan. Pastikan cloud masih kosong dan data lama tersedia.");
  }
  function clearAll() {
    if (phase !== "saved") return;
    // Konfirmasi dua tahap untuk operasi destruktif.
    if (window.prompt("Ini akan MENGHAPUS seluruh data akun di cloud. Ketik HAPUS untuk melanjutkan:") === "HAPUS") {
      resetDemo();
      setFeedback("Penghapusan dimulai. Jangan keluar sebelum status Tersimpan di cloud.");
    }
  }
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan akun</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pengaturan akun, migrasi data, dan penyimpanan GrowthPlan.</p>
      </div>
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-3">
          <SunMoon className="text-brand-600" />
          <div>
            <h2 className="font-bold">Tema aplikasi</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tema: {theme === "light" ? "Terang" : "Gelap"}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={toggleTheme}>
          Ganti tema
        </Button>
      </Card>
      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-emerald-600" />
          <div>
            <h2 className="font-bold">Supabase Cloud</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {session?.user.email ?? "Tidak diketahui"} · Status: {phase}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Data dienkripsi selama transmisi dan akses akun dipisahkan menggunakan Row Level Security pada database. Unduhan JSON berisi data pribadi; simpan di lokasi yang aman.</p>
        <Button variant="secondary" onClick={exportBackup}>
          <Download size={16} /> Ekspor cadangan JSON
        </Button>
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex-1">
          <h2 className="flex items-center gap-2 font-bold">
            <UploadCloud size={19} className="text-brand-600" /> Impor data lama
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Punya data dari GrowthPlan versi sebelumnya? Pindahkan data yang tersimpan di browser ini ke akun cloud Anda. Fitur ini hanya tersedia jika akun cloud masih kosong.
          </p>
        </div>
        <Button variant="secondary" disabled={phase !== "saved" || !availableLocalData || !cloudEmpty} onClick={importLegacy}>
          Impor data lokal
        </Button>
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="flex-1">
          <h2 className="flex items-center gap-2 font-bold">
            <Trash2 size={19} className="text-red-600" /> Hapus seluruh data cloud
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Mengosongkan semua Plan, Task, Milestone, Habit, Check-in, riwayat target, dan refleksi. Akun tetap aktif. Gunakan backup sebelum menghapus.</p>
        </div>
        <Button variant="danger" disabled={phase !== "saved"} onClick={clearAll}>
          Hapus semua data
        </Button>
      </Card>
      {feedback && (
        <p role="status" className="rounded-lg bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-600/10 dark:text-brand-100">
          {feedback}
        </p>
      )}
    </div>
  );
}
