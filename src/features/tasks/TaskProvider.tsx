import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createDemoTasks } from "./demoData";
import { TaskContext } from "./taskContext";
import type { CreateTaskInput, Task, TaskStatus } from "./types";
import { PlanContext } from "../plans/planContext";
import { createDemoPlans } from "../plans/demoPlans";
import { isPlan, validatePlanInput } from "../plans/planRules";
import type { Plan, PlanInput } from "../plans/types";
import { insertPlan, replacePlan, removePlanAndTasks, insertTask, updateTaskInWorkspace, removeTaskFromWorkspace } from "../plans/workspaceOperations";

const STORAGE_KEY = "taskflow.demo.workspace.v2";
const OLD_TASKS_KEY = "taskflow.demo.tasks.v1";

type Workspace = { plans: Plan[]; tasks: Task[] };

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const t = value as Partial<Task>;
  return typeof t.id === "string" && typeof t.projectId === "string" &&
    typeof t.title === "string" && typeof t.createdAt === "string" &&
    ["todo", "in_progress", "done"].includes(t.status ?? "") &&
    ["low", "medium", "high"].includes(t.priority ?? "") &&
    (t.dueDate === null || (typeof t.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)));
}

function demoWorkspace(): Workspace { return { plans: createDemoPlans(), tasks: createDemoTasks() }; }

function readWorkspace(): Workspace {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const value: unknown = JSON.parse(raw);
      if (value && typeof value === "object") {
        const workspace = value as Partial<Workspace>;
        if (Array.isArray(workspace.plans) && workspace.plans.every(isPlan) &&
            Array.isArray(workspace.tasks) && workspace.tasks.every(isTask)) {
          const ids = new Set(workspace.plans.map((plan) => plan.id));
          if (ids.size === workspace.plans.length && workspace.tasks.every((task) => ids.has(task.projectId))) {
            return { plans: workspace.plans, tasks: workspace.tasks };
          }
        }
      }
      // Simpan cadangan data korup sebelum memulai workspace demo baru.
      try { window.localStorage.setItem(`${STORAGE_KEY}.invalid-backup`, raw); } catch { /* backup mungkin diblokir */ }
      return demoWorkspace();
    }
    // Migrasi sekali dari localStorage Tahap 2 dengan ID proyek yang sama.
    const initial = demoWorkspace();
    const old = window.localStorage.getItem(OLD_TASKS_KEY);
    if (old) {
      const parsed: unknown = JSON.parse(old);
      if (Array.isArray(parsed) && parsed.every(isTask)) {
        const ids = new Set(initial.plans.map((plan) => plan.id));
        if (parsed.every((task) => ids.has(task.projectId))) initial.tasks = parsed;
      }
    }
    return initial;
  } catch {
    // localStorage bisa dinonaktifkan, atau data tersimpan rusak.
    return demoWorkspace();
  }
}

export function TaskProvider({ children }: { children: ReactNode }) {
  // Satu state untuk Plan + Task agar penghapusan Plan dan tugasnya bersifat atomik.
  const [workspace, setWorkspace] = useState<Workspace>(readWorkspace);
  const { plans, tasks } = workspace;

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); }
    catch { /* browser dapat menolak penyimpanan; data tetap berlaku selama sesi */ }
  }, [workspace]);

  function addPlan(input: PlanInput): string {
    const error = validatePlanInput(input);
    if (error) throw new Error(error);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const plan: Plan = { ...input, name: input.name.trim(), description: input.description.trim(), id, status: "active", createdAt: now, updatedAt: now };
    setWorkspace((previous) => insertPlan(previous, plan));
    return id;
  }

  function updatePlan(id: string, input: PlanInput) {
    const error = validatePlanInput(input);
    if (error) throw new Error(error);
    setWorkspace((previous) => {
      const existing = previous.plans.find((plan) => plan.id === id);
      if (!existing) return previous;
      return replacePlan(previous, { ...existing, ...input, name: input.name.trim(), description: input.description.trim(), updatedAt: new Date().toISOString() });
    });
  }

  function setPlanArchived(id: string, archived: boolean) {
    setWorkspace((previous) => {
      const existing = previous.plans.find((plan) => plan.id === id);
      if (!existing) return previous;
      return replacePlan(previous, { ...existing, status: archived ? "archived" : "active", updatedAt: new Date().toISOString() });
    });
  }

  function deletePlan(id: string) {
    // Cascade di memori: tugas tidak akan tertinggal dengan projectId yang hilang.
    setWorkspace((previous) => removePlanAndTasks(previous, id));
  }

  function addTask(input: CreateTaskInput): boolean {
    const planIsActive = plans.some((plan) => plan.id === input.projectId && plan.status === "active");
    if (!input.title.trim() || !planIsActive) return false;
    const task: Task = { ...input, id: crypto.randomUUID(), title: input.title.trim(), status: "todo", createdAt: new Date().toISOString() };
    setWorkspace((previous) => insertTask(previous, task));
    return true;
  }
  function updateTaskStatus(id: string, status: TaskStatus) {
    setWorkspace((previous) => updateTaskInWorkspace(previous, id, status));
  }
  function deleteTask(id: string) {
    setWorkspace((previous) => removeTaskFromWorkspace(previous, id));
  }
  function resetDemo() { setWorkspace(demoWorkspace()); }

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTaskStatus, deleteTask, resetDemo }}>
      <PlanContext.Provider value={{ plans, addPlan, updatePlan, setPlanArchived, deletePlan }}>
        {children}
      </PlanContext.Provider>
    </TaskContext.Provider>
  );
}
