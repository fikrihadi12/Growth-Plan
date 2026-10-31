import { defaultGoalSettings, isGoalSettings, validateMilestoneInput } from "./goalRules.ts";
import { isPlan, isDateISO } from "./planRules.ts";
import type { Milestone, Plan } from "./types";
import type { Task } from "../tasks/types";
import type { WorkspaceData } from "./workspaceOperations";

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const unique = (values: string[]) => new Set(values).size === values.length;

export function isTask(value: unknown): value is Task {
  if (!object(value)) return false;
  return nonEmpty(value.id) && nonEmpty(value.projectId) &&
    typeof value.title === "string" && nonEmpty(value.createdAt) &&
    (value.status === "todo" || value.status === "in_progress" || value.status === "done") &&
    (value.priority === "low" || value.priority === "medium" || value.priority === "high") &&
    (value.dueDate === null || isDateISO(value.dueDate));
}
export function isMilestone(value: unknown): value is Milestone {
  if (!object(value)) return false;
  return nonEmpty(value.id) && nonEmpty(value.planId) && nonEmpty(value.createdAt) &&
    (value.completedAt === null || nonEmpty(value.completedAt)) &&
    validateMilestoneInput({ title: value.title as string, dueDate: value.dueDate as string | null }) === null;
}

/** Versi 3: Goal memiliki konfigurasi progres, dan milestone terpisah dari tugas. */
export function parseWorkspaceV3(value: unknown): WorkspaceData | null {
  if (!object(value) || !Array.isArray(value.plans) || !Array.isArray(value.tasks) || !Array.isArray(value.milestones)) return null;
  if (!value.plans.every(isPlan) || !value.tasks.every(isTask) || !value.milestones.every(isMilestone)) return null;
  const plans = value.plans as Plan[];
  const tasks = value.tasks as Task[];
  const milestones = value.milestones as Milestone[];
  if (!unique(plans.map((p) => p.id)) || !unique(tasks.map((t) => t.id)) || !unique(milestones.map((m) => m.id))) return null;
  const byId = new Map(plans.map((p) => [p.id, p]));
  if (!plans.every((p) => p.kind === "goal" ? isGoalSettings(p.goal) : p.goal === null)) return null;
  if (!tasks.every((t) => byId.has(t.projectId))) return null;
  if (!milestones.every((m) => byId.get(m.planId)?.kind === "goal")) return null;
  return { plans, tasks, milestones };
}

/** Migrasi V2 mempertahankan semua ID rencana dan tugas yang dibuat pengguna. */
export function upgradeWorkspaceV2(value: unknown): WorkspaceData | null {
  if (!object(value) || !Array.isArray(value.plans) || !Array.isArray(value.tasks)) return null;
  if (!value.plans.every(isPlan) || !value.tasks.every(isTask)) return null;
  const plans = value.plans as Plan[];
  const tasks = value.tasks as Task[];
  if (!unique(plans.map((p) => p.id)) || !unique(tasks.map((t) => t.id))) return null;
  const ids = new Set(plans.map((p) => p.id));
  if (!tasks.every((task) => ids.has(task.projectId))) return null;
  return {
    plans: plans.map((p) => ({ ...p, goal: p.kind === "goal" ? defaultGoalSettings() : null })),
    tasks,
    milestones: [],
  };
}
