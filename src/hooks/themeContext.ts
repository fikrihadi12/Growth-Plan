import { createContext, useContext } from "react";

export type Theme = "light" | "dark";
export type ThemeValue = { theme: Theme; toggleTheme: () => void };

// Context dan custom hook dipisahkan dari komponen Provider untuk Fast Refresh.
export const ThemeContext = createContext<ThemeValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme harus dipanggil di dalam ThemeProvider");
  return context;
}
