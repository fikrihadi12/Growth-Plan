import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { EmptyState } from "../../components/common/EmptyState";
import { TaskForm } from "../tasks/components/TaskForm";
import { TaskRow } from "../tasks/components/TaskRow";
import { completionPercent, projects } from "../tasks/demoData";
import { useTasks } from "../tasks/taskContext";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tasks } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const project = projects.find((item) => item.id === id);

  if (!project) return (
    <Card className="p-8"><h1 className="text-xl font-bold">Proyek tidak ditemukan</h1><p className="mt-2 text-sm text-slate-500">Periksa kembali alamat proyek.</p><Link className="mt-4 inline-block text-brand-600 underline" to="/app/projects">Kembali ke semua proyek</Link></Card>
  );

  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const progress = completionPercent(projectTasks);

  return (
    <div className="space-y-6">
      <Link to="/app/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400"><ArrowLeft size={16} /> Kembali ke Proyek</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold">{project.name}</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{project.description}</p></div>
        <Button onClick={() => setShowForm((prev) => !prev)} aria-expanded={showForm}><Plus size={18} /> {showForm ? "Tutup formulir" : "Tambah tugas"}</Button>
      </div>
      {showForm && <TaskForm key={project.id} initialProjectId={project.id} onClose={() => setShowForm(false)} />}
      <Card className="p-6"><div className="mb-4 flex justify-between"><h2 className="font-bold">Progres Proyek</h2><span className="font-bold text-brand-600 dark:text-brand-100">{progress}%</span></div><ProgressBar value={progress} /><p className="mt-3 text-xs text-slate-500">{projectTasks.filter((t) => t.status === "done").length} dari {projectTasks.length} tugas selesai</p></Card>
      <section><h2 className="mb-4 text-xl font-bold">Daftar Tugas</h2><Card className="space-y-2 p-3 sm:p-4">{projectTasks.length ? projectTasks.map((task) => <TaskRow key={task.id} task={task} />) : <EmptyState message="Belum ada tugas di proyek ini." />}</Card></section>
    </div>
  );
}
