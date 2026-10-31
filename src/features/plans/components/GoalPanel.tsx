import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { formatDate } from "../../tasks/demoData";
import { usePlans } from "../planContext";
import { progressModeLabels, validateGoalMetric, validateMilestoneInput } from "../goalRules";
import type { GoalMetric, Milestone, MilestoneInput, Plan } from "../types";

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

function MilestoneRow({ milestone, archived }: { milestone: Milestone; archived: boolean }) {
  const { toggleMilestone, updateMilestone, deleteMilestone } = usePlans();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [dueDate, setDueDate] = useState(milestone.dueDate ?? "");
  const [error, setError] = useState("");

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: MilestoneInput = { title, dueDate: dueDate || null };
    const problem = validateMilestoneInput(input);
    if (problem) { setError(problem); return; }
    if (!updateMilestone(milestone.id, input)) { setError("Gagal menyimpan milestone."); return; }
    setEditing(false);
    setError("");
  }
  function remove() {
    if (window.confirm(`Hapus milestone "${milestone.title}"?`)) deleteMilestone(milestone.id);
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      {editing ? (
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <label className="text-xs font-semibold">Nama milestone
            <input autoFocus required minLength={2} maxLength={120} className={`mt-1 ${fieldClass}`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="text-xs font-semibold">Target tanggal
            <input type="date" className={`mt-1 ${fieldClass}`} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
          <div className="flex gap-2"><Button type="submit">Simpan</Button><Button variant="secondary" onClick={() => {setEditing(false);setError("");}}>Batal</Button></div>
          {error && <p role="alert" className="text-sm text-red-600 sm:col-span-3">{error}</p>}
        </form>
      ) : (
        <div className="flex flex-wrap items-start gap-3 sm:items-center">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-indigo-600 sm:mt-0" aria-label={`Tandai milestone ${milestone.title} selesai`} checked={milestone.completedAt !== null} disabled={archived} onChange={(e) => toggleMilestone(milestone.id, e.target.checked)} />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${milestone.completedAt ? "text-slate-400 line-through" : ""}`}>{milestone.title}</p>
            <p className="mt-1 text-xs text-slate-500">{milestone.completedAt ? `Tercapai ${new Date(milestone.completedAt).toLocaleDateString("id-ID")}` : milestone.dueDate ? `Target ${formatDate(milestone.dueDate)}` : "Tanpa batas tanggal"}</p>
          </div>
          {!archived && <div className="flex gap-1">
            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={`Edit milestone ${milestone.title}`} onClick={() => setEditing(true)}><Pencil size={16}/></button>
            <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950" aria-label={`Hapus milestone ${milestone.title}`} onClick={remove}><Trash2 size={16}/></button>
          </div>}
        </div>
      )}
    </div>
  );
}

