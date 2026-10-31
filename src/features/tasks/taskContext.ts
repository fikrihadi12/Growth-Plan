import { createContext, useContext } from "react";
import type { CreateTaskInput, Task, TaskStatus } from "./types";

export type TaskContextValue = {
  tasks: Task[];
  addTask: (input: CreateTaskInput) => boolean;
  updateTask: (id: string, input: CreateTaskInput) => boolean;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  resetDemo: () => void;
};

// Dipisahkan dari komponen Provider supaya React Fast Refresh tidak memberikan warning.
export const TaskContext = createContext<TaskContextValue | null>(null);
export function useTasks() {
  const value = useContext(TaskContext);
  if (!value) throw new Error("useTasks harus dipanggil di dalam TaskProvider");
  return value;
}
