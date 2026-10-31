import type { Plan, PlanCategory, PlanInput, PlanKind, PlanPeriod } from "./types";

export const kindLabels: Record<PlanKind, string> = { project: "Proyek", goal: "Target / Goal" };
export const periodLabels: Record<PlanPeriod, string> = {
  daily: "Harian", weekly: "Mingguan", monthly: "Bulanan", yearly: "Tahunan",
};
export const categoryLabels: Record<PlanCategory, string> = {
  work: "Pekerjaan", education: "Pendidikan", health: "Kesehatan & Fitness",
  finance: "Keuangan", personal: "Pengembangan diri", other: "Lainnya",
};
export const categoryColors: Record<PlanCategory, string> = {
  work: "bg-indigo-500", education: "bg-sky-500", health: "bg-emerald-500",
  finance: "bg-amber-500", personal: "bg-violet-500", other: "bg-slate-500",
};

// Periode menjelaskan rentang perencanaan, BUKAN frekuensi kebiasaan.
export function isDateISO(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
}

export function validatePlanInput(input: PlanInput): string | null {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 80) return "Nama rencana harus 2–80 karakter.";
  if (input.description.length > 500) return "Deskripsi maksimal 500 karakter.";
  if (!Object.hasOwn(kindLabels, input.kind) || !Object.hasOwn(periodLabels, input.period) || !Object.hasOwn(categoryLabels, input.category)) return "Jenis, periode, atau kategori tidak valid.";
  if (input.startDate !== null && !isDateISO(input.startDate)) return "Tanggal mulai tidak valid.";
  if (input.endDate !== null && !isDateISO(input.endDate)) return "Tanggal selesai tidak valid.";
  if (input.startDate && input.endDate && input.startDate > input.endDate) return "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.";
  return null;
}

export function isPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Plan>;
  return typeof p.id === "string" && p.id.length > 0 &&
    typeof p.name === "string" && typeof p.description === "string" &&
    typeof p.createdAt === "string" && typeof p.updatedAt === "string" &&
    (p.status === "active" || p.status === "archived") &&
    validatePlanInput({
      name: p.name, description: p.description, kind: p.kind as PlanKind,
      period: p.period as PlanPeriod, category: p.category as PlanCategory,
      startDate: p.startDate ?? null, endDate: p.endDate ?? null,
    }) === null;
}
