import type { WorkspaceData } from "../plans/workspaceOperations";
import type { Habit, HabitInput, HabitLog } from "./types";
import { canCheckIn, validateHabitInput } from "./habitRules.ts";

function editableGoal(workspace: WorkspaceData, planId: string): boolean {
  return workspace.plans.some((plan) => plan.id === planId && plan.kind === "goal" && plan.status === "active");
}

export function insertHabit(workspace: WorkspaceData, habit: Habit): WorkspaceData {
  if (!editableGoal(workspace, habit.planId) || validateHabitInput(habit) ||
    workspace.habits.some((item) => item.id === habit.id)) return workspace;
  return { ...workspace, habits: [habit, ...workspace.habits] };
}

export function replaceHabit(workspace: WorkspaceData, id: string, input: HabitInput, updatedAt: string): WorkspaceData {
  const existing = workspace.habits.find((habit) => habit.id === id);
  if (!existing || !editableGoal(workspace, existing.planId) || validateHabitInput(input)) return workspace;
  // Jangan sampai perubahan tanggal membuat check-in historis menjadi tidak valid.
  if (workspace.habitLogs.some((log) => log.habitId === id &&
      (log.date < input.startDate || (input.endDate !== null && log.date > input.endDate)))) return workspace;
  return {
    ...workspace,
    habits: workspace.habits.map((habit) => habit.id === id ? {
      ...habit, ...input, name: input.name.trim(), scheduledDays: [...input.scheduledDays].sort(), updatedAt,
    } : habit),
  };
}

export function removeHabitAndLogs(workspace: WorkspaceData, id: string): WorkspaceData {
  const existing = workspace.habits.find((habit) => habit.id === id);
  if (!existing || !editableGoal(workspace, existing.planId)) return workspace;
  return {
    ...workspace,
    habits: workspace.habits.filter((habit) => habit.id !== id),
    habitLogs: workspace.habitLogs.filter((log) => log.habitId !== id),
  };
}

export function toggleHabitLog(
  workspace: WorkspaceData, habitId: string, date: string, today: string,
  logFactory: () => HabitLog,
): WorkspaceData {
  const habit = workspace.habits.find((item) => item.id === habitId);
  if (!habit || !editableGoal(workspace, habit.planId) || !canCheckIn(habit, date, today)) return workspace;
  const previous = workspace.habitLogs.find((log) => log.habitId === habitId && log.date === date);
  // Menghapus check-in adalah undo; check-in baru harus punya id unik.
  if (previous) return { ...workspace, habitLogs: workspace.habitLogs.filter((log) => log.id !== previous.id) };
  const newLog = logFactory();
  if (newLog.habitId !== habitId || newLog.date !== date || workspace.habitLogs.some((log) => log.id === newLog.id)) return workspace;
  return { ...workspace, habitLogs: [newLog, ...workspace.habitLogs] };
}