export function GoalPanel({ plan }: { plan: Plan }) {
  const { milestones, setGoalMode, updateGoalMetric, addMilestone } = usePlans();
  const [label, setLabel] = useState(plan.goal?.metric.label ?? "Target");
  const [unit, setUnit] = useState(plan.goal?.metric.unit ?? "unit");
  const [current, setCurrent] = useState(String(plan.goal?.metric.current ?? 0));
  const [target, setTarget] = useState(String(plan.goal?.metric.target ?? 1));
  const [metricError, setMetricError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [milestoneError, setMilestoneError] = useState("");
  const ownMilestones = milestones.filter((m) => m.planId === plan.id).sort((a,b) => a.createdAt.localeCompare(b.createdAt));
  const archived = plan.status === "archived";
  const mode = plan.goal?.progressMode ?? "tasks";

  function saveMetric(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data: GoalMetric = { label, unit, current: current.trim() === "" ? NaN : Number(current), target: target.trim() === "" ? NaN : Number(target) };
    const problem = validateGoalMetric(data);
    if (problem) { setMetricError(problem); return; }
    if (!updateGoalMetric(plan.id, data)) { setMetricError("Tidak dapat memperbarui target pada rencana ini."); return; }
    setMetricError("");
  }

  function createMilestone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: MilestoneInput = { title: newTitle, dueDate: newDue || null };
    const problem = validateMilestoneInput(input);
    if (problem) { setMilestoneError(problem); return; }
    if (!addMilestone(plan.id, input)) { setMilestoneError("Tidak dapat menambah milestone."); return; }
    setNewTitle("");setNewDue("");setMilestoneError("");
  }

  return (
    <section className="space-y-4" aria-labelledby="goal-heading">
      <div><h2 id="goal-heading" className="text-xl font-bold">Target & Milestone</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pilih satu cara utama untuk menghitung progres goal. Aktivitas lain tetap disimpan sebagai pendukung.</p></div>
      <Card className="p-5 sm:p-6">
        <label className="block text-sm font-semibold">Metode perhitungan progres
          <select disabled={archived} value={mode} onChange={(e) => {setGoalMode(plan.id, e.target.value as typeof mode);setMetricError("");}} className={`mt-2 ${fieldClass}`}>
            {Object.entries(progressModeLabels).map(([key,value]) => <option key={key} value={key}>{value}</option>)}
          </select>
        </label>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{mode === "tasks" ? "Progres diambil dari tugas selesai / total tugas." : mode === "milestones" ? "Progres diambil dari milestone tercapai / total milestone." : "Progres diambil dari realisasi / target angka, maksimum 100%."} Perubahan metode tidak menghapus tugas atau milestone.</p>
        {mode === "numeric" && (
          <form onSubmit={saveMetric} className="mt-5 grid gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-2">
            <label className="text-sm font-semibold">Nama indikator
              <input disabled={archived} required minLength={2} maxLength={80} className={`mt-1 ${fieldClass}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Contoh: Buku dibaca" />
            </label>
            <label className="text-sm font-semibold">Satuan (opsional)
              <input disabled={archived} maxLength={24} className={`mt-1 ${fieldClass}`} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Contoh: buku, km" />
            </label>
            <label className="text-sm font-semibold">Realisasi
              <input disabled={archived} required type="number" min={0} max={1000000000} step="any" className={`mt-1 ${fieldClass}`} value={current} onChange={(e) => setCurrent(e.target.value)} />
            </label>
            <label className="text-sm font-semibold">Target angka
              <input disabled={archived} required type="number" min="0.000001" max={1000000000} step="any" className={`mt-1 ${fieldClass}`} value={target} onChange={(e) => setTarget(e.target.value)} />
            </label>
            {metricError && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{metricError}</p>}
            {!archived && <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Button type="submit"><CheckCircle2 size={17}/> Simpan target</Button><p className="text-xs text-slate-500">Angka aktual bisa melebihi target, indikator tetap maksimal 100%.</p></div>}
          </form>
        )}
      </Card>
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="font-bold">Milestone Goal</h3><p className="mt-1 text-xs text-slate-500">{ownMilestones.filter((m) => m.completedAt !== null).length} dari {ownMilestones.length} milestone tercapai</p></div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 dark:bg-slate-800 dark:text-brand-100">{ownMilestones.length} milestone</span>
        </div>
        {!archived && <form onSubmit={createMilestone} className="grid gap-3 sm:grid-cols-[1fr_190px_auto] sm:items-end">
          <label className="text-xs font-semibold">Milestone baru
            <input required minLength={2} maxLength={120} value={newTitle} onChange={(e) => {setNewTitle(e.target.value);setMilestoneError("");}} placeholder="Contoh: Menyelesaikan tahap 1" className={`mt-1 ${fieldClass}`} />
          </label>
          <label className="text-xs font-semibold">Tenggat (opsional)
            <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} className={`mt-1 ${fieldClass}`} />
          </label>
          <Button type="submit"><Plus size={16}/> Tambah</Button>
          {milestoneError && <p role="alert" className="text-sm text-red-600 sm:col-span-3">{milestoneError}</p>}
        </form>}
        {ownMilestones.length ? <div className="space-y-2">{ownMilestones.map((m) => <MilestoneRow key={m.id} milestone={m} archived={archived}/>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Belum ada milestone. Tambahkan langkah penting untuk mencapai Goal.</p>}
        <p className="text-xs text-slate-500">Milestone hanya memengaruhi progress bar utama ketika metode "Berdasarkan milestone" dipilih. Habit berulang akan dikembangkan pada Tahap 4.</p>
      </Card>
    </section>
  );
}
