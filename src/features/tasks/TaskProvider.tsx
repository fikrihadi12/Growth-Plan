import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createDemoTasks } from "./demoData";
import { TaskContext } from "./taskContext";
import { validateTaskInput } from "./taskRules";
import type { CreateTaskInput, Task, TaskStatus } from "./types";
import { PlanContext } from "../plans/planContext";
import { createDemoPlans } from "../plans/demoPlans";
import { validatePlanInput } from "../plans/planRules";
import { defaultGoalSettings, isGoalProgressMode, validateGoalMetric, validateMilestoneInput } from "../plans/goalRules";
import { isTask, parseWorkspaceV4, upgradeWorkspaceV3, upgradeWorkspaceV2 } from "../plans/workspaceMigration";
import type { GoalMetric, GoalProgressMode, Milestone, MilestoneInput, Plan, PlanInput } from "../plans/types";
import {
  insertPlan, replacePlan, removePlanAndTasks,
  insertTask, replaceTaskInWorkspace, updateTaskInWorkspace, removeTaskFromWorkspace,
  changeGoalMode, setGoalMetric, insertMilestone, replaceMilestone, setMilestoneComplete, removeMilestone,
} from "../plans/workspaceOperations";
import type { WorkspaceData } from "../plans/workspaceOperations";
import type { Habit, HabitInput, HabitLog } from "../habits/types";
import { canCheckIn, todayLocalISO, validateHabitInput } from "../habits/habitRules";
import { insertHabit, replaceHabit, removeHabitAndLogs, toggleHabitLog } from "../habits/habitOperations";
import { HabitContext } from "../habits/habitContext";

const STORAGE_KEY = "taskflow.demo.workspace.v4";
const V3_KEY = "taskflow.demo.workspace.v3";
const V2_KEY = "taskflow.demo.workspace.v2";
const OLD_TASKS_KEY = "taskflow.demo.tasks.v1";

function demoWorkspace(): WorkspaceData {
  return { plans: createDemoPlans(), tasks: createDemoTasks(), milestones: [], habits: [], habitLogs: [] };
}

function backupInvalid(key: string, raw: string) {
  try { window.localStorage.setItem(`${key}.invalid-backup`, raw); }
  catch { /* Penyimpanan browser dapat diblokir. */ }
}

function readWorkspace(): WorkspaceData {
  // Migrasi V3 -> V4 (fallback V2); kunci lama tidak dihapus.
  try {
    const rawV4 = window.localStorage.getItem(STORAGE_KEY);
    if (rawV4 !== null) {
      try {
        const parsed = parseWorkspaceV4(JSON.parse(rawV4));
        if (parsed) return parsed;
      } catch { /* JSON rusak. */ }
      backupInvalid(STORAGE_KEY, rawV4);
    }

    const rawV3 = window.localStorage.getItem(V3_KEY);
    if (rawV3 !== null) {
      try {
        const upgraded = upgradeWorkspaceV3(JSON.parse(rawV3));
        if (upgraded) return upgraded;
      } catch { /* JSON rusak. */ }
      backupInvalid(V3_KEY, rawV3);
    }

    const rawV2 = window.localStorage.getItem(V2_KEY);
    if (rawV2 !== null) {
      try {
        const upgraded = upgradeWorkspaceV2(JSON.parse(rawV2));
        if (upgraded) return upgraded;
      } catch { /* JSON rusak. */ }
      backupInvalid(V2_KEY, rawV2);
    }

    const initial = demoWorkspace();
    const rawLegacy = window.localStorage.getItem(OLD_TASKS_KEY);
    if (rawLegacy !== null) {
      try {
        const value: unknown = JSON.parse(rawLegacy);
        if (Array.isArray(value) && value.every(isTask)) {
          const knownIds = new Set(initial.plans.map((p) => p.id));
          if (value.every((task) => knownIds.has(task.projectId))) initial.tasks = value as Task[];
        }
      } catch { /* Abaikan format lama yang rusak. */ }
    }
    return initial;
  } catch {
    // Demo tetap berfungsi dalam memori jika localStorage diblokir.
    return demoWorkspace();
  }
}

