import type { ReactNode } from "react";
import { TaskContext } from "./taskContext";
import { validateTaskInput } from "./taskRules";
import type { CreateTaskInput, Task, TaskStatus } from "./types";
import { PlanContext } from "../plans/planContext";
import { validatePlanInput } from "../plans/planRules";
import { defaultGoalSettings, isGoalProgressMode, validateGoalMetric, validateMilestoneInput } from "../plans/goalRules";
import type { GoalMetric, GoalProgressMode, Milestone, MilestoneInput, Plan, PlanInput } from "../plans/types";
import {
  insertPlan, replacePlan, removePlanAndTasks,
  insertTask, replaceTaskInWorkspace, updateTaskInWorkspace, removeTaskFromWorkspace,
  changeGoalMode, setGoalMetric, insertMilestone, replaceMilestone, setMilestoneComplete, removeMilestone,
} from "../plans/workspaceOperations";
import type { Habit, HabitInput, HabitLog, HabitReflection } from "../habits/types";
import { canCheckIn, todayLocalISO, validateHabitInput } from "../habits/habitRules";
import { insertHabit, replaceHabit, removeHabitAndLogs, toggleHabitLog, saveReflection, removeReflection } from "../habits/habitOperations";
import { validateReflection } from "../habits/reflectionRules";
import { weekStartISO } from "../habits/habitRules";
import { isDateISO } from "../plans/planRules";
import { HabitContext } from "../habits/habitContext";
import { CloudContext } from "../cloud/cloudContext";
import { useCloudWorkspace } from "../cloud/useCloudWorkspace";
import CloudRecoveryScreen from "../cloud/CloudRecoveryScreen";
import { emptyWorkspace } from "../cloud/cloudRules";

export function TaskProvider({ children, userId }: { children: ReactNode; userId: string }) {
  // Seluruh state lama tetap digunakan, tetapi disimpan ke Supabase dengan versi CAS.
  const cloud = useCloudWorkspace(userId);
  const { workspace, setWorkspace } = cloud;
  const { plans, tasks, milestones, habits, habitLogs, habitTargets, reflections } = workspace;

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
    setWorkspace((old) => replaceHabit(old, id, input, new Date().toISOString(), todayLocalISO()));
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
  function saveHabitReflection(habitId: string, weekStart: string, note: string, rating: number | null): boolean {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || !plans.some((p) => p.id === habit.planId && p.kind === "goal" && p.status === "active") ||
        validateReflection(note, rating) || !isDateISO(weekStart) || weekStart !== weekStartISO(weekStart) ||
        weekStart > weekStartISO(todayLocalISO()) || weekStart < weekStartISO(habit.startDate) ||
        (habit.endDate !== null && weekStart > habit.endDate)) return false;
    const now = new Date().toISOString();
    const entry: HabitReflection = { id: crypto.randomUUID(), habitId, weekStart, note, rating, updatedAt: now };
    setWorkspace((old) => saveReflection(old, entry, todayLocalISO()));
    return true;
  }
  function deleteHabitReflection(habitId: string, weekStart: string) {
    setWorkspace((old) => removeReflection(old, habitId, weekStart));
  }
  function resetDemo() { setWorkspace(emptyWorkspace()); }

  const cloudValue = {
    phase: cloud.phase, error: cloud.error, draft: cloud.draft,
    retrySave: cloud.retrySave, reloadCloud: cloud.reloadCloud,
    recoverDraft: cloud.recoverDraft, discardDraft: cloud.discardDraft,
    importLocalData: cloud.importLocalData, availableLocalData: cloud.availableLocalData,
    exportBackup: cloud.exportBackup,
  };
  if (cloud.phase === "loading") {
    return <div role="status" className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300">Memuat workspace dari Supabase…</div>;
  }
  if (cloud.phase === "fatal" || cloud.phase === "recovery" || cloud.phase === "conflict") {
    return <CloudContext.Provider value={cloudValue}><CloudRecoveryScreen /></CloudContext.Provider>;
  }
  return (
    <CloudContext.Provider value={cloudValue}>
      <TaskContext.Provider value={{ tasks, addTask, updateTask, updateTaskStatus, deleteTask, resetDemo }}>
        <PlanContext.Provider value={{
          plans, milestones, addPlan, updatePlan, setPlanArchived, deletePlan,
          setGoalMode, updateGoalMetric, addMilestone, updateMilestone, toggleMilestone, deleteMilestone,
        }}>
          <HabitContext.Provider value={{ habits, habitLogs, habitTargets, reflections, addHabit, updateHabit, deleteHabit, toggleHabitCheckIn, saveHabitReflection, deleteHabitReflection }}>
            {children}
          </HabitContext.Provider>
        </PlanContext.Provider>
      </TaskContext.Provider>
    </CloudContext.Provider>
  );
}
