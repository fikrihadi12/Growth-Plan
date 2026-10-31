export function ProgressBar({ value, label = "Progres penyelesaian" }: { value: number; label?: string }) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
    >
      <div className="h-full rounded-full bg-brand-600 transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}
