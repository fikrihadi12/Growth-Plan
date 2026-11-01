import type { Habit, HabitTargetChange } from "./types";
import { isDateISO } from "../plans/planRules.ts";

/** Snapshot berlaku mulai Senin yang ditentukan; perubahan berikutnya tak menulis ulang minggu terdahulu. */
export function targetForWeek(habit: Habit, changes: HabitTargetChange[], monday: string): number {
  const matching = changes.filter((entry) => entry.habitId === habit.id && entry.effectiveWeek <= monday)
    .sort((a, b) => b.effectiveWeek.localeCompare(a.effectiveWeek));
  return matching[0]?.target ?? habit.weeklyTarget; // fallback untuk data pra-migrasi
}

export function isHabitTargetChange(value: unknown): value is HabitTargetChange {
  if (!value || typeof value !== "object") return false;
  const x = value as Partial<HabitTargetChange>;
  return typeof x.habitId === "string" && x.habitId.length > 0 &&
    isDateISO(x.effectiveWeek) && new Date(`${x.effectiveWeek}T12:00:00Z`).getUTCDay() === 1 &&
    Number.isInteger(x.target) && (x.target as number) >= 1 && (x.target as number) <= 7 &&
    typeof x.changedAt === "string" && x.changedAt.length > 0;
}

export function baselineTarget(habit: Habit, firstMonday: string): HabitTargetChange {
  return { habitId: habit.id, effectiveWeek: firstMonday, target: habit.weeklyTarget, changedAt: habit.createdAt };
}

/** Mengganti target pada minggu berjalan adalah keputusan eksplisit. Minggu sebelumnya tetap memakai snapshot lama. */
export function setTargetForWeek(history: HabitTargetChange[], habitId: string, monday: string, target: number, changedAt: string): HabitTargetChange[] {
  return [...history.filter((h) => !(h.habitId === habitId && h.effectiveWeek === monday)),
    { habitId, effectiveWeek: monday, target, changedAt }]
    .sort((a, b) => a.habitId.localeCompare(b.habitId) || a.effectiveWeek.localeCompare(b.effectiveWeek));
}
