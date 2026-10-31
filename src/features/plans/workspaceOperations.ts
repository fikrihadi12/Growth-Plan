import type { GoalMetric, GoalProgressMode, Milestone, MilestoneInput, Plan } from "./types";
import type { CreateTaskInput, Task } from "../tasks/types";
import { validateGoalMetric, validateMilestoneInput } from "./goalRules.ts";
import { validateTaskInput } from "../tasks/taskRules.ts";

export type WorkspaceData = { plans: Plan[]; tasks: Task[]; milestones: Milestone[] };
const canEdit = (data: WorkspaceData, id: string) => data.plans.some((plan) => plan.id === id && plan.status === "active");
const canEditGoal = (data: WorkspaceData, id: string) => data.plans.some((plan) => plan.id === id && plan.status === "active" && plan.kind === "goal");

// Pure functions: operasi di satu workspace menghindari tugas/milestone yatim.
export function insertPlan(data: WorkspaceData, plan: Plan): WorkspaceData {
  return { ...data, plans: [plan, ...data.plans] };
}
export function replacePlan(data: WorkspaceData, plan: Plan): WorkspaceData {
  return { ...data, plans: data.plans.map((old) => old.id === plan.id ? plan : old) };
}
export function removePlanAndTasks(data: WorkspaceData, id: string): WorkspaceData {
  return {
    plans: data.plans.filter((plan) => plan.id !== id),
    tasks: data.tasks.filter((task) => task.projectId !== id),
    milestones: data.milestones.filter((milestone) => milestone.planId !== id),
  };
}
export function insertTask(data: WorkspaceData, task: Task): WorkspaceData {
  if (!canEdit(data, task.projectId) || data.tasks.some((item) => item.id === task.id)) return data;
  return { ...data, tasks: [task, ...data.tasks] };
}
export function updateTaskInWorkspace(data: WorkspaceData, id: string, status: Task["status"]): WorkspaceData {
  if (!["todo", "in_progress", "done"].includes(status)) return data;
  const task = data.tasks.find((item) => item.id === id);
  if (!task || !canEdit(data, task.projectId)) return data;
  return { ...data, tasks: data.tasks.map((item) => item.id === id ? { ...item, status } : item) };
}
export function replaceTaskInWorkspace(data: WorkspaceData, id: string, input: CreateTaskInput): WorkspaceData {
  const old = data.tasks.find((task) => task.id === id);
  if (!old || !canEdit(data, old.projectId) || !canEdit(data, input.projectId)) return data;
  if (validateTaskInput(input)) return data;
  return {
    ...data,
    tasks: data.tasks.map((task) => task.id === id ? { ...task, ...input, title: input.title.trim() } : task),
  };
}
export function removeTaskFromWorkspace(data: WorkspaceData, id: string): WorkspaceData {
  const old = data.tasks.find((task) => task.id === id);
  if (!old || !canEdit(data, old.projectId)) return data;
  return { ...data, tasks: data.tasks.filter((task) => task.id !== id) };
}

export function changeGoalMode(data: WorkspaceData, id: string, mode: GoalProgressMode): WorkspaceData {
  if (!canEditGoal(data, id) || !["tasks", "milestones", "numeric"].includes(mode)) return data;
  return {
    ...data,
    plans: data.plans.map((plan) => plan.id === id && plan.goal ?
      { ...plan, goal: { ...plan.goal, progressMode: mode }, updatedAt: new Date().toISOString() } : plan),
  };
}
export function setGoalMetric(data: WorkspaceData, id: string, metric: GoalMetric): WorkspaceData {
  if (!canEditGoal(data, id) || validateGoalMetric(metric)) return data;
  return {
    ...data,
    plans: data.plans.map((plan) => plan.id === id && plan.goal ?
      { ...plan, goal: { ...plan.goal, metric: { ...metric, label: metric.label.trim(), unit: metric.unit.trim() } }, updatedAt: new Date().toISOString() } : plan),
  };
}
export function insertMilestone(data: WorkspaceData, milestone: Milestone): WorkspaceData {
  if (!canEditGoal(data, milestone.planId) || data.milestones.some((m) => m.id === milestone.id) ||
    validateMilestoneInput(milestone) !== null) return data;
  return { ...data, milestones: [...data.milestones, milestone] };
}
export function replaceMilestone(data: WorkspaceData, id: string, input: MilestoneInput): WorkspaceData {
  const old = data.milestones.find((m) => m.id === id);
  if (!old || !canEditGoal(data, old.planId) || validateMilestoneInput(input)) return data;
  return { ...data, milestones: data.milestones.map((m) => m.id === id ? { ...m, ...input, title: input.title.trim() } : m) };
}
export function setMilestoneComplete(data: WorkspaceData, id: string, completed: boolean, now: string): WorkspaceData {
  const old = data.milestones.find((m) => m.id === id);
  if (!old || !canEditGoal(data, old.planId)) return data;
  return { ...data, milestones: data.milestones.map((m) => m.id === id ? { ...m, completedAt: completed ? (m.completedAt ?? now) : null } : m) };
}
export function removeMilestone(data: WorkspaceData, id: string): WorkspaceData {
  const old = data.milestones.find((m) => m.id === id);
  if (!old || !canEditGoal(data, old.planId)) return data;
  return { ...data, milestones: data.milestones.filter((m) => m.id !== id) };
}
