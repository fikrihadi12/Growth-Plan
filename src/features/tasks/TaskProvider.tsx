import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createDemoTasks } from "./demoData";
import type { CreateTaskInput, Task, TaskStatus } from "./types";
import { TaskContext } from "./taskContext";

const STORAGE_KEY = "taskflow.demo.tasks.v1";

function readInitialTasks(): Task[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDemoTasks();
    const parsed: unknown = JSON.parse(raw);
    // Data storage bisa saja rusak; hanya gunakan array yang bentuknya sesuai.
    if (Array.isArray(parsed) && parsed.every((item) =>
      item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.title === "string" &&
      typeof item.projectId === "string" &&
      ["todo", "in_progress", "done"].includes(item.status) &&
      ["low", "medium", "high"].includes(item.priority) &&
      (item.dueDate === null || (typeof item.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.dueDate))) &&
      typeof item.createdAt === "string"
    )) return parsed as Task[];
  } catch { /* localStorage diblokir atau JSON tidak valid */ }
  return createDemoTasks();
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(readInitialTasks);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
    catch { /* mode privat bisa memblokir penyimpanan */ }
  }, [tasks]);

  function addTask(input: CreateTaskInput) {
    const title = input.title.trim();
    if (!title) return;
    const task: Task = {
      ...input,
      id: crypto.randomUUID(),
      title,
      status: "todo",
      createdAt: new Date().toISOString(),
    };
    setTasks((previous) => [task, ...previous]);
  }

  function updateTaskStatus(id: string, status: TaskStatus) {
    setTasks((previous) => previous.map((task) => task.id === id ? { ...task, status } : task));
  }

  function deleteTask(id: string) {
    setTasks((previous) => previous.filter((task) => task.id !== id));
  }

  function resetDemo() { setTasks(createDemoTasks()); }

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTaskStatus, deleteTask, resetDemo }}>
      {children}
    </TaskContext.Provider>
  );
}

