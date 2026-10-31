/** Frekuensi Habit berbeda dari horizon Plan (daily/weekly/monthly/yearly). */
export type Habit = {
  id: string;
  planId: string; // hanya Goal, bukan Project
  name: string;
  weeklyTarget: number; // 1–7 sesi per minggu, satu check-in maksimal per hari
  scheduledDays: number[]; // 0=Senin ... 6=Minggu, rekomendasi, bukan batasan
  startDate: string; // tanggal lokal YYYY-MM-DD
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};
export type HabitInput = Pick<Habit, "name" | "weeklyTarget" | "scheduledDays" | "startDate" | "endDate">;
export type HabitLog = {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD; unik per (habitId, date)
  createdAt: string;
};
