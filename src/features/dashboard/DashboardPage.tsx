import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, FolderKanban, ListTodo, Plus, Target, Repeat2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { EmptyState } from "../../components/common/EmptyState";
import { TaskForm } from "../tasks/components/TaskForm";
import { TaskRow } from "../tasks/components/TaskRow";
import { useTasks } from "../tasks/taskContext";
import { completionPercent } from "../tasks/demoData";
import { getPlanProgress } from "../plans/goalProgress";
import { usePlans } from "../plans/planContext";
import { useHabits } from "../habits/habitContext";
import { useCurrentLocalDate } from "../habits/useCurrentLocalDate";
import { getWeeklyProgress } from "../habits/habitRules";
import { categoryColors, kindLabels, periodLabels } from "../plans/planRules";

export default function DashboardPage() {
  const { tasks } = useTasks();
  const { plans, milestones } = usePlans();
  const { habits, habitLogs, habitTargets } = useHabits();
  const [showForm, setShowForm] = useState(false);
  const activePlans = plans.filter((plan)=>plan.status === "active");
  const activeIds = new Set(activePlans.map((plan)=>plan.id));
  // Ringkasan dashboard berfokus pada rencana aktif; arsip tetap ada di daftar rencana.
  const activeTasks = tasks.filter((task)=>activeIds.has(task.projectId));
  const activeHabits = habits.filter((habit)=>activeIds.has(habit.planId));
  const weekToday = useCurrentLocalDate();
  const completed = activeTasks.filter((task)=>task.status === "done").length;
  const inProgress = activeTasks.filter((task)=>task.status === "in_progress").length;
  const percent = completionPercent(activeTasks);
  const recentTasks = [...activeTasks].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-100">Workspace overview</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Selamat datang di GrowthPlan <span aria-hidden="true">👋</span></h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Kelola proyek, goal pribadi, dan prioritasmu dari satu tempat.</p></div>
        <div className="flex flex-wrap gap-2"><Link to="/app/plans" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-100"><Plus size={17}/> Rencana baru</Link><Button onClick={()=>setShowForm((v)=>!v)} aria-expanded={showForm}><Plus size={17}/>{showForm ? "Tutup formulir" : "Tambah tugas"}</Button></div>
      </div>
      {showForm && <TaskForm onClose={()=>setShowForm(false)}/>}
      <section aria-label="Ringkasan statistik" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rencana Aktif" value={activePlans.length} icon={FolderKanban} helper="Proyek dan goal aktif"/>
        <StatCard label="Total Tugas" value={activeTasks.length} icon={ListTodo} helper="Pada rencana aktif"/>
        <StatCard label="Selesai" value={completed} icon={CheckCircle2} helper="Tugas yang dituntaskan"/>
        <StatCard label="Dikerjakan" value={inProgress} icon={Clock3} helper="Sedang dalam proses"/>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Progres keseluruhan</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tugas pada rencana yang aktif</p></div><span className="text-3xl font-extrabold text-brand-600 dark:text-brand-100">{percent}%</span></div>
          <div className="mt-7"><ProgressBar value={percent}/></div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{completed} dari {activeTasks.length} tugas selesai</p>
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-center dark:border-slate-800"><div><p className="text-xl font-bold">{activeTasks.filter((t)=>t.status === "todo").length}</p><p className="text-xs text-slate-500">Belum mulai</p></div><div><p className="text-xl font-bold">{inProgress}</p><p className="text-xs text-slate-500">Dikerjakan</p></div><div><p className="text-xl font-bold">{completed}</p><p className="text-xs text-slate-500">Selesai</p></div></div>
        </Card>
        <Card className="overflow-hidden bg-linear-to-br from-brand-600 to-indigo-800 p-6 text-white dark:border-indigo-800 dark:from-indigo-700 dark:to-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">Fokus hari ini</p><h2 className="mt-4 max-w-xs text-2xl font-bold leading-tight">Satu langkah kecil, progres yang berarti.</h2><p className="mt-3 max-w-sm text-sm leading-relaxed text-indigo-100">Tambahkan rencana seperti program gym atau proyek pekerjaan, lalu pecah menjadi tugas-tugas kecil.</p><Link to="/app/plans" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Kelola rencana <ArrowRight size={16}/></Link>
        </Card>
      </div>
      <section aria-labelledby="plans-heading">
        <div className="mb-4 flex items-center justify-between"><h2 id="plans-heading" className="text-xl font-bold">Rencana aktif</h2><Link to="/app/plans" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-100">Lihat semua →</Link></div>
        {activePlans.length ? <div className="grid gap-4 md:grid-cols-3">
          {activePlans.slice(0,6).map((plan)=>{
            const PlanIcon = plan.kind === "goal" ? Target : FolderKanban;
            const progress = getPlanProgress(plan, tasks, milestones);
            return <Link key={plan.id} to={`/app/plans/${plan.id}`} className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
              <Card className="h-full p-5 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-white ${categoryColors[plan.category]}`}><PlanIcon size={19}/></div>
                <h3 className="font-bold">{plan.name}</h3><p className="mt-1 min-h-10 text-sm text-slate-500 dark:text-slate-400">{plan.description || "Belum ada deskripsi."}</p><p className="mt-2 text-xs text-slate-500">{kindLabels[plan.kind]} · {periodLabels[plan.period]}</p>
                <div className="mt-5 flex justify-between text-xs"><span className="text-slate-500">{progress.caption}</span><span className="font-bold">{progress.percent}%</span></div><div className="mt-2"><ProgressBar value={progress.percent} label={`Progres ${plan.name}`}/></div>
              </Card>
            </Link>;
          })}
        </div> : <Card className="p-5"><EmptyState message="Belum ada rencana aktif. Buat rencana pertamamu di halaman Rencana."/></Card>}
      </section>
      {/* Panel terpisah: progres habit selalu per-minggu, bukan progres kumulatif Goal. */}
      <section aria-labelledby="habits-heading">
        <div className="mb-4 flex items-center justify-between"><h2 id="habits-heading" className="flex items-center gap-2 text-xl font-bold"><Repeat2 size={21} className="text-brand-600"/> Aktivitas minggu ini</h2><Link to="/app/habits" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-100">Kelola habits →</Link></div>
        {activeHabits.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeHabits.slice(0, 6).map((habit) => {
            const progress = getWeeklyProgress(habit, habitLogs, weekToday, habitTargets);
            return <Link key={habit.id} to={`/app/plans/${habit.planId}`} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-brand-600"><Card className="h-full p-5">
              <h3 className="font-bold">{habit.name}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{progress.completed} / {progress.target} sesi minggu ini</p>
              <div className="mt-3"><ProgressBar value={progress.percent} label={`Progres mingguan ${habit.name}`}/></div><p className="mt-2 text-right text-xs font-bold text-brand-600">{progress.percent}%</p>
            </Card></Link>;
          })}
        </div> : <Card className="p-5"><EmptyState message="Belum ada aktivitas berulang. Buat Habit pada Goal milikmu."/></Card>}
      </section>
      <section aria-label="Ringkasan evaluasi pribadi">
        <Link to="/app/analytics" className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Evaluasi & Analitik</h2><p className="mt-1 text-sm text-slate-500">Lihat tren mingguan/bulanan, konsistensi tahunan, target historis, dan refleksi pribadi.</p></div><span className="text-sm font-semibold text-brand-600">Lihat evaluasi →</span></div>
        </Link>
      </section>
      <section aria-labelledby="recent-heading">
        <div className="mb-4 flex items-center justify-between"><h2 id="recent-heading" className="text-xl font-bold">Tugas terbaru</h2><Link to="/app/tasks" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-100">Semua tugas →</Link></div>
        <Card className="space-y-2 p-3 sm:p-4">{recentTasks.length ? recentTasks.map((task)=><TaskRow key={task.id} task={task}/>) : <EmptyState message="Belum ada tugas pada rencana aktif."/>}</Card>
      </section>
    </div>
  );
}
