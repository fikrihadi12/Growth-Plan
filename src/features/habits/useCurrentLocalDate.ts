import { useEffect, useState } from "react";
import { todayLocalISO } from "./habitRules";

/** Tanggal diperbarui saat tab kembali aktif dan berkala saat tab dibiarkan terbuka. */
export function useCurrentLocalDate(): string {
  const [today, setToday] = useState(todayLocalISO);
  useEffect(() => {
    const refresh = () => setToday((previous) => {
      const current = todayLocalISO();
      return previous === current ? previous : current;
    });
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return today;
}
