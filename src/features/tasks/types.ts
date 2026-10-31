export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  // Kolom projectId dipertahankan sampai migrasi database supaya data Tahap 2 tidak hilang.
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
};

export type CreateTaskInput = Pick<Task, "title" | "projectId" | "priority" | "dueDate">;
