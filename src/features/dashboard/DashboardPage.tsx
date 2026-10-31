import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, FolderKanban, ListTodo, Plus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { EmptyState } from "../../components/common/EmptyState";
import { TaskForm } from "../tasks/components/TaskForm";
import { TaskRow } from "../tasks/components/TaskRow";
import { useTasks } from "../tasks/taskContext";
import { completionPercent, projects } from "../tasks/demoData";

export default function DashboardPage() {
  const { tasks } = useTasks();
  const [showForm, setShowForm] = useState(false);

  // Angka dashboard dihitung dari data yang sama, bukan disimpan di state terpisah.
  const completed = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const percent = completionPercent(tasks);
  const recentTasks = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-100">Workspace overview</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Selamat datang di TaskFlow <span aria-hidden="true">👋</span></h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pantau proyek dan kelola prioritasmu dari satu tempat.</p>
        </div>
        <Button onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}><Plus size={18} /> {showForm ? "Tutup formulir" : "Tambah tugas"}</Button>
      </div>

      {showForm && <TaskForm onClose={() => setShowForm(false)} />}

      <section aria-label="Ringkasan statistik" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Proyek" value={projects.length} icon={FolderKanban} helper="Proyek contoh yang tersedia" />
        <StatCard label="Total Tugas" value={tasks.length} icon={ListTodo} helper="Semua tugas tersimpan" />
        <StatCard label="Selesai" value={completed} icon={CheckCircle2} helper="Tugas yang dituntaskan" />
        <StatCard label="Dikerjakan" value={inProgress} icon={Clock3} helper="Sedang dalam proses" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-bold">Progres keseluruhan</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Perkembangan semua tugas</p></div>
            <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-100">{percent}%</span>
          </div>
          <div className="mt-7"><ProgressBar value={percent} /></div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{completed} dari {tasks.length} tugas selesai</p>
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
            <div><p className="text-xl font-bold">{tasks.filter((task) => task.status === "todo").length}</p><p className="text-xs text-slate-500">Belum mulai</p></div>
            <div><p className="text-xl font-bold">{inProgress}</p><p className="text-xs text-slate-500">Dikerjakan</p></div>
            <div><p className="text-xl font-bold">{completed}</p><p className="text-xs text-slate-500">Selesai</p></div>
          </div>
        </Card>
        <Card className="overflow-hidden bg-linear-to-br from-brand-600 to-indigo-800 p-6 text-white dark:border-indigo-800 dark:from-indigo-700 dark:to-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">Fokus hari ini</p>
          <h2 className="mt-4 max-w-xs text-2xl font-bold leading-tight">Satu langkah kecil, progres yang berarti.</h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-indigo-100">Gunakan daftar tugas untuk menentukan apa yang perlu diselesaikan berikutnya.</p>
          <Link to="/app/tasks" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Lihat semua tugas <ArrowRight size={16} /></Link>
        </Card>
      </div>

      <section aria-labelledby="project-heading">
        <div className="mb-4 flex items-center justify-between gap-2"><h2 id="project-heading" className="text-xl font-bold">Proyek aktif</h2><Link to="/app/projects" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-100">Lihat semua →</Link></div>
        <div className="grid gap-4 md:grid-cols-3">
          {projects.map((project) => {
            const projectTasks = tasks.filter((task) => task.projectId === project.id);
            const projectPercent = completionPercent(projectTasks);
            return (
              <Link key={project.id} to={`/app/projects/${project.id}`} className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                <Card className="h-full p-5 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <div className={`mb-4 h-10 w-10 rounded-xl ${project.color}`} aria-hidden="true" />
                  <h3 className="font-bold">{project.name}</h3>
                  <p className="mt-1 min-h-10 text-sm text-slate-500 dark:text-slate-400">{project.description}</p>
                  <div className="mt-5 flex justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">{projectTasks.length} tugas</span><span className="font-bold">{projectPercent}%</span></div>
                  <div className="mt-2"><ProgressBar value={projectPercent} label={`Progres ${project.name}`} /></div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="recent-heading">
        <div className="mb-4 flex items-center justify-between"><h2 id="recent-heading" className="text-xl font-bold">Tugas terbaru</h2><Link to="/app/tasks" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-100">Semua tugas →</Link></div>
        <Card className="space-y-2 p-3 sm:p-4">
          {recentTasks.length ? recentTasks.map((task) => <TaskRow key={task.id} task={task} />) : <EmptyState message="Belum ada tugas. Tambahkan tugas pertamamu." />}
        </Card>
      </section>
    </div>
  );
}
