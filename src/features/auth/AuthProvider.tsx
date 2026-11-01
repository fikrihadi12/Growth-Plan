import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    let eventAfterStartup = false;
    // Listener menangani login, logout, refresh token, dan callback verifikasi email.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION" && eventAfterStartup) return;
      if (event !== "INITIAL_SESSION") eventAfterStartup = true;
      if (live) { setSession(nextSession); setLoading(false); setError(null); }
    });
    // Fallback eksplisit bila INITIAL_SESSION terlambat pada browser tertentu.
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (live && !eventAfterStartup) {
        if (sessionError) setError(sessionError.message);
        else setSession(data.session);
        setLoading(false);
      }
    }).catch((caught: unknown) => {
      if (live && !eventAfterStartup) { setError(caught instanceof Error ? caught.message : "Gagal membaca sesi login."); setLoading(false); }
    });
    return () => { live = false; subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={{ session, loading, error }}>{children}</AuthContext.Provider>;
}
