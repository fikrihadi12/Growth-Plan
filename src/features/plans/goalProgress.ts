import type { GoalProgressMode, Milestone, Plan } from "./types";
import type { Task } from "../tasks/types";

export type ProgressSummary = {
  mode: GoalProgressMode;
  percent: number;
  completed: number;
  total: number;
  caption: string;
  label: string;
  hasMeasure: boolean;
};

/** Sumber progres tunggal: Project=tugas; Goal=mode yang dipilih pengguna. */
export function getPlanProgress(plan: Plan, allTasks: Task[], allMilestones: Milestone[]): ProgressSummary {
  const mode = plan.kind === "project" ? "tasks" : (plan.goal?.progressMode ?? "tasks");
  if (mode === "numeric" && plan.kind === "goal" && plan.goal) {
    const { metric } = plan.goal;
    return {
      mode, percent: Math.min(100, Math.round(metric.current / metric.target * 100)),
      completed: metric.current, total: metric.target,
      caption: `${metric.current} / ${metric.target} ${metric.unit}`.trim(),
      label: metric.label, hasMeasure: true,
    };
  }
  if (mode === "milestones" && plan.kind === "goal") {
    const milestones = allMilestones.filter((item) => item.planId === plan.id);
    const completed = milestones.filter((item) => item.completedAt !== null).length;
    return {
      mode, percent: milestones.length ? Math.round(completed / milestones.length * 100) : 0,
      completed, total: milestones.length,
      caption: `${completed} dari ${milestones.length} milestone tercapai`,
      label: "Progres milestone", hasMeasure: milestones.length > 0,
    };
  }
  const tasks = allTasks.filter((item) => item.projectId === plan.id);
  const completed = tasks.filter((item) => item.status === "done").length;
  return {
    mode: "tasks", percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0,
    completed, total: tasks.length,
    caption: `${completed} dari ${tasks.length} tugas selesai`,
    label: "Progres tugas", hasMeasure: tasks.length > 0,
  };
}
