import { FolderKanban, LayoutDashboard, ListTodo, Settings } from "lucide-react";
import { NavLink, Outlet } from "react-router";

const navigation = [
  {
    label: "Dashboard",
    path: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    path: "/app/projects",
    icon: FolderKanban,
  },
  {
    label: "My Tasks",
    path: "/app/tasks",
    icon: ListTodo,
  },
  {
    label: "Settings",
    path: "/app/settings/profile",
    icon: Settings,
  },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
          <h1 className="mb-8 text-2xl font-bold text-blue-600">TaskFlow</h1>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${isActive ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-8">
          <header className="mb-6 lg:hidden">
            <h1 className="text-xl font-bold text-blue-600">TaskFlow</h1>

            <nav className="mt-4 flex gap-2 overflow-x-auto">
              {navigation.map((item) => (
                <NavLink key={item.path} to={item.path} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${isActive ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}
