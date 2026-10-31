import { isDateISO } from "../plans/planRules.ts";
import type { CreateTaskInput } from "./types";

export function validateTaskInput(input: CreateTaskInput): string | null {
  if (typeof input.title !== "string" || input.title.trim().length < 1 || input.title.trim().length > 120)
    return "Judul tugas harus 1–120 karakter.";
  if (typeof input.projectId !== "string" || !input.projectId) return "Pilih rencana untuk tugas.";
  if (input.priority !== "low" && input.priority !== "medium" && input.priority !== "high") return "Prioritas tidak valid.";
  if (input.dueDate !== null && !isDateISO(input.dueDate)) return "Tanggal tenggat tidak valid.";
  return null;
}
