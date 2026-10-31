import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

export function StatCard({ label, value, icon: Icon, helper }: { label: string; value: number; icon: LucideIcon; helper: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <div className="rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-brand-600/15 dark:text-brand-100">
          <Icon size={19} aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
    </Card>
  );
}
