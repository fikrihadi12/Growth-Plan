export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type Task = {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
};

export type CreateTaskInput = Pick<Task, "title" | "projectId" | "priority" | "dueDate">;
