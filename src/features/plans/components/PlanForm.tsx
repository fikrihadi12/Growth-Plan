import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { usePlans } from "../planContext";
import { categoryLabels, kindLabels, periodLabels, validatePlanInput } from "../planRules";
import type { Plan, PlanCategory, PlanInput, PlanKind, PlanPeriod } from "../types";

const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

export function PlanForm({ initial, onClose }: { initial?: Plan; onClose: () => void }) {
  const { addPlan, updatePlan } = usePlans();
  const navigate = useNavigate();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [kind, setKind] = useState<PlanKind>(initial?.kind ?? "goal");
  const [period, setPeriod] = useState<PlanPeriod>(initial?.period ?? "weekly");
  const [category, setCategory] = useState<PlanCategory>(initial?.category ?? "personal");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: PlanInput = { name, description, kind, period, category, startDate: startDate || null, endDate: endDate || null };
    const validationError = validatePlanInput(input);
    if (validationError) { setError(validationError); return; }
    try {
      if (initial) {
        updatePlan(initial.id, input);
        onClose();
      } else {
        const id = addPlan(input);
        navigate(`/app/plans/${id}`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menyimpan rencana.");
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{initial ? "Edit rencana" : "Buat rencana baru"}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Rencana bisa berupa proyek atau target pribadi, seperti olahraga.</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-600/15 dark:text-brand-100">Data lokal</span>
      </div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold">Nama rencana *</span>
          <input autoFocus required minLength={2} maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setError(""); }} className={fieldClass} placeholder="Contoh: Program Gym 12 Minggu" />
        </label>
        <label>
          <span className="text-sm font-semibold">Jenis rencana</span>
          <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value as PlanKind)}>
            {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span className="text-sm font-semibold">Periode perencanaan</span>
          <select className={fieldClass} value={period} onChange={(event) => setPeriod(event.target.value as PlanPeriod)}>
            {Object.entries(periodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span className="text-sm font-semibold">Kategori</span>
          <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value as PlanCategory)}>
            {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="text-sm font-semibold">Deskripsi (opsional)</span>
          <textarea rows={3} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} className={fieldClass} placeholder="Apa yang ingin dicapai dan mengapa?" />
        </label>
        <label>
          <span className="text-sm font-semibold">Tanggal mulai (opsional)</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={fieldClass} />
        </label>
        <label>
          <span className="text-sm font-semibold">Tanggal selesai (opsional)</span>
          <input type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} className={fieldClass} />
        </label>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400 sm:col-span-2">Periode harian/mingguan/bulanan/tahunan adalah horizon rencana. Frekuensi gym 1–7 kali per minggu akan hadir pada tahap Habit Tracker.</p>
        {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit">{initial ? "Simpan perubahan" : "Buat rencana"}</Button>
        </div>
      </form>
    </Card>
  );
}
