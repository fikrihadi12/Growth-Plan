import { useState } from "react";
import { Archive, ArrowLeft, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { TaskForm } from "../tasks/components/TaskForm";
import { TaskRow } from "../tasks/components/TaskRow";
import { completionPercent, formatDate } from "../tasks/demoData";
import { useTasks } from "../tasks/taskContext";
import { PlanForm } from "./components/PlanForm";
import { usePlans } from "./planContext";
import { categoryLabels, kindLabels, periodLabels } from "./planRules";

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { plans, deletePlan, setPlanArchived } = usePlans();
  const { tasks } = useTasks();
  const [editing, setEditing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const plan = plans.find((item) => item.id === id);

  if (!plan) return (
    <Card className="p-8"><h1 className="text-xl font-bold">Rencana tidak ditemukan</h1><p className="mt-2 text-sm text-slate-500">Mungkin rencana sudah dihapus.</p><Link className="mt-4 inline-block text-brand-600 underline" to="/app/plans">Kembali ke rencana</Link></Card>
  );

  const relevant = tasks.filter((task) => task.projectId === plan.id);
  const progress = completionPercent(relevant);
  function remove() {
    if (window.confirm(`Hapus rencana "${plan!.name}" dan ${relevant.length} tugas terkait secara permanen?`)) {
      deletePlan(plan!.id);
      navigate("/app/plans", { replace: true });
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/app/plans" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-600"><ArrowLeft size={16}/> Kembali ke Rencana</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-extrabold">{plan.name}</h1><span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-600/15 dark:text-brand-100">{kindLabels[plan.kind]}</span>{plan.status === "archived" && <span className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Diarsipkan</span>}</div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{plan.description || "Belum ada deskripsi."}</p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Kategori: {categoryLabels[plan.category]} · Periode: {periodLabels[plan.period]} · {plan.startDate ? formatDate(plan.startDate) : "Mulai fleksibel"} — {plan.endDate ? formatDate(plan.endDate) : "Tanpa tanggal akhir"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={()=>{setEditing((v)=>!v); setAddingTask(false);}}><Pencil size={16}/>{editing ? "Tutup edit" : "Edit"}</Button>
          <Button variant="secondary" onClick={()=>setPlanArchived(plan.id, plan.status !== "archived")}>{plan.status === "archived" ? <RotateCcw size={16}/> : <Archive size={16}/>} {plan.status === "archived" ? "Aktifkan" : "Arsipkan"}</Button>
          <Button variant="danger" onClick={remove}><Trash2 size={16}/> Hapus</Button>
        </div>
      </div>
      {editing && <PlanForm key={plan.id} initial={plan} onClose={()=>setEditing(false)}/>}
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex justify-between"><h2 className="font-bold">Progres tugas</h2><span className="font-bold text-brand-600 dark:text-brand-100">{progress}%</span></div>
        <ProgressBar value={progress}/>
        <p className="mt-3 text-xs text-slate-500">{relevant.filter((task)=>task.status === "done").length} dari {relevant.length} tugas selesai. Progres habit belum dihitung pada tahap ini.</p>
      </Card>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">Daftar Tugas</h2>{plan.status === "active" && <Button onClick={()=>setAddingTask((v)=>!v)}><Plus size={16}/>{addingTask ? "Tutup formulir" : "Tambah tugas"}</Button>}</div>
        {plan.status === "archived" && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">Rencana diarsipkan: tugas lama tetap disimpan, tetapi tugas baru hanya bisa ditambahkan setelah rencana diaktifkan kembali.</p>}
        {addingTask && plan.status === "active" && <TaskForm key={plan.id} initialProjectId={plan.id} onClose={()=>setAddingTask(false)}/>}
        <Card className="space-y-2 p-3 sm:p-4">{relevant.length ? relevant.map((task)=><TaskRow key={task.id} task={task}/>) : <EmptyState message="Belum ada tugas untuk rencana ini."/>}</Card>
      </section>
    </div>
  );
}