export function TaskProvider({ children }: { children: ReactNode }) {
  // Atomic workspace: relasi Plan -> Task/Milestone/Habit/Log tetap konsisten.
  const [workspace, setWorkspace] = useState<WorkspaceData>(readWorkspace);
  const { plans, tasks, milestones, habits, habitLogs } = workspace;

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); }
    catch { /* Data tetap ada sementara di memori. */ }
  }, [workspace]);

  function addPlan(input: PlanInput): string {
    const error = validatePlanInput(input);
    if (error) throw new Error(error);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const plan: Plan = {
      ...input, name: input.name.trim(), description: input.description.trim(),
      id, status: "active", createdAt: now, updatedAt: now,
      goal: input.kind === "goal" ? defaultGoalSettings() : null,
    };
    setWorkspace((old) => insertPlan(old, plan));
    return id;
  }

  function updatePlan(id: string, input: PlanInput): boolean {
    const error = validatePlanInput(input);
    if (error) throw new Error(error);
    const previous = plans.find((plan) => plan.id === id);
    if (!previous) return false;
    // Goal yang sudah mempunyai milestone/habit tidak bisa diubah jadi Project.
    if (previous.status === "archived") return false;
    if (previous.kind === "goal" && input.kind === "project" &&
      (milestones.some((m) => m.planId === id) || habits.some((h) => h.planId === id))) return false;
    setWorkspace((old) => {
      const current = old.plans.find((plan) => plan.id === id);
      if (!current) return old;
      if (current.status === "archived") return old;
      if (current.kind === "goal" && input.kind === "project" &&
        (old.milestones.some((m) => m.planId === id) || old.habits.some((h) => h.planId === id))) return old;
      return replacePlan(old, {
        ...current, ...input, name: input.name.trim(), description: input.description.trim(),
        goal: input.kind === "goal" ? (current.goal ?? defaultGoalSettings()) : null,
        updatedAt: new Date().toISOString(),
      });
    });
    return true;
  }

  function setPlanArchived(id: string, archived: boolean) {
    setWorkspace((old) => {
      const current = old.plans.find((p) => p.id === id);
      if (!current) return old;
      return replacePlan(old, { ...current, status: archived ? "archived" : "active", updatedAt: new Date().toISOString() });
    });
  }
  function deletePlan(id: string) { setWorkspace((old) => removePlanAndTasks(old, id)); }

  function addTask(input: CreateTaskInput): boolean {
    if (validateTaskInput(input)) return false;
    if (!plans.some((p) => p.id === input.projectId && p.status === "active")) return false;
    const task: Task = {
      ...input, id: crypto.randomUUID(), title: input.title.trim(),
      status: "todo", createdAt: new Date().toISOString(),
    };
    setWorkspace((old) => insertTask(old, task));
    return true;
  }
  function updateTask(id: string, input: CreateTaskInput): boolean {
    if (validateTaskInput(input)) return false;
    const current = tasks.find((t) => t.id === id);
    if (!current) return false;
    if (![current.projectId, input.projectId].every((pId) => plans.some((p) => p.id === pId && p.status === "active"))) return false;
    setWorkspace((old) => replaceTaskInWorkspace(old, id, input));
    return true;
  }
  function updateTaskStatus(id: string, status: TaskStatus) {
    setWorkspace((old) => updateTaskInWorkspace(old, id, status));
  }
  function deleteTask(id: string) { setWorkspace((old) => removeTaskFromWorkspace(old, id)); }

  function setGoalMode(id: string, mode: GoalProgressMode): boolean {
    if (!isGoalProgressMode(mode) || !plans.some((p) => p.id === id && p.kind === "goal" && p.status === "active")) return false;
    setWorkspace((old) => changeGoalMode(old, id, mode));
    return true;
  }
  function updateGoalMetric(id: string, metric: GoalMetric): boolean {
    if (validateGoalMetric(metric) || !plans.some((p) => p.id === id && p.kind === "goal" && p.status === "active")) return false;
    setWorkspace((old) => setGoalMetric(old, id, metric));
    return true;
  }
  function addMilestone(planId: string, input: MilestoneInput): boolean {
    if (validateMilestoneInput(input) || !plans.some((p) => p.id === planId && p.kind === "goal" && p.status === "active")) return false;
    const milestone: Milestone = {
      id: crypto.randomUUID(), planId, title: input.title.trim(), dueDate: input.dueDate,
      createdAt: new Date().toISOString(), completedAt: null,
    };
    setWorkspace((old) => insertMilestone(old, milestone));
    return true;
  }
  function updateMilestone(id: string, input: MilestoneInput): boolean {
    if (validateMilestoneInput(input)) return false;
    const m = milestones.find((m) => m.id === id);
    if (!m || !plans.some((p) => p.id === m.planId && p.kind === "goal" && p.status === "active")) return false;
    setWorkspace((old) => replaceMilestone(old, id, input));
    return true;
  }
  function toggleMilestone(id: string, completed: boolean) {
    setWorkspace((old) => setMilestoneComplete(old, id, completed, new Date().toISOString()));
  }
  function deleteMilestone(id: string) { setWorkspace((old) => removeMilestone(old, id)); }
  function addHabit(planId: string, input: HabitInput): boolean {
    if (validateHabitInput(input) || !plans.some((p) => p.id === planId && p.kind === "goal" && p.status === "active")) return false;
    const now = new Date().toISOString();
    const habit: Habit = {
      ...input, name: input.name.trim(), scheduledDays: [...input.scheduledDays].sort(),
      id: crypto.randomUUID(), planId, createdAt: now, updatedAt: now,
    };
    setWorkspace((old) => insertHabit(old, habit));
    return true;
  }
  function updateHabit(id: string, input: HabitInput): boolean {
    if (validateHabitInput(input)) return false;
    const existing = habits.find((habit) => habit.id === id);
    if (!existing || !plans.some((p) => p.id === existing.planId && p.kind === "goal" && p.status === "active")) return false;
    // Perubahan rentang tanggal tidak boleh membuang log historis diam-diam.
    if (habitLogs.some((log) => log.habitId === id && (log.date < input.startDate ||
      (input.endDate !== null && log.date > input.endDate)))) return false;
    setWorkspace((old) => replaceHabit(old, id, input, new Date().toISOString()));
    return true;
  }
  function deleteHabit(id: string) { setWorkspace((old) => removeHabitAndLogs(old, id)); }
  function toggleHabitCheckIn(id: string, date: string): boolean {
    const habit = habits.find((item) => item.id === id);
    const today = todayLocalISO();
    if (!habit || !plans.some((p) => p.id === habit.planId && p.kind === "goal" && p.status === "active") ||
      !canCheckIn(habit, date, today)) return false;
    setWorkspace((old) => toggleHabitLog(old, id, date, today, (): HabitLog => ({
      id: crypto.randomUUID(), habitId: id, date, createdAt: new Date().toISOString(),
    })));
    return true;
  }
  function resetDemo() { setWorkspace(demoWorkspace()); }

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, updateTaskStatus, deleteTask, resetDemo }}>
      <PlanContext.Provider value={{
        plans, milestones, addPlan, updatePlan, setPlanArchived, deletePlan,
        setGoalMode, updateGoalMetric, addMilestone, updateMilestone, toggleMilestone, deleteMilestone,
      }}>
        <HabitContext.Provider value={{ habits, habitLogs, addHabit, updateHabit, deleteHabit, toggleHabitCheckIn }}>
          {children}
        </HabitContext.Provider>
      </PlanContext.Provider>
    </TaskContext.Provider>
  );
}
