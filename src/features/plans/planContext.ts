import { createContext, useContext } from "react";
import type { GoalMetric, GoalProgressMode, Milestone, MilestoneInput, Plan, PlanInput } from "./types";

export type PlanContextValue = {
  plans: Plan[];
  milestones: Milestone[];
  addPlan: (input: PlanInput) => string;
  updatePlan: (id: string, input: PlanInput) => boolean;
  setPlanArchived: (id: string, archived: boolean) => void;
  deletePlan: (id: string) => void;
  setGoalMode: (planId: string, mode: GoalProgressMode) => boolean;
  updateGoalMetric: (planId: string, metric: GoalMetric) => boolean;
  addMilestone: (planId: string, input: MilestoneInput) => boolean;
  updateMilestone: (id: string, input: MilestoneInput) => boolean;
  toggleMilestone: (id: string, done: boolean) => void;
  deleteMilestone: (id: string) => void;
};
export const PlanContext = createContext<PlanContextValue | null>(null);
export function usePlans() {
  const context = useContext(PlanContext);
  if (!context) throw new Error("usePlans harus digunakan di dalam TaskProvider");
  return context;
}
