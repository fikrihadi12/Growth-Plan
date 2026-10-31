import { createContext, useContext } from "react";
import type { CreateTaskInput, Task, TaskStatus } from "./types";

export type TaskContextValue = {
  tasks: Task[];
  addTask: (input: CreateTaskInput) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  resetDemo: () => void;
};

// Modul .ts ini memegang Context dan hook; TaskProvider.tsx hanya ekspor komponen.
export const TaskContext = createContext<TaskContextValue | null>(null);

export function useTasks() {
  const value = useContext(TaskContext);
  if (!value) throw new Error("useTasks harus dipanggil di dalam TaskProvider");
  return value;
}
