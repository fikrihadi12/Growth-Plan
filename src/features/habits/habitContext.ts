import { createContext, useContext } from "react";
import type { Habit, HabitInput, HabitLog } from "./types";

export type HabitContextValue = {
  habits: Habit[];
  habitLogs: HabitLog[];
  addHabit: (planId: string, input: HabitInput) => boolean;
  updateHabit: (id: string, input: HabitInput) => boolean;
  deleteHabit: (id: string) => void;
  toggleHabitCheckIn: (id: string, date: string) => boolean;
};
export const HabitContext = createContext<HabitContextValue | null>(null);
export function useHabits(): HabitContextValue {
  const value = useContext(HabitContext);
  if (!value) throw new Error("useHabits harus dipanggil di dalam TaskProvider");
  return value;
}
