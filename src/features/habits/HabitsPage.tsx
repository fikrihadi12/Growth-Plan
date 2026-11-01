import { useState } from "react";
import { Link } from "react-router";
import { Plus, Repeat2, Search, BarChart3 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { usePlans } from "../plans/planContext";
import { useHabits } from "./habitContext";
import { getWeeklyProgress } from "./habitRules";
import { HabitCard } from "./components/HabitCard";
import { HabitForm } from "./components/HabitForm";
import { useCurrentLocalDate } from "./useCurrentLocalDate";

const selectClass = "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function HabitsPage() {
  const { plans } = usePlans();
  const { habits, habitLogs, habitTargets } = useHabits();
  const activeGoals = plans.filter((plan) => plan.kind === "goal" && plan.status === "active");
  const [planId, setPlanId] = useState("");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const selectedPlanId = activeGoals.some((plan) => plan.id === planId) ? planId : (activeGoals[0]?.id ?? "");
  const filtered = habits.filter((habit) => {
    const plan = plans.find((item) => item.id === habit.planId);
    return `${habit.name} ${plan?.name ?? ""}`.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID"));
  });
  const activeHabits = habits.filter((habit) => activeGoals.some((plan) => plan.id === habit.planId));
  const today = useCurrentLocalDate();
  const achieved = activeHabits.filter((habit) => getWeeklyProgress(habit, habitLogs, today, habitTargets).percent === 100).length;

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600">Habit tracker</p><h1 className="mt-1 text-3xl font-extrabold">Kebiasaan Saya</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Catat sesi harian. Progres dimulai lagi setiap Senin, tanpa menghapus riwayat.</p></div>
      <div className="flex flex-wrap gap-2"><Link to="/app/analytics" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><BarChart3 size={17}/> Lihat Analitik</Link>
        <Button disabled={!activeGoals.length} onClick={() => setAdding((value) => !value)}><Plus size={17}/>{adding ? "Tutup formulir" : "Buat habit"}</Button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="p-4"><p className="text-xs text-slate-500">Seluruh habit</p><p className="mt-2 text-2xl font-bold">{habits.length}</p></Card>
      <Card className="p-4"><p className="text-xs text-slate-500">Habit aktif</p><p className="mt-2 text-2xl font-bold">{activeHabits.length}</p></Card>
      <Card className="p-4"><p className="text-xs text-slate-500">Target minggu ini tercapai</p><p className="mt-2 text-2xl font-bold">{achieved} / {activeHabits.length}</p></Card>
    </div>
    {!activeGoals.length && <Card className="p-5"><p className="text-sm text-slate-600 dark:text-slate-300">Buat atau aktifkan sebuah <strong>Goal</strong> terlebih dahulu agar bisa membuat kebiasaan. Habit tidak dibuat di bawah Project.</p><Link to="/app/plans" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">Kelola Goal →</Link></Card>}
    {adding && selectedPlanId && <div className="space-y-3"><label className="block text-sm font-semibold">Hubungkan ke Goal
      <select className={`mt-1.5 w-full ${selectClass}`} value={selectedPlanId} onChange={(e) => setPlanId(e.target.value)}>
        {activeGoals.map((plan) => <option value={plan.id} key={plan.id}>{plan.name}</option>)}
      </select></label><HabitForm key={selectedPlanId} planId={selectedPlanId} onClose={() => setAdding(false)}/></div>}
    <label className="relative block"><Search size={18} className="pointer-events-none absolute left-3 top-3 text-slate-400"/><span className="sr-only">Cari kebiasaan</span>
      <input className={`w-full pl-10 ${selectClass}`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama habit atau Goal..."/>
    </label>
    {filtered.length ? <div className="grid gap-4 xl:grid-cols-2">{filtered.map((habit) => {
      const plan = plans.find((item) => item.id === habit.planId);
      return <div key={habit.id} className="space-y-2"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-100" to={`/app/plans/${habit.planId}`}><Repeat2 size={15}/> {plan?.name ?? "Goal tidak ditemukan"} →</Link><HabitCard habit={habit} archived={plan?.status !== "active"}/></div>;
    })}</div> : <Card className="p-6"><p className="text-sm text-slate-500">{habits.length ? "Tidak ada habit yang cocok dengan pencarian." : "Belum ada habit. Buat Goal, lalu tambahkan kebiasaan seperti Gym 3x/minggu."}</p></Card>}
  </div>;
}
