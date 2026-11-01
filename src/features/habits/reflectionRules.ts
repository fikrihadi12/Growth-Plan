import { isDateISO } from "../plans/planRules.ts";
import type { HabitReflection } from "./types";

export function validateReflection(note: string, rating: number | null): string | null {
  if (typeof note !== "string" || note.trim().length < 2 || note.trim().length > 1000)
    return "Refleksi harus 2–1000 karakter.";
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5))
    return "Penilaian pribadi harus 1–5 atau kosong.";
  return null;
}
export function isHabitReflection(value: unknown): value is HabitReflection {
  if (!value || typeof value !== "object") return false;
  const x = value as Partial<HabitReflection>;
  return typeof x.id === "string" && x.id.length > 0 &&
    typeof x.habitId === "string" && x.habitId.length > 0 &&
    isDateISO(x.weekStart) && new Date(`${x.weekStart}T12:00:00Z`).getUTCDay() === 1 &&
    validateReflection(x.note as string, x.rating as number | null) === null &&
    typeof x.updatedAt === "string" && x.updatedAt.length > 0;
}
