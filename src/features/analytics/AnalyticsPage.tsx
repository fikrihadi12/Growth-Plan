import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { Activity, ArrowLeft, BarChart3, CalendarDays, ChevronLeft, ChevronRight, Flame, NotebookPen, Save, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { usePlans } from "../plans/planContext";
import { useHabits } from "../habits/habitContext";
import { useCurrentLocalDate } from "../habits/useCurrentLocalDate";
import { addDaysISO, weekStartISO } from "../habits/habitRules";
import { getCompletedWeekStreak, getConsistency, getMonthlySeries, getWeeklySeries, getYearConsistency } from "./analyticsRules";
import type { HabitReflection } from "../habits/types";

const field = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const monthsID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function ReflectionEditor({ habitId, weekStart, archived, existing }: {
  habitId: string; weekStart: string; archived: boolean; existing?: HabitReflection;
}) {
  const { saveHabitReflection, deleteHabitReflection } = useHabits();
  const [note, setNote] = useState(existing?.note ?? "");
  const [rating, setRating] = useState<string>(existing?.rating?.toString() ?? "");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = saveHabitReflection(habitId, weekStart, note, rating === "" ? null : Number(rating));
    setMessage(ok ? "Refleksi berhasil disimpan." : "Tidak dapat menyimpan. Periksa isi atau status Goal.");
  }
  function remove() {
    if (window.confirm("Hapus refleksi minggu ini? Catatan check-in gym tidak akan terhapus.")) {
      deleteHabitReflection(habitId, weekStart);
      setNote(""); setRating(""); setMessage("Refleksi dihapus.");
    }
  }
  return <form className="space-y-3" onSubmit={submit}>
    <label className="block text-sm font-semibold">Apa yang berjalan baik dan apa yang perlu diperbaiki?
      <textarea rows={4} className={field} value={note} maxLength={1000} minLength={2} required disabled={archived}
        onChange={(e) => { setNote(e.target.value); setMessage(""); }} placeholder="Contoh: Minggu ini latihan lebih konsisten. Minggu depan akan menyiapkan tas gym sehari sebelumnya."/>
    </label>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <label className="block text-sm font-semibold">Penilaian pribadi (opsional)
        <select value={rating} disabled={archived} className={`${field} min-w-40`} onChange={(e) => { setRating(e.target.value); setMessage(""); }}>
          <option value="">Tanpa penilaian</option>
          {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
        </select>
      </label>
      {!archived && <div className="flex flex-wrap gap-2">
        {existing && <Button variant="danger" onClick={remove}><Trash2 size={16}/> Hapus catatan</Button>}
        <Button type="submit" disabled={note.trim().length < 2}><Save size={16}/> Simpan refleksi</Button>
      </div>}
    </div>
    {archived && <p className="text-sm text-amber-700 dark:text-amber-300">Goal telah diarsipkan. Catatan dapat dibaca, tetapi tidak dapat diubah.</p>}
    <p className="text-xs text-slate-500">{note.length}/1000 karakter · Refleksi merupakan catatan pribadi, bukan penilaian otomatis.</p>
    {message && <p className="text-sm text-brand-600" role="status">{message}</p>}
  </form>;
}

export default function AnalyticsPage() {
  const { plans } = usePlans();
  const { habits, habitLogs, habitTargets, reflections } = useHabits();
  const today = useCurrentLocalDate();
  // Link dari detail Goal/Habit dapat membuka analitik dengan filter awal terisi.
  const [params] = useSearchParams();
  const [goalId, setGoalId] = useState(() => params.get("goal") ?? "all");
  const [habitId, setHabitId] = useState(() => params.get("habit") ?? "all");
  const [year, setYear] = useState<number | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const goals = plans.filter((p) => p.kind === "goal");
  const goalSelected = goalId === "all" || goals.some((g) => g.id === goalId) ? goalId : "all";
  const scopeHabits = habits.filter((h) => goalSelected === "all" || h.planId === goalSelected);
  const habitSelected = habitId === "all" || scopeHabits.some((h) => h.id === habitId) ? habitId : "all";
  const selected = scopeHabits.filter((h) => habitSelected === "all" || h.id === habitSelected);
  const currentYear = Number(today.slice(0,4));
  const selectedYear = year !== null && year >= currentYear - 4 && year <= currentYear ? year : currentYear;
  const weekly = getWeeklySeries(selected, habitLogs, habitTargets, today, 12);
  const monthly = getMonthlySeries(selected, habitLogs, today, 12);
  const consistency = getConsistency(weekly);
  const yearly = getYearConsistency(selected, habitLogs, habitTargets, today, selectedYear);
  const logsToday = habitLogs.filter((log) => log.date === today && selected.some((h) => h.id === log.habitId)).length;
  const sessionsThisMonth = monthly[monthly.length - 1]?.completed ?? 0;
  const monthlyMax = Math.max(1, ...monthly.map((m) => m.completed));
  const weeklyMax = Math.max(1, ...weekly.map((p) => p.target), ...weekly.map((p) => p.completed));

  const individual = habitSelected === "all" ? null : selected[0] ?? null;
  const journalWeek = addDaysISO(weekStartISO(today), -weekOffset * 7);
  const note = individual ? reflections.find((r) => r.habitId === individual.id && r.weekStart === journalWeek) : undefined;
  const archived = individual ? plans.find((p) => p.id === individual.planId)?.status !== "active" : false;
  const canPrev = !!individual && addDaysISO(journalWeek, -1) >= individual.startDate && weekOffset < 104;

  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Personal Evaluation</p>
        <h1 className="mt-1 text-3xl font-extrabold">Evaluasi & Analitik</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tinjau aktivitas nyata, tingkat konsistensi, dan refleksi pribadi tanpa mencampur progres Goal dengan Habit.</p>
      </div>
      <Link to="/app/habits" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline"><ArrowLeft size={16}/> Kembali ke Habits</Link>
    </div>

    <Card className="grid gap-4 p-5 md:grid-cols-2">
      <label className="text-sm font-semibold">Filter Goal
        <select className={field} value={goalSelected} onChange={(e) => { setGoalId(e.target.value); setHabitId("all"); setWeekOffset(0); }}>
          <option value="all">Semua Goal</option>
          {goals.map((g) => <option key={g.id} value={g.id}>{g.name}{g.status === "archived" ? " (arsip)" : ""}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Filter Habit
        <select className={field} value={habitSelected} onChange={(e) => { setHabitId(e.target.value); setWeekOffset(0); }}>
          <option value="all">Semua Habit</option>
          {scopeHabits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </label>
    </Card>

    {!selected.length ? <Card className="p-6"><p className="text-sm text-slate-500">Belum ada Habit pada pilihan ini. Buat Habit melalui Goal agar grafik dapat menghitung riwayat latihan.</p></Card> : <>
      <section aria-label="Statistik pribadi" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><Activity className="text-brand-600" size={20}/><p className="mt-3 text-xs text-slate-500">Check-in hari ini</p><p className="mt-1 text-2xl font-bold">{logsToday}</p><p className="mt-2 text-xs text-slate-500">Jumlah aktivitas yang dicatat hari ini</p></Card>
        <Card className="p-5"><CalendarDays className="text-brand-600" size={20}/><p className="mt-3 text-xs text-slate-500">Sesi bulan berjalan</p><p className="mt-1 text-2xl font-bold">{sessionsThisMonth}</p><p className="mt-2 text-xs text-slate-500">Jumlah sesi, bukan tingkat capaian</p></Card>
        <Card className="p-5"><BarChart3 className="text-brand-600" size={20}/><p className="mt-3 text-xs text-slate-500">Konsistensi 12 minggu</p><p className="mt-1 text-2xl font-bold">{consistency.percent === null ? "—" : `${consistency.percent}%`}</p><p className="mt-2 text-xs text-slate-500">{consistency.met}/{consistency.eligible} habit-minggu penuh berhasil</p></Card>
        <Card className="p-5"><Flame className="text-brand-600" size={20}/><p className="mt-3 text-xs text-slate-500">Streak mingguan</p><p className="mt-1 text-2xl font-bold">{individual ? `${getCompletedWeekStreak(individual, habitLogs, habitTargets, today)} minggu` : "—"}</p><p className="mt-2 text-xs text-slate-500">{individual ? "Hanya minggu selesai, bukan minggu berjalan" : "Pilih satu Habit untuk melihat streak"}</p></Card>
      </section>

      <Card className="space-y-4 p-5 sm:p-6">
        <div><h2 className="text-lg font-bold">Pencapaian mingguan</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">12 minggu terakhir · tinggi batang = sesi terlaksana. Target tercatat terpisah untuk perbandingan.</p></div>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-160 items-end gap-2" role="list" aria-label="Grafik pencapaian mingguan">
            {weekly.map((w) => <div key={w.start} role="listitem" className="flex min-w-11 flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold" title={`${w.completed} dari ${w.target} sesi`}>{w.completed}/{w.target || "–"}</span>
              <div className="flex h-36 w-full max-w-12 items-end rounded-t-lg bg-slate-100 dark:bg-slate-800" title={`${w.start} hingga ${w.end}: ${w.completed}/${w.target} sesi, ${w.eligible} evaluasi minggu penuh`}>
                <div className={`w-full rounded-t-lg ${w.completed >= w.target && w.target > 0 ? "bg-emerald-500" : "bg-brand-600"}`} style={{ height: `${w.completed > 0 ? Math.max(5, w.completed / weeklyMax * 100) : 0}%` }}/>
              </div>
              <span className="text-center text-[11px] text-slate-500">{w.start.slice(5)}</span>
            </div>)}
          </div>
        </div>
        <p className="text-xs text-slate-500">Hijau = total sesi mencapai total target pada minggu tersebut. Minggu yang masih berjalan atau aktif sebagian tetap ditampilkan, tetapi tidak dimasukkan ke skor konsistensi.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {weekly.slice(-3).map((w) => <div key={w.start} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className="text-xs text-slate-500">Minggu {w.start}</p>
            <p className="mt-1 font-semibold">{w.completed}/{w.target} sesi</p>
            <div className="mt-2"><ProgressBar value={w.percent ?? 0} label={`Progres ${w.start}`}/></div>
          </div>)}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="space-y-4 p-5 sm:p-6">
          <div><h2 className="text-lg font-bold">Tren bulanan</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jumlah sesi check-in per bulan kalender, selama 12 bulan terakhir.</p></div>
          <div className="overflow-x-auto pb-2"><div className="flex min-w-136 items-end gap-2" role="list" aria-label="Grafik sesi bulanan">
            {monthly.map((m) => <div role="listitem" key={m.month} className="flex min-w-9 flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold">{m.completed}</span>
              <div className="flex h-34 w-full max-w-11 items-end rounded-t-lg bg-slate-100 dark:bg-slate-800" title={`${m.month}: ${m.completed} sesi`}>
                <div className="w-full rounded-t-lg bg-sky-500" style={{height:`${m.completed ? Math.max(5, m.completed/monthlyMax*100) : 0}%`}}/>
              </div><span className="text-[11px] text-slate-500">{monthsID[Number(m.month.slice(5)) - 1]} '{m.month.slice(2,4)}</span>
            </div>)}
          </div></div>
          <p className="text-xs text-slate-500">Bulan yang sedang berlangsung belum lengkap; penurunan jumlah sesi belum tentu menunjukkan penurunan konsistensi.</p>
        </Card>
        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Evaluasi tahunan</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Target mingguan yang tercapai dalam satu tahun.</p></div>
            <label className="text-xs font-semibold">Tahun
              <select className={field} value={selectedYear} onChange={(e) => setYear(Number(e.target.value))}>
                {Array.from({length:5},(_,i)=>currentYear-i).map((y)=><option value={y} key={y}>{y}</option>)}
              </select>
            </label>
          </div>
          <p className="text-4xl font-extrabold text-brand-600">{yearly.percent === null ? "—" : `${yearly.percent}%`}</p>
          <ProgressBar value={yearly.percent ?? 0} label="Konsistensi tahunan"/>
          <p className="text-sm text-slate-600 dark:text-slate-300">{yearly.met} dari {yearly.eligible} habit-minggu penuh mencapai target.</p>
          <p className="text-xs text-slate-500">Minggu parsial, minggu mendatang, dan minggu yang belum selesai tidak dianggap gagal. Skor ini dihitung per pasangan Habit dan minggu, bukan per jumlah sesi.</p>
        </Card>
      </div>

      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3"><NotebookPen className="mt-1 shrink-0 text-brand-600"/><div><h2 className="text-lg font-bold">Jurnal refleksi mingguan</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tulis pengamatan pribadi untuk satu Habit. Catatan tersimpan pada minggu yang dipilih.</p></div></div>
        {!individual ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Pilih satu Habit pada filter di atas untuk menulis atau membaca jurnal refleksi.</p> : <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-semibold">{individual.name}</p><p className="text-xs text-slate-500">Minggu {journalWeek} – {addDaysISO(journalWeek,6)}</p></div>
            <div className="flex gap-2"><Button variant="secondary" disabled={!canPrev} onClick={()=>setWeekOffset((n)=>n+1)} aria-label="Refleksi minggu sebelumnya"><ChevronLeft size={17}/></Button>
              <Button variant="secondary" disabled={weekOffset===0} onClick={()=>setWeekOffset((n)=>Math.max(0,n-1))} aria-label="Refleksi minggu berikutnya"><ChevronRight size={17}/></Button></div>
          </div>
          <ReflectionEditor key={`${individual.id}-${journalWeek}-${note?.id ?? "new"}`} habitId={individual.id} weekStart={journalWeek} existing={note} archived={archived}/>
        </>}
      </Card>
    </>}
  </div>;
}
