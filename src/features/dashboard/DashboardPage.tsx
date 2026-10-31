import { FolderKanban, LayoutDashboard, ListTodo } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-500">Selamat datang di TaskFlow!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <FolderKanban className="mb-4 text-blue-600" />
          <p className="text-sm text-slate-500">Total Projects</p>
          <h2 className="text-3xl font-bold">3</h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <ListTodo className="mb-4 text-blue-600" />
          <p className="text-sm text-slate-500">Total Tasks</p>
          <h2 className="text-3xl font-bold">12</h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <LayoutDashboard className="mb-4 text-green-600" />
          <p className="text-sm text-slate-500">Completed Tasks</p>
          <h2 className="text-3xl font-bold">8</h2>
        </div>
      </div>
    </div>
  );
}
