import { Link, Navigate, Route, Routes, useParams } from "react-router";
import { AppLayout } from "../layouts/AppLayout";
import DashboardPage from "../features/dashboard/DashboardPage";
import PlansPage from "../features/plans/PlansPage";
import PlanDetailPage from "../features/plans/PlanDetailPage";
import TasksPage from "../features/tasks/TasksPage";
import HabitsPage from "../features/habits/HabitsPage";
import SettingsPage from "../features/settings/SettingsPage";
import { AuthInfoPage } from "../features/auth/AuthInfoPage";

function LegacyProjectRedirect() {
  const { id } = useParams<{id:string}>();
  return <Navigate to={id ? `/app/plans/${id}` : "/app/plans"} replace/>;
}
function NotFoundPage() {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950"><p className="text-6xl font-black text-brand-600">404</p><h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1><Link className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white" to="/app/dashboard">Kembali ke Dashboard</Link></div>;
}
export function AppRouter() {
  return (
    <Routes>
      {/* Mode demo: belum ada Protected Route karena autentikasi belum dibuat. */}
      <Route path="/" element={<Navigate to="/app/dashboard" replace/>}/>
      <Route path="/login" element={<AuthInfoPage title="Login"/>}/>
      <Route path="/register" element={<AuthInfoPage title="Registrasi"/>}/>
      <Route path="/app" element={<AppLayout/>}>
        <Route index element={<Navigate to="dashboard" replace/>}/>
        <Route path="dashboard" element={<DashboardPage/>}/>
        <Route path="plans" element={<PlansPage/>}/>
        <Route path="plans/:id" element={<PlanDetailPage/>}/>
        {/* URL Tahap 2 tetap berfungsi, dialihkan ke halaman Rencana. */}
        <Route path="projects" element={<LegacyProjectRedirect/>}/>
        <Route path="projects/:id" element={<LegacyProjectRedirect/>}/>
        <Route path="tasks" element={<TasksPage/>}/>
        <Route path="habits" element={<HabitsPage/>}/>
        <Route path="settings/profile" element={<SettingsPage/>}/>
      </Route>
      <Route path="*" element={<NotFoundPage/>}/>
    </Routes>
  );
}
