import type { ReactNode } from "react";
import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes, useLocation, useParams } from "react-router";
import { useAuth } from "../features/auth/authContext";
import { supabaseConfigured } from "../lib/supabase";
// Public pages
const AuthPage = lazy(() => import("../features/auth/AuthPage"));
const ResetPasswordPage = lazy(() => import("../features/auth/ResetPasswordPage"));
const SetupPage = lazy(() => import("../features/auth/SetupPage"));

// Application pages
const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage"));

const PlansPage = lazy(() => import("../features/plans/PlansPage"));

const PlanDetailPage = lazy(() => import("../features/plans/PlanDetailPage"));

const TasksPage = lazy(() => import("../features/tasks/TasksPage"));

const HabitsPage = lazy(() => import("../features/habits/HabitsPage"));

const AnalyticsPage = lazy(() => import("../features/analytics/AnalyticsPage"));

const SettingsPage = lazy(() => import("../features/settings/SettingsPage"));

// Layout dan Workspace Provider hanya dimuat
// ketika pengguna memasuki area aplikasi.
const LazyTaskProvider = lazy(() =>
  import("../features/tasks/TaskProvider").then((module) => ({
    default: module.TaskProvider,
  })),
);

const LazyAppLayout = lazy(() =>
  import("../layouts/AppLayout").then((module) => ({
    default: module.AppLayout,
  })),
);

function ProtectedApp() {
  const { session, loading, error } = useAuth();
  const location = useLocation();
  if (!supabaseConfigured) return <Navigate to="/setup" replace />;
  if (loading)
    return (
      <div role="status" className="p-8 text-slate-600">
        Memeriksa sesi pengguna…
      </div>
    );
  if (error)
    return (
      <div role="alert" className="p-8">
        Gagal memeriksa sesi: {error}. Periksa koneksi dan muat ulang halaman.
      </div>
    );
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return (
    <LazyTaskProvider key={session.user.id} userId={session.user.id}>
      <LazyAppLayout />
    </LazyTaskProvider>
  );
}
function PublicRoute({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  if (loading)
    return (
      <div role="status" className="p-8">
        Memeriksa sesi…
      </div>
    );
  return <>{children}</>;
}
function LegacyProjectRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/app/plans/${id}` : "/app/plans"} replace />;
}
function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <p className="text-6xl font-black text-brand-600">404</p>
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <Link className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white" to="/app/dashboard">
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status">
      <p className="text-slate-500">Memuat halaman...</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthPage mode="login" />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthPage mode="register" />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <AuthPage mode="forgot" />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        {/* ProtectedApp memuat workspace SESUDAH autentikasi, bukan sebelumnya. */}
        <Route path="/app" element={<ProtectedApp />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="plans/:id" element={<PlanDetailPage />} />
          <Route path="projects" element={<LegacyProjectRedirect />} />
          <Route path="projects/:id" element={<LegacyProjectRedirect />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings/profile" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
