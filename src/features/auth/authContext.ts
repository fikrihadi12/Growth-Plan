import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

type AuthContextValue = { session: Session | null; loading: boolean; error: string | null };
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth harus dipanggil di dalam AuthProvider");
  return value;
}
