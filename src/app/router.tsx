import { Navigate, Route, Routes } from "react-router";

import DashboardPage from "../features/dashboard/DashboardPage";
import { AppLayout } from "../layouts/AppLayout";

function Page({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold">{title}</h2>

      <p className="mt-2 text-slate-500">Halaman ini akan dikembangkan pada tahap berikutnya.</p>
    </section>
  );
}

export function AppRouter() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      
      {/*  <Route path="/" element={<Page title="Welcome to TaskFlow" />} /> */}

      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

      <Route path="/login" element={<Page title="Login" />} />

      <Route path="/register" element={<Page title="Register" />} />

      {/* APPLICATION ROUTES */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="projects" element={<Page title="Projects" />} />

        <Route path="projects/:id" element={<Page title="Project Details" />} />

        <Route path="tasks" element={<Page title="My Tasks" />} />

        <Route path="settings/profile" element={<Page title="Profile Settings" />} />
      </Route>

      {/* NOT FOUND */}
      <Route path="*" element={<Page title="404 - Page Not Found" />} />
    </Routes>
  );
}
