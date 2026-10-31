import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useHabits } from "../habitContext";
import { todayLocalISO, validateHabitInput, weekDays } from "../habitRules";
import type { Habit, HabitInput } from "../types";

const field = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

export function HabitForm({ planId, initial, onClose }: { planId: string; initial?: Habit; onClose: () => void }) {
  const { addHabit, updateHabit } = useHabits();
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState(initial?.weeklyTarget ?? 3);
  const [days, setDays] = useState<number[]>(initial?.scheduledDays ?? [0, 2, 4]);
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayLocalISO());
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: HabitInput = {
      name, weeklyTarget: target, scheduledDays: days,
      startDate, endDate: endDate || null,
    };
    const invalid = validateHabitInput(input);
    if (invalid) { setError(invalid); return; }
    const saved = initial ? updateHabit(initial.id, input) : addHabit(planId, input);
    if (!saved) {
      setError("Gagal menyimpan. Pastikan Goal masih aktif dan tanggal baru tidak mengecualikan riwayat check-in.");
      return;
    }
    onClose();
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold">{initial ? "Edit kebiasaan" : "Buat kebiasaan baru"}</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Contoh: Gym 3 kali per minggu selama 12 minggu.</p>
      </div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-semibold">Nama aktivitas *
          <input autoFocus required minLength={2} maxLength={100} className={field} value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Misalnya: Gym, jalan kaki, membaca" />
        </label>
        <label className="text-sm font-semibold">Target setiap minggu *
          <select className={field} value={target} onChange={(e) => setTarget(Number(e.target.value))}>
            {Array.from({ length: 7 }, (_, i) => i + 1).map((count) => <option key={count} value={count}>{count} kali / minggu</option>)}
          </select>
        </label>
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold">Hari yang direncanakan (opsional)</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sebagai pengingat visual. Check-in tetap boleh dilakukan pada hari lain.</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Hari latihan pilihan">
            {weekDays.map((day, index) => {
              const selected = days.includes(index);
              return <button key={day} type="button" aria-pressed={selected} onClick={() => setDays((previous) => selected ? previous.filter((value) => value !== index) : [...previous, index].sort())}
                className={`min-w-11 rounded-xl border px-3 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-brand-600 ${selected ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-100" : "border-slate-200 text-slate-500 dark:border-slate-700"}`}>{day}</button>;
            })}
          </div>
        </div>
        <label className="text-sm font-semibold">Mulai *
          <input type="date" required className={field} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">Selesai (opsional)
          <input type="date" min={startDate || undefined} className={field} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-600 sm:col-span-2" role="alert">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit">{initial ? "Simpan perubahan" : "Buat kebiasaan"}</Button>
        </div>
      </form>
    </Card>
  );
}
