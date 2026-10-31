import type { Plan } from "./types";
import type { Task } from "../tasks/types";

export type WorkspaceData = { plans: Plan[]; tasks: Task[] };

// Operasi murni ini tidak memakai React sehingga mudah diuji secara terpisah.
export function insertPlan(workspace: WorkspaceData, plan: Plan): WorkspaceData {
  return { ...workspace, plans: [plan, ...workspace.plans] };
}
export function replacePlan(workspace: WorkspaceData, plan: Plan): WorkspaceData {
  return { ...workspace, plans: workspace.plans.map((current) => current.id === plan.id ? plan : current) };
}
export function removePlanAndTasks(workspace: WorkspaceData, id: string): WorkspaceData {
  return {
    plans: workspace.plans.filter((plan) => plan.id !== id),
    tasks: workspace.tasks.filter((task) => task.projectId !== id),
  };
}
export function insertTask(workspace: WorkspaceData, task: Task): WorkspaceData {
  if (!workspace.plans.some((plan) => plan.id === task.projectId && plan.status === "active")) {
    return workspace;
  }
  return { ...workspace, tasks: [task, ...workspace.tasks] };
}
export function updateTaskInWorkspace(workspace: WorkspaceData, id: string, status: Task["status"]): WorkspaceData {
  return { ...workspace, tasks: workspace.tasks.map((task) => task.id === id ? { ...task, status } : task) };
}
export function removeTaskFromWorkspace(workspace: WorkspaceData, id: string): WorkspaceData {
  return { ...workspace, tasks: workspace.tasks.filter((task) => task.id !== id) };
}
