import { useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { useHabits } from "../habitContext";
import { addDaysISO, canCheckIn, getWeeklyProgress, weekDays, weekStartISO } from "../habitRules";
import type { Habit } from "../types";
import { useCurrentLocalDate } from "../useCurrentLocalDate";
import { HabitForm } from "./HabitForm";

export function HabitCard({ habit, archived }: { habit: Habit; archived: boolean }) {
  const { habitLogs, toggleHabitCheckIn, deleteHabit } = useHabits();
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const today = useCurrentLocalDate();
  const currentWeek = weekStartISO(today);
  // null = selalu ikuti minggu berjalan, termasuk saat tab terbuka melewati Senin.
  const week = selectedWeek ?? currentWeek;
  const progress = getWeeklyProgress(habit, habitLogs, week);
  const finished = new Set(habitLogs.filter((log) => log.habitId === habit.id).map((log) => log.date));

  function checkIn(date: string) {
    if (!toggleHabitCheckIn(habit.id, date)) setError("Tanggal tidak bisa diubah. Pastikan Goal aktif dan tanggal berada dalam periode kebiasaan.");
    else setError("");
  }
  function remove() {
    const count = habitLogs.filter((log) => log.habitId === habit.id).length;
    if (window.confirm(`Hapus habit "${habit.name}" dan seluruh ${count} riwayat check-in? Tindakan ini tidak dapat dibatalkan.`)) deleteHabit(habit.id);
  }

  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h3 className="text-lg font-bold">{habit.name}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Target {habit.weeklyTarget} kali / minggu · {habit.endDate ? `sampai ${habit.endDate}` : "tanpa tanggal akhir"}</p>
          {habit.scheduledDays.length > 0 && <p className="mt-1 text-xs text-slate-500">Hari rencana: {habit.scheduledDays.map((day) => weekDays[day]).join(", ")}</p>}
        </div>
        {!archived && <div className="flex gap-2"><Button variant="secondary" onClick={() => setEditing((v) => !v)} aria-label={`Edit ${habit.name}`}><Pencil size={16}/></Button><Button variant="danger" onClick={remove} aria-label={`Hapus ${habit.name}`}><Trash2 size={16}/></Button></div>}
      </div>
      {editing && !archived && <HabitForm key={habit.id} planId={habit.planId} initial={habit} onClose={() => setEditing(false)}/>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium"><CalendarDays size={17} className="text-brand-600"/> Minggu {progress.start} – {progress.end}</div>
        <div className="flex items-center gap-1">
          <Button variant="secondary" onClick={() => setSelectedWeek(addDaysISO(week, -7))} disabled={addDaysISO(week, -1) < habit.startDate} aria-label={`Lihat minggu sebelumnya untuk ${habit.name}`}><ChevronLeft size={17}/></Button>
          <Button variant="secondary" onClick={() => { const next = addDaysISO(week, 7); setSelectedWeek(next >= currentWeek ? null : next); }} disabled={week >= currentWeek} aria-label={`Lihat minggu berikutnya untuk ${habit.name}`}><ChevronRight size={17}/></Button>
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3"><p className="text-sm font-medium">{progress.completed} / {progress.target} sesi tercatat</p><strong className="text-lg text-brand-600 dark:text-brand-100">{progress.percent}%</strong></div>
        <ProgressBar value={progress.percent} label={`Pencapaian mingguan ${habit.name}`} />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{progress.completed >= progress.target ? `Target tercapai${progress.extra ? `, ditambah ${progress.extra} sesi ekstra` : ""}.` : `Perlu ${progress.target - progress.completed} sesi lagi untuk mencapai target.`} Riwayat minggu lain tidak terhapus.</p>
      </div>
      <div className="grid grid-cols-7 gap-1.5" role="group" aria-label={`Catatan harian ${habit.name}`}>
        {progress.days.map((date, index) => {
          const selected = finished.has(date);
          const allowed = !archived && canCheckIn(habit, date, today);
          const scheduled = habit.scheduledDays.includes(index);
          return <button key={date} type="button" disabled={!allowed} aria-pressed={selected} aria-label={`${weekDays[index]} ${date}: ${selected ? "sudah check-in" : "belum check-in"}${scheduled ? ", hari terjadwal" : ""}`}
            onClick={() => checkIn(date)} className={`flex min-h-18 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : scheduled ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-600/15 dark:text-brand-100" : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900"}`}>
            <span>{weekDays[index]}</span><span className="text-sm">{date.slice(-2)}</span>{selected ? <Check size={15} aria-hidden="true"/> : scheduled ? <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true"/> : <span className="h-1.5"/>}
          </button>;
        })}
      </div>
      {archived && <p className="text-xs text-amber-700 dark:text-amber-300">Goal diarsipkan. Riwayat dapat dilihat, tetapi tidak dapat diubah.</p>}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </Card>
  );
}
