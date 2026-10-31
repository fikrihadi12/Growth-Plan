import { Inbox } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
      <Inbox size={28} className="mb-3 text-slate-400" aria-hidden="true" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
