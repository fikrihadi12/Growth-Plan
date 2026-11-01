import { defaultGoalSettings, isGoalSettings, validateMilestoneInput } from "./goalRules.ts";
import { isPlan, isDateISO } from "./planRules.ts";
import { isHabit, isHabitLog } from "../habits/habitRules.ts";
import type { Milestone, Plan } from "./types";
import type { Task } from "../tasks/types";
import type { Habit, HabitLog, HabitReflection, HabitTargetChange } from "../habits/types";
import { isHabitTargetChange, baselineTarget } from "../habits/targetHistory.ts";
import { isHabitReflection } from "../habits/reflectionRules.ts";
import { weekStartISO } from "../habits/habitRules.ts";
import type { WorkspaceData } from "./workspaceOperations";

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const unique = (values: string[]) => new Set(values).size === values.length;
type WorkspaceV3 = Pick<WorkspaceData, "plans" | "tasks" | "milestones">;
type WorkspaceV4 = Pick<WorkspaceData, "plans" | "tasks" | "milestones" | "habits" | "habitLogs">;

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

/** V3: Goal Settings + milestones. Tetap tersedia untuk migrasi dan regression test. */
export function parseWorkspaceV3(value: unknown): WorkspaceV3 | null {
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

/** Menjaga seluruh ID dan data pengguna V3; tidak menimpa localStorage V3. */
export function upgradeWorkspaceV3(value: unknown): WorkspaceV4 | null {
  const old = parseWorkspaceV3(value);
  return old ? { ...old, habits: [], habitLogs: [] } : null;
}

/** V2 -> V4 fallback: saat user melewati Tahap 3B, relasi tetap utuh. */
export function upgradeWorkspaceV2(value: unknown): WorkspaceV4 | null {
  if (!object(value) || !Array.isArray(value.plans) || !Array.isArray(value.tasks)) return null;
  if (!value.plans.every(isPlan) || !value.tasks.every(isTask)) return null;
  const plans = value.plans as Plan[];
  const tasks = value.tasks as Task[];
  if (!unique(plans.map((p) => p.id)) || !unique(tasks.map((t) => t.id))) return null;
  const ids = new Set(plans.map((p) => p.id));
  if (!tasks.every((task) => ids.has(task.projectId))) return null;
  return {
    plans: plans.map((p) => ({ ...p, goal: p.kind === "goal" ? defaultGoalSettings() : null })),
    tasks, milestones: [], habits: [], habitLogs: [],
  };
}

/** Validasi V4: termasuk foreign key Habit -> Goal, log -> Habit, dan 1 log per tanggal. */
export function parseWorkspaceV4(value: unknown): WorkspaceV4 | null {
  const old = parseWorkspaceV3(value);
  if (!old || !object(value) || !Array.isArray(value.habits) || !Array.isArray(value.habitLogs)) return null;
  if (!value.habits.every(isHabit) || !value.habitLogs.every(isHabitLog)) return null;
  const habits = value.habits as Habit[];
  const habitLogs = value.habitLogs as HabitLog[];
  if (!unique(habits.map((habit) => habit.id)) || !unique(habitLogs.map((log) => log.id))) return null;
  const plansById = new Map(old.plans.map((plan) => [plan.id, plan]));
  const habitsById = new Map(habits.map((habit) => [habit.id, habit]));
  if (!habits.every((habit) => plansById.get(habit.planId)?.kind === "goal")) return null;
  if (!unique(habitLogs.map((log) => `${log.habitId}|${log.date}`))) return null;
  if (!habitLogs.every((log) => {
    const habit = habitsById.get(log.habitId);
    return !!habit && isDateISO(log.date) && log.date >= habit.startDate &&
      (habit.endDate === null || log.date <= habit.endDate);
  })) return null;
  return { ...old, habits, habitLogs };
}

/** Migrasi V4→V5: target historis sebelumnya tidak diketahui, jadi target V4 menjadi baseline. */
export function upgradeWorkspaceV4(value: unknown): WorkspaceData | null {
  const old = parseWorkspaceV4(value);
  if (!old) return null;
  return {
    ...old,
    habitTargets: old.habits.map((h) => baselineTarget(h, weekStartISO(h.startDate))),
    reflections: [],
  };
}

/** Validator V5: semua relasi, snapshot dan refleksi diperiksa sebelum dipakai. */
export function parseWorkspaceV5(value: unknown): WorkspaceData | null {
  const old = parseWorkspaceV4(value);
  if (!old || !object(value) || !Array.isArray(value.habitTargets) || !Array.isArray(value.reflections)) return null;
  if (!value.habitTargets.every(isHabitTargetChange) || !value.reflections.every(isHabitReflection)) return null;
  const habitTargets = value.habitTargets as HabitTargetChange[];
  const reflections = value.reflections as HabitReflection[];
  const habitsById = new Map(old.habits.map((h) => [h.id, h]));
  if (!unique(habitTargets.map((h) => `${h.habitId}|${h.effectiveWeek}`)) ||
      !unique(reflections.map((r) => r.id)) ||
      !unique(reflections.map((r) => `${r.habitId}|${r.weekStart}`))) return null;
  if (!habitTargets.every((h) => {
    const habit = habitsById.get(h.habitId);
    return !!habit && h.effectiveWeek >= weekStartISO(habit.startDate);
  })) return null;
  if (!old.habits.every((habit) => habitTargets.some((h) =>
      h.habitId === habit.id && h.effectiveWeek === weekStartISO(habit.startDate)))) return null;
  if (!reflections.every((r) => {
    const habit = habitsById.get(r.habitId);
    return !!habit && r.weekStart >= weekStartISO(habit.startDate) &&
      (habit.endDate === null || r.weekStart <= habit.endDate);
  })) return null;
  return { ...old, habitTargets, reflections };
}
