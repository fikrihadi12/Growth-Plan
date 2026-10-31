export type PlanKind = "project" | "goal";
export type PlanPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type PlanCategory = "work" | "education" | "health" | "finance" | "personal" | "other";
export type PlanStatus = "active" | "archived";

// Tiap Goal hanya memakai SATU sumber progres agar tugas, milestone, dan angka tidak dihitung ganda.
export type GoalProgressMode = "tasks" | "milestones" | "numeric";
export type GoalMetric = {
  label: string;
  unit: string;
  current: number;
  target: number;
};
export type GoalSettings = {
  progressMode: GoalProgressMode;
  metric: GoalMetric;
};

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
  goal: GoalSettings | null;
};

export type PlanInput = Pick<Plan, "name" | "description" | "kind" | "period" | "category" | "startDate" | "endDate">;

export type Milestone = {
  id: string;
  planId: string;
  title: string;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
};
export type MilestoneInput = Pick<Milestone, "title" | "dueDate">;
