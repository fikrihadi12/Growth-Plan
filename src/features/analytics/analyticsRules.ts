import type { Habit, HabitLog, HabitTargetChange } from "../habits/types";
import { addDaysISO, getWeeklyProgress, weekStartISO } from "../habits/habitRules.ts";
import { isDateISO } from "../plans/planRules.ts";

export type WeeklyPoint = {
  start: string;
  end: string;
  completed: number;
  target: number;
  percent: number | null;
  met: number; // jumlah habit yang target mingguannya terpenuhi
  eligible: number; // hanya minggu penuh yang sudah berakhir
  partial: boolean;
};

/** Tidak menganggap minggu berjalan atau minggu pertama/terakhir parsial sebagai kegagalan. */
export function getWeeklySeries(habits: Habit[], logs: HabitLog[], changes: HabitTargetChange[], today: string, weeks = 12): WeeklyPoint[] {
  if (!isDateISO(today) || !Number.isInteger(weeks) || weeks < 1 || weeks > 104) return [];
  const currentMonday = weekStartISO(today);
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDaysISO(currentMonday, (index - weeks + 1) * 7);
    const end = addDaysISO(start, 6);
    const active = habits.filter((h) => h.startDate <= end && (h.endDate === null || h.endDate >= start));
    let completed = 0;
    let target = 0;
    let met = 0;
    let eligible = 0;
    for (const habit of active) {
      const point = getWeeklyProgress(habit, logs, start, changes);
      completed += point.completed;
      target += point.target;
      // Sebuah habit hanya dinilai jika aktif sejak Senin sampai Minggu dan minggu sudah selesai.
      if (end < today && habit.startDate <= start && (habit.endDate === null || habit.endDate >= end)) {
        eligible++;
        if (point.completed >= point.target) met++;
      }
    }
    return {
      start, end, completed, target,
      percent: target > 0 ? Math.min(100, Math.round(completed / target * 100)) : null,
      met, eligible, partial: end >= today || active.length !== eligible,
    };
  });
}

export type Consistency = { met: number; eligible: number; percent: number | null };
export function getConsistency(points: WeeklyPoint[]): Consistency {
  const eligible = points.reduce((sum, p) => sum + p.eligible, 0);
  const met = points.reduce((sum, p) => sum + p.met, 0);
  return { met, eligible, percent: eligible ? Math.round(met / eligible * 100) : null };
}

/** Konsistensi dalam satu tahun: minggu penuh yang sepenuhnya berada di tahun tersebut. */
export function getYearConsistency(habits: Habit[], logs: HabitLog[], changes: HabitTargetChange[], today: string, year: number): Consistency {
  const startYear = `${year}-01-01`;
  const endYear = `${year}-12-31`;
  if (!isDateISO(startYear) || today < startYear) return { met: 0, eligible: 0, percent: null };
  // Tampilkan maksimal 54 minggu dari akhir tahun/hingga hari ini, lalu filter batas tahun.
  const anchor = today < endYear ? today : addDaysISO(endYear, 1);
  const points = getWeeklySeries(habits, logs, changes, anchor, 54)
    .filter((p) => p.start >= startYear && p.end <= endYear && p.end < today);
  return getConsistency(points);
}

export type MonthlyPoint = { month: string; completed: number };
/** Chart bulanan menghitung sesi nyata berdasarkan bulan kalender, bukan menyamakan bulan dengan empat minggu. */
export function getMonthlySeries(habits: Habit[], logs: HabitLog[], today: string, months = 12): MonthlyPoint[] {
  if (!isDateISO(today) || !Number.isInteger(months) || months < 1 || months > 36) return [];
  const allowed = new Set(habits.map((h) => h.id));
  const [year, month] = today.split("-").map(Number);
  return Array.from({ length: months }, (_, index) => {
    const first = new Date(Date.UTC(year, month - months + index, 1));
    const key = first.toISOString().slice(0, 7);
    const completed = logs.filter((log) => allowed.has(log.habitId) && log.date.slice(0, 7) === key && log.date <= today).length;
    return { month: key, completed };
  });
}

/** Streak diukur dari minggu yang TELAH SELESAI, bukan memaksa minggu sekarang langsung dianggap gagal. */
export function getCompletedWeekStreak(habit: Habit, logs: HabitLog[], changes: HabitTargetChange[], today: string): number {
  let cursor = addDaysISO(weekStartISO(today), -7);
  let streak = 0;
  while (cursor >= habit.startDate || addDaysISO(cursor, 6) >= habit.startDate) {
    const end = addDaysISO(cursor, 6);
    if (habit.startDate > cursor || (habit.endDate !== null && habit.endDate < end)) break;
    const weekly = getWeeklyProgress(habit, logs, cursor, changes);
    if (weekly.completed < weekly.target) break;
    streak++;
    cursor = addDaysISO(cursor, -7);
  }
  return streak;
}
