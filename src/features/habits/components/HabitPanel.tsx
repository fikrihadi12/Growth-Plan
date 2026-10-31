import { useState } from "react";
import { Plus, Repeat2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useHabits } from "../habitContext";
import { HabitCard } from "./HabitCard";
import { HabitForm } from "./HabitForm";

export function HabitPanel({ planId, archived }: { planId: string; archived: boolean }) {
  const { habits } = useHabits();
  const own = habits.filter((habit) => habit.planId === planId);
  const [adding, setAdding] = useState(false);

  return <section className="space-y-4" aria-labelledby="habits-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="habits-heading" className="flex items-center gap-2 text-xl font-bold"><Repeat2 size={21} className="text-brand-600"/> Habit / Aktivitas Berulang</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Target mingguan dan check-in terpisah dari progres kumulatif Goal.</p></div>
      {!archived && <Button onClick={() => setAdding((value) => !value)}><Plus size={17}/>{adding ? "Tutup formulir" : "Tambah habit"}</Button>}
    </div>
    {adding && !archived && <HabitForm planId={planId} onClose={() => setAdding(false)}/>}
    {own.length ? <div className="grid gap-4 xl:grid-cols-2">{own.map((habit) => <HabitCard key={habit.id} habit={habit} archived={archived}/>)}</div> :
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-700">Belum ada kebiasaan. Tambahkan Gym, olahraga, atau aktivitas rutin untuk melacak progres setiap minggu.</div>}
  </section>;
}
