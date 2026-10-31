import { CalendarDays, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { formatDate, projects, statusLabels } from "../demoData";
import { useTasks } from "../taskContext";
import type { Task, TaskStatus } from "../types";

const priorityLabels = { low: "Rendah", medium: "Sedang", high: "Tinggi" } as const;
const priorityStyles = {
  low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export function TaskRow({ task }: { task: Task }) {
  const { updateTaskStatus, deleteTask } = useTasks();
  const project = projects.find((item) => item.id === task.projectId);

  function handleDelete() {
    if (window.confirm(`Hapus tugas "${task.title}"?`)) deleteTask(task.id);
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <h3 className={`text-sm font-semibold ${task.status === "done" ? "text-slate-400 line-through" : "text-slate-900 dark:text-white"}`}>{task.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {project && <Link className="hover:text-brand-600 hover:underline" to={`/app/projects/${project.id}`}>{project.name}</Link>}
          <span aria-hidden="true">•</span>
          <CalendarDays size={13} aria-hidden="true" />
          <span>{formatDate(task.dueDate)}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${priorityStyles[task.priority]}`}>{priorityLabels[task.priority]}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={task.status}
          onChange={(event) => updateTaskStatus(task.id, event.target.value as TaskStatus)}
          aria-label={`Status tugas ${task.title}`}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:flex-none"
        >
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-600 dark:hover:bg-red-950"
          aria-label={`Hapus tugas ${task.title}`}
          title="Hapus tugas"
        ><Trash2 size={17} aria-hidden="true" /></button>
      </div>
    </article>
  );
}
