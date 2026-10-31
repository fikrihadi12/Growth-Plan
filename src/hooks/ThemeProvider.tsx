import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ThemeContext } from "./themeContext";
import type { Theme } from "./themeContext";
const THEME_KEY = "taskflow.theme.v1";

function getInitialTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Sinkronisasi ke HTML dan localStorage hanya dilakukan ketika tema berubah.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { window.localStorage.setItem(THEME_KEY, theme); } catch { /* storage tidak tersedia */ }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => current === "light" ? "dark" : "light");
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

