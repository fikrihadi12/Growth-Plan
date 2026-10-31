import { isDateISO } from "../plans/planRules.ts";
import type { Habit, HabitInput, HabitLog } from "./types";

export const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

// Ambil tanggal dari zona waktu browser, bukan UTC; mencegah check-in bergeser hari di Indonesia.
export function todayLocalISO(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Aritmetika tanggal dengan UTC hanya untuk menghitung kalender; hasilnya tetap date-only lokal.
export function addDaysISO(isoDate: string, amount: number): string {
  if (!isDateISO(isoDate) || !Number.isInteger(amount)) throw new Error("Tanggal tidak valid.");
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
}
export function weekStartISO(isoDate: string): string {
  if (!isDateISO(isoDate)) throw new Error("Tanggal tidak valid.");
  const day = new Date(`${isoDate}T12:00:00Z`).getUTCDay();
  return addDaysISO(isoDate, -(day === 0 ? 6 : day - 1));
}

export function validateHabitInput(input: HabitInput): string | null {
  if (typeof input.name !== "string" || input.name.trim().length < 2 || input.name.trim().length > 100)
    return "Nama aktivitas harus 2–100 karakter.";
  if (!Number.isInteger(input.weeklyTarget) || input.weeklyTarget < 1 || input.weeklyTarget > 7)
    return "Target mingguan harus 1–7 kali.";
  if (!Array.isArray(input.scheduledDays) || input.scheduledDays.length > 7 ||
      new Set(input.scheduledDays).size !== input.scheduledDays.length ||
      !input.scheduledDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6))
    return "Jadwal harus berisi hari Senin–Minggu tanpa duplikat.";
  if (!isDateISO(input.startDate)) return "Tanggal mulai habit tidak valid.";
  if (input.endDate !== null && !isDateISO(input.endDate)) return "Tanggal selesai habit tidak valid.";
  if (input.endDate !== null && input.endDate < input.startDate)
    return "Tanggal selesai tidak boleh sebelum tanggal mulai.";
  return null;
}

export function isHabit(value: unknown): value is Habit {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Habit>;
  return typeof item.id === "string" && item.id.length > 0 &&
    typeof item.planId === "string" && item.planId.length > 0 &&
    typeof item.createdAt === "string" && item.createdAt.length > 0 &&
    typeof item.updatedAt === "string" && item.updatedAt.length > 0 &&
    validateHabitInput({
      name: item.name as string,
      weeklyTarget: item.weeklyTarget as number,
      scheduledDays: item.scheduledDays as number[],
      startDate: item.startDate as string,
      endDate: item.endDate as string | null,
    }) === null;
}
export function isHabitLog(value: unknown): value is HabitLog {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<HabitLog>;
  return typeof item.id === "string" && item.id.length > 0 &&
    typeof item.habitId === "string" && item.habitId.length > 0 &&
    typeof item.createdAt === "string" && item.createdAt.length > 0 &&
    isDateISO(item.date);
}

export function canCheckIn(habit: Habit, date: string, today: string): boolean {
  return isDateISO(date) && isDateISO(today) && date >= habit.startDate &&
    (habit.endDate === null || date <= habit.endDate) && date <= today;
}

export type WeeklyProgress = {
  start: string;
  end: string;
  completed: number;
  target: number;
  percent: number;
  extra: number;
  days: string[];
};
export function getWeeklyProgress(habit: Habit, logs: HabitLog[], date: string): WeeklyProgress {
  const start = weekStartISO(date);
  const days = Array.from({ length: 7 }, (_, index) => addDaysISO(start, index));
  const end = days[6];
  const completed = logs.filter((log) => log.habitId === habit.id && log.date >= start && log.date <= end).length;
  return {
    start, end, days, completed, target: habit.weeklyTarget,
    percent: Math.min(100, Math.round((completed / habit.weeklyTarget) * 100)),
    extra: Math.max(0, completed - habit.weeklyTarget),
  };
}
