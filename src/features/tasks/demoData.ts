import type { Project, Task, TaskStatus } from "./types";

// Data MOCK; seluruh nama proyek dan tugas contoh, belum tersimpan di database.
export const projects: Project[] = [
  { id: "p-learning", name: "E-Modul Interaktif", description: "Pengembangan materi pembelajaran digital", color: "bg-violet-500" },
  { id: "p-portfolio", name: "Portfolio Website", description: "Website pribadi dan dokumentasi karya", color: "bg-sky-500" },
  { id: "p-taskflow", name: "TaskFlow App", description: "Aplikasi manajemen proyek berbasis React", color: "bg-emerald-500" },
];

export const statusLabels: Record<TaskStatus, string> = {
  todo: "Belum mulai",
  in_progress: "Dikerjakan",
  done: "Selesai",
};

function dateAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDemoTasks(): Task[] {
  const createdAt = new Date().toISOString();
  return [
    { id: "demo-1", projectId: "p-taskflow", title: "Menyusun design system", status: "done", priority: "high", dueDate: dateAfter(-1), createdAt },
    { id: "demo-2", projectId: "p-taskflow", title: "Membuat layout dashboard", status: "in_progress", priority: "high", dueDate: dateAfter(2), createdAt },
    { id: "demo-3", projectId: "p-taskflow", title: "Menguji navigasi mobile", status: "todo", priority: "medium", dueDate: dateAfter(4), createdAt },
    { id: "demo-4", projectId: "p-learning", title: "Menyusun evaluasi e-modul", status: "in_progress", priority: "medium", dueDate: dateAfter(3), createdAt },
    { id: "demo-5", projectId: "p-learning", title: "Membuat halaman materi", status: "done", priority: "medium", dueDate: dateAfter(-2), createdAt },
    { id: "demo-6", projectId: "p-portfolio", title: "Memilih desain beranda", status: "todo", priority: "low", dueDate: dateAfter(6), createdAt },
    { id: "demo-7", projectId: "p-portfolio", title: "Mengumpulkan daftar proyek", status: "done", priority: "low", dueDate: dateAfter(-3), createdAt },
    { id: "demo-8", projectId: "p-taskflow", title: "Menyiapkan dokumentasi GitHub", status: "todo", priority: "medium", dueDate: dateAfter(7), createdAt },
  ];
}

export function completionPercent(tasks: Task[]): number {
  return tasks.length ? Math.round(tasks.filter((task) => task.status === "done").length / tasks.length * 100) : 0;
}

export function formatDate(dateISO: string | null): string {
  if (!dateISO) return "Tanpa tenggat";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return "Tanggal tidak valid";
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak valid";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
