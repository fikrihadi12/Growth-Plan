import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { projects } from "../demoData";
import { useTasks } from "../taskContext";
import type { TaskPriority } from "../types";

export function TaskForm({ onClose, initialProjectId }: { onClose: () => void; initialProjectId?: string }) {
  const { addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId ?? projects[0].id);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) { setError("Judul tugas tidak boleh kosong."); return; }

    // Tambah tugas melalui satu sumber state yang juga dipakai Dashboard/Projects/Tasks.
    addTask({ title: title.trim(), projectId, priority, dueDate: dueDate || null });
    onClose();
  }

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">Tambah tugas baru</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tugas tersimpan di browser selama tahap demo.</p>
      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold">Judul tugas *</span>
          <input autoFocus className={inputClass} maxLength={120} value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="Contoh: Membuat halaman dashboard" />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold">Proyek</span>
          <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold">Prioritas</span>
          <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold">Tenggat (opsional)</span>
          <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="flex items-end justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit">Simpan tugas</Button>
        </div>
      </form>
    </Card>
  );
}
