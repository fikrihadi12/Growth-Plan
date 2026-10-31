import { Link } from "react-router";
import { ArrowUpRight, FolderKanban } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { completionPercent, projects } from "../tasks/demoData";
import { useTasks } from "../tasks/taskContext";

export default function ProjectsPage() {
  const { tasks } = useTasks();

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-100">Workspace</p><h1 className="mt-1 text-3xl font-bold">Semua Proyek</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Proyek contoh yang dapat kamu buka dan pantau progresnya.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const projectTasks = tasks.filter((task) => task.projectId === project.id);
          const progress = completionPercent(projectTasks);
          return (
            <Link key={project.id} to={`/app/projects/${project.id}`} className="group focus-visible:outline-2 focus-visible:outline-brand-600">
              <Card className="h-full p-6 transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
                <div className="flex items-start justify-between"><div className={`rounded-xl p-3 text-white ${project.color}`}><FolderKanban size={22} /></div><ArrowUpRight className="text-slate-400" size={18} /></div>
                <h2 className="mt-5 text-lg font-bold">{project.name}</h2>
                <p className="mt-1 min-h-10 text-sm text-slate-500 dark:text-slate-400">{project.description}</p>
                <div className="mt-6 flex justify-between text-xs"><span className="text-slate-500">{projectTasks.length} tugas</span><span className="font-bold">{progress}%</span></div>
                <div className="mt-2"><ProgressBar value={progress} label={`Progres ${project.name}`} /></div>
              </Card>
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Penambahan dan pengeditan proyek akan diimplementasikan pada tahap CRUD berikutnya.</p>
    </div>
  );
}
