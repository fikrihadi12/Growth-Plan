import { createContext, useContext } from "react";
import type { Plan, PlanInput } from "./types";

export type PlanContextValue = {
  plans: Plan[];
  addPlan: (input: PlanInput) => string;
  updatePlan: (id: string, input: PlanInput) => void;
  setPlanArchived: (id: string, archived: boolean) => void;
  deletePlan: (id: string) => void;
};
export const PlanContext = createContext<PlanContextValue | null>(null);
export function usePlans() {
  const context = useContext(PlanContext);
  if (!context) throw new Error("usePlans harus digunakan di dalam TaskProvider");
  return context;
}
