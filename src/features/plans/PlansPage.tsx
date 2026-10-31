import { useState } from "react";
import { Archive, ArrowUpRight, FolderKanban, Plus, RotateCcw, Search, Target, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { EmptyState } from "../../components/common/EmptyState";
import { getPlanProgress } from "./goalProgress";
import { useTasks } from "../tasks/taskContext";
import { useHabits } from "../habits/habitContext";
import { PlanForm } from "./components/PlanForm";
import { usePlans } from "./planContext";
import { categoryColors, categoryLabels, kindLabels, periodLabels } from "./planRules";
import type { PlanKind, PlanStatus } from "./types";

type StatusFilter = "all" | PlanStatus;
type KindFilter = "all" | PlanKind;
const controlClass = "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

export default function PlansPage() {
  const { plans, milestones, deletePlan, setPlanArchived } = usePlans();
  const { tasks } = useTasks();
  const { habits, habitLogs } = useHabits();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const matching = plans.filter((plan) =>
    (statusFilter === "all" || plan.status === statusFilter) &&
    (kindFilter === "all" || plan.kind === kindFilter) &&
    `${plan.name} ${plan.description} ${categoryLabels[plan.category]}`.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID"))
  );

  function removePlan(id: string, name: string) {
    const count = tasks.filter((task) => task.projectId === id).length;
    const countMilestones = milestones.filter((m) => m.planId === id).length;
    const ownHabits = habits.filter((habit) => habit.planId === id);
    const ownLogs = habitLogs.filter((log) => ownHabits.some((habit) => habit.id === log.habitId));
    if (window.confirm(`Hapus rencana "${name}" secara permanen? ${count} tugas, ${countMilestones} milestone, ${ownHabits.length} habit dan ${ownLogs.length} catatan check-in ikut dihapus. Tidak dapat dibatalkan.`)) {
      deletePlan(id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-100">Plan management</p>
          <h1 className="mt-1 text-3xl font-extrabold">Rencana Saya</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kelola proyek kerja, target pribadi, serta rencana harian hingga tahunan.</p>
        </div>
        <Button onClick={() => setShowForm((previous) => !previous)} aria-expanded={showForm}><Plus size={18}/>{showForm ? "Tutup formulir" : "Buat rencana"}</Button>
      </div>
      {showForm && <PlanForm onClose={() => setShowForm(false)}/>}
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Ringkasan rencana">
        <Card className="p-4"><p className="text-xs text-slate-500">Semua rencana</p><p className="mt-2 text-2xl font-bold">{plans.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Aktif</p><p className="mt-2 text-2xl font-bold">{plans.filter((p)=>p.status === "active").length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Diarsipkan</p><p className="mt-2 text-2xl font-bold">{plans.filter((p)=>p.status === "archived").length}</p></Card>
      </section>
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-3 text-slate-400" aria-hidden="true"/>
            <span className="sr-only">Cari rencana</span>
            <input className={`${controlClass} w-full pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, deskripsi atau kategori..."/>
          </label>
          <label><span className="sr-only">Filter status</span><select className={`${controlClass} w-full`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="active">Aktif</option><option value="archived">Diarsipkan</option><option value="all">Semua status</option></select></label>
          <label><span className="sr-only">Filter jenis</span><select className={`${controlClass} w-full`} value={kindFilter} onChange={(event) => setKindFilter(event.target.value as KindFilter)}><option value="all">Semua jenis</option><option value="project">Proyek</option><option value="goal">Goal</option></select></label>
          <Button variant="secondary" onClick={() => {setQuery(""); setStatusFilter("active"); setKindFilter("all");}}>Reset filter</Button>
        </div>
        <p aria-live="polite" className="mt-3 text-xs text-slate-500">Menampilkan {matching.length} dari {plans.length} rencana</p>
      </Card>
      {matching.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {matching.map((plan) => {
          const progress = getPlanProgress(plan, tasks, milestones);
          const KindIcon = plan.kind === "goal" ? Target : FolderKanban;
          return <Card key={plan.id} className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${categoryColors[plan.category]}`}><KindIcon size={21}/></span>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${plan.status === "archived" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"}`}>{plan.status === "archived" ? "Arsip" : "Aktif"}</span>
            </div>
            <Link to={`/app/plans/${plan.id}`} className="group mt-4 inline-flex items-center gap-2 text-lg font-bold hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-brand-600 dark:hover:text-brand-100">{plan.name}<ArrowUpRight size={17} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"/></Link>
            <p className="mt-2 min-h-12 text-sm text-slate-500 dark:text-slate-400">{plan.description || "Belum ada deskripsi."}</p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{kindLabels[plan.kind]} · {categoryLabels[plan.category]} · {periodLabels[plan.period]}</p>
            <div className="mt-auto pt-6">
              <div className="flex justify-between text-xs"><span className="text-slate-500">{progress.caption}</span><span className="font-bold">{progress.percent}%</span></div>
              <div className="mt-2"><ProgressBar value={progress.percent} label={`Progres ${plan.name}`}/></div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <button type="button" className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" onClick={()=>setPlanArchived(plan.id, plan.status !== "archived")} aria-label={`${plan.status === "archived" ? "Aktifkan" : "Arsipkan"} ${plan.name}`}>{plan.status === "archived" ? <RotateCcw size={15}/> : <Archive size={15}/>} {plan.status === "archived" ? "Aktifkan" : "Arsipkan"}</button>
                <button type="button" className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={()=>removePlan(plan.id,plan.name)} aria-label={`Hapus ${plan.name}`}><Trash2 size={15}/> Hapus</button>
              </div>
            </div>
          </Card>;
        })}
      </div> : <Card className="p-6"><EmptyState message={plans.length === 0 ? "Belum ada rencana. Klik 'Buat rencana' untuk memulai." : "Tidak ada rencana yang sesuai filter."}/></Card>}
    </div>
  );
}
