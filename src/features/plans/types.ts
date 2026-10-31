export type PlanKind = "project" | "goal";
export type PlanPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type PlanCategory = "work" | "education" | "health" | "finance" | "personal" | "other";
export type PlanStatus = "active" | "archived";

export type Plan = {
  id: string;
  name: string;
  description: string;
  kind: PlanKind;
  period: PlanPeriod;
  category: PlanCategory;
  status: PlanStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlanInput = Pick<Plan, "name" | "description" | "kind" | "period" | "category" | "startDate" | "endDate">;
