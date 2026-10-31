import { BrowserRouter } from "react-router";
import { AppRouter } from "./router";
import { ThemeProvider } from "../hooks/ThemeProvider";
import { TaskProvider } from "../features/tasks/TaskProvider";

export default function App() {
  // Provider bersifat global: semua halaman membaca tema dan daftar tugas yang sama.
  return (
    <BrowserRouter>
      <ThemeProvider>
        <TaskProvider>
          <AppRouter />
        </TaskProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
