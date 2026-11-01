import { BrowserRouter } from "react-router";
import { AppRouter } from "./router";
import { ThemeProvider } from "../hooks/ThemeProvider";
import { AuthProvider } from "../features/auth/AuthProvider";

export default function App() {
  // Auth membatasi workspace ke akun aktif, Theme tetap bisa dipakai di halaman publik.
  return <BrowserRouter><ThemeProvider><AuthProvider><AppRouter /></AuthProvider></ThemeProvider></BrowserRouter>;
}
