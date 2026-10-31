import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { TaskForm } from "./components/TaskForm";
import { TaskRow } from "./components/TaskRow";
import { useTasks } from "./taskContext";
import { usePlans } from "../plans/planContext";
import { statusLabels } from "./demoData";
import type { TaskStatus } from "./types";

type Filter = "all" | TaskStatus;

export default function TasksPage() {
  const { tasks } = useTasks();
  const { plans } = usePlans();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);

  // Filter hanya mengubah tampilan; data asli tetap tersedia di TaskProvider.
  const activeIds = new Set(plans.filter((plan)=>plan.status === "active").map((plan)=>plan.id));
  const visibleTasks = includeArchived ? tasks : tasks.filter((task)=>activeIds.has(task.projectId));
  const filtered = visibleTasks.filter((task) =>
    (filter === "all" || task.status === filter) &&
    task.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-100">Task management</p><h1 className="mt-1 text-3xl font-bold">Semua Tugas</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Cari, perbarui status, atau hapus tugas pada rencana milikmu.</p></div>
        <Button onClick={() => setShowForm((prev) => !prev)} aria-expanded={showForm}><Plus size={18} /> {showForm ? "Tutup formulir" : "Tambah tugas"}</Button>
      </div>
      {showForm && <TaskForm onClose={() => setShowForm(false)} />}
      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_210px_auto]">
          <label className="relative block"><Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" aria-hidden="true" /><span className="sr-only">Cari tugas</span><input className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari judul tugas..." /></label>
          <label><span className="sr-only">Filter status</span><select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}><option value="all">Semua status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <Button variant="secondary" onClick={() => { setSearch(""); setFilter("all"); }}><X size={16} /> Reset filter</Button>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={includeArchived} onChange={(event)=>setIncludeArchived(event.target.checked)} /> Sertakan tugas dari rencana yang diarsipkan</label>
        <p className="mt-3 text-xs text-slate-500" aria-live="polite">Menampilkan {filtered.length} dari {visibleTasks.length} tugas</p>
      </Card>
      <Card className="space-y-2 p-3 sm:p-4">
        {filtered.length ? filtered.map((task) => <TaskRow key={task.id} task={task} />) : <EmptyState message="Tidak ada tugas yang cocok. Coba ubah kata kunci atau filter." />}
      </Card>
    </div>
  );
}
