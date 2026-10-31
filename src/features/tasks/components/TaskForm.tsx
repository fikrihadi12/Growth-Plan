import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { usePlans } from "../../plans/planContext";
import { validateTaskInput } from "../taskRules";
import { useTasks } from "../taskContext";
import type { Task, TaskPriority } from "../types";

export function TaskForm({ onClose, initialProjectId, initialTask }: {
  onClose: () => void;
  initialProjectId?: string;
  initialTask?: Task;
}) {
  const { addTask, updateTask } = useTasks();
  const { plans } = usePlans();
  const activePlans = plans.filter((plan) => plan.status === "active");
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [projectId, setProjectId] = useState(initialTask?.projectId ?? initialProjectId ?? activePlans[0]?.id ?? "");
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? "");
  const [error, setError] = useState("");
  const selectedId = activePlans.some((plan) => plan.id === projectId) ? projectId : activePlans[0]?.id ?? "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = { title, projectId: selectedId, priority, dueDate: dueDate || null };
    const issue = validateTaskInput(input);
    if (issue) { setError(issue); return; }
    // Edit tugas dapat memindahkan ke Goal/Project aktif yang lain tanpa mengubah ID tugas.
    const success = initialTask ? updateTask(initialTask.id, input) : addTask(input);
    if (!success) { setError("Tidak dapat menyimpan: pastikan rencana asal dan tujuan masih aktif."); return; }
    onClose();
  }

  const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">{initialTask ? "Edit tugas" : "Tambah tugas baru"}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tugas bisa dikaitkan dengan Proyek atau Goal aktif.</p>
      {activePlans.length === 0 ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Tidak ada rencana aktif. <Link to="/app/plans" className="font-semibold underline" onClick={onClose}>Buat atau aktifkan rencana terlebih dahulu</Link>.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Judul tugas *</span><input autoFocus required className={fieldClass} maxLength={120} value={title} onChange={(e) => {setTitle(e.target.value);setError("");}} placeholder="Contoh: Menyelesaikan modul pertama"/></label>
          <label><span className="mb-1.5 block text-sm font-semibold">Rencana</span><select className={fieldClass} value={selectedId} onChange={(e) => setProjectId(e.target.value)}>{activePlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.kind === "goal" ? "Goal" : "Proyek"})</option>)}</select></label>
          <label><span className="mb-1.5 block text-sm font-semibold">Prioritas</span><select className={fieldClass} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}><option value="low">Rendah</option><option value="medium">Sedang</option><option value="high">Tinggi</option></select></label>
          <label><span className="mb-1.5 block text-sm font-semibold">Tenggat (opsional)</span><input type="date" className={fieldClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
          {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex items-end justify-end gap-2 sm:col-span-2"><Button variant="secondary" onClick={onClose}>Batal</Button><Button type="submit">{initialTask ? "Simpan perubahan" : "Simpan tugas"}</Button></div>
        </form>
      )}
    </Card>
  );
}
