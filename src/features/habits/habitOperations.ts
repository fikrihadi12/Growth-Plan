import type { WorkspaceData } from "../plans/workspaceOperations";
import type { Habit, HabitInput, HabitLog } from "./types";
import { canCheckIn, validateHabitInput, weekStartISO, todayLocalISO } from "./habitRules.ts";
import { baselineTarget, setTargetForWeek } from "./targetHistory.ts";
import { validateReflection } from "./reflectionRules.ts";
import { isDateISO } from "../plans/planRules.ts";
import type { HabitReflection } from "./types";

function editableGoal(workspace: WorkspaceData, planId: string): boolean {
  return workspace.plans.some((plan) => plan.id === planId && plan.kind === "goal" && plan.status === "active");
}

export function insertHabit(workspace: WorkspaceData, habit: Habit): WorkspaceData {
  if (!editableGoal(workspace, habit.planId) || validateHabitInput(habit) ||
    workspace.habits.some((item) => item.id === habit.id)) return workspace;
  return { ...workspace, habits: [habit, ...workspace.habits],
    habitTargets: [...(workspace.habitTargets ?? []), baselineTarget(habit, weekStartISO(habit.startDate))],
  };
}

export function replaceHabit(workspace: WorkspaceData, id: string, input: HabitInput, updatedAt: string, today = todayLocalISO()): WorkspaceData {
  const existing = workspace.habits.find((habit) => habit.id === id);
  if (!existing || !editableGoal(workspace, existing.planId) || validateHabitInput(input) || !isDateISO(today)) return workspace;
  // Jangan sampai perubahan tanggal membuat check-in historis menjadi tidak valid.
  if (workspace.habitLogs.some((log) => log.habitId === id &&
      (log.date < input.startDate || (input.endDate !== null && log.date > input.endDate)))) return workspace;
  // Riwayat refleksi juga harus berada dalam rentang baru agar storage V5 tetap valid.
  if ((workspace.reflections ?? []).some((entry) => entry.habitId === id &&
      (entry.weekStart < weekStartISO(input.startDate) ||
       (input.endDate !== null && entry.weekStart > input.endDate)))) return workspace;
  // Jika ada riwayat, tidak boleh memindahkan tanggal mulai sehingga snapshot lama ambigu.
  if (input.startDate !== existing.startDate &&
    (workspace.habitLogs.some((log) => log.habitId === id) || (workspace.reflections ?? []).some((r) => r.habitId === id))) return workspace;
  const base = (workspace.habitTargets ?? []).filter((entry) => entry.habitId !== id);
  let owned = (workspace.habitTargets ?? []).filter((entry) => entry.habitId === id);
  // Belum ada log/refleksi: jadwal snapshot bisa diatur ulang ketika tanggal mulai diganti.
  if (input.startDate !== existing.startDate) owned = [baselineTarget({ ...existing, ...input }, weekStartISO(input.startDate))];
  else if (input.weeklyTarget !== existing.weeklyTarget) {
    const effectiveWeek = today < existing.startDate ? weekStartISO(existing.startDate) : weekStartISO(today);
    owned = setTargetForWeek(owned, id, effectiveWeek, input.weeklyTarget, updatedAt);
  }
  return {
    ...workspace, habitTargets: [...base, ...owned],
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
    habitTargets: (workspace.habitTargets ?? []).filter((entry) => entry.habitId !== id),
    reflections: (workspace.reflections ?? []).filter((item) => item.habitId !== id),
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

/** Satu refleksi per habit per minggu. Jurnal pada Goal arsip bersifat baca-saja. */
export function saveReflection(workspace: WorkspaceData, entry: HabitReflection, today: string): WorkspaceData {
  const habit = workspace.habits.find((h) => h.id === entry.habitId);
  if (!habit || !editableGoal(workspace, habit.planId) || validateReflection(entry.note, entry.rating) ||
      !isDateISO(entry.weekStart) || !isDateISO(today) || entry.weekStart !== weekStartISO(entry.weekStart) || entry.weekStart > weekStartISO(today) ||
      entry.weekStart < weekStartISO(habit.startDate) ||
      (habit.endDate !== null && entry.weekStart > habit.endDate)) return workspace;
  const old = (workspace.reflections ?? []).find((r) => r.habitId === entry.habitId && r.weekStart === entry.weekStart);
  return { ...workspace, reflections: [
    ...(workspace.reflections ?? []).filter((r) => !(r.habitId === entry.habitId && r.weekStart === entry.weekStart)),
    { ...entry, id: old?.id ?? entry.id, note: entry.note.trim() },
  ] };
}
export function removeReflection(workspace: WorkspaceData, habitId: string, weekStart: string): WorkspaceData {
  const habit = workspace.habits.find((h) => h.id === habitId);
  if (!habit || !editableGoal(workspace, habit.planId)) return workspace;
  return { ...workspace, reflections: (workspace.reflections ?? []).filter((r) => !(r.habitId === habitId && r.weekStart === weekStart)) };
}
