import type { GoalMetric, GoalProgressMode, GoalSettings, MilestoneInput } from "./types";
import { isDateISO } from "./planRules.ts";

export const progressModeLabels: Record<GoalProgressMode, string> = {
  tasks: "Berdasarkan tugas",
  milestones: "Berdasarkan milestone",
  numeric: "Berdasarkan target angka",
};

export function defaultGoalSettings(): GoalSettings {
  return {
    progressMode: "tasks",
    metric: { label: "Target", unit: "unit", current: 0, target: 1 },
  };
}

export function isGoalProgressMode(value: unknown): value is GoalProgressMode {
  return value === "tasks" || value === "milestones" || value === "numeric";
}

export function validateGoalMetric(value: GoalMetric): string | null {
  if (typeof value.label !== "string" || value.label.trim().length < 2 || value.label.trim().length > 80)
    return "Nama indikator harus 2–80 karakter.";
  if (typeof value.unit !== "string" || value.unit.trim().length > 24)
    return "Satuan maksimal 24 karakter.";
  if (!Number.isFinite(value.target) || value.target <= 0 || value.target > 1_000_000_000)
    return "Target harus angka lebih besar dari nol (maksimal 1 miliar).";
  if (!Number.isFinite(value.current) || value.current < 0 || value.current > 1_000_000_000)
    return "Realisasi harus angka nol atau lebih (maksimal 1 miliar).";
  return null;
}

export function isGoalSettings(value: unknown): value is GoalSettings {
  if (!value || typeof value !== "object") return false;
  const g = value as Partial<GoalSettings>;
  return isGoalProgressMode(g.progressMode) && !!g.metric && validateGoalMetric(g.metric) === null;
}

export function validateMilestoneInput(input: MilestoneInput): string | null {
  if (typeof input.title !== "string" || input.title.trim().length < 2 || input.title.trim().length > 120)
    return "Nama milestone harus 2–120 karakter.";
  if (input.dueDate !== null && !isDateISO(input.dueDate)) return "Tanggal milestone tidak valid.";
  return null;
}
