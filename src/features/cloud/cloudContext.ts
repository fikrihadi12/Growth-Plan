import { createContext, useContext } from "react";
import type { PendingDraft } from "./cloudRules";

export type CloudPhase = "loading" | "saved" | "saving" | "offline" | "conflict" | "recovery" | "fatal";
export type CloudContextValue = {
  phase: CloudPhase;
  error: string | null;
  draft: PendingDraft | null;
  retrySave: () => void;
  reloadCloud: () => Promise<void>;
  recoverDraft: () => void;
  discardDraft: () => void;
  importLocalData: () => boolean;
  exportBackup: () => void;
  availableLocalData: boolean;
};
export const CloudContext = createContext<CloudContextValue | null>(null);
export function useCloud() {
  const value = useContext(CloudContext);
  if (!value) throw new Error("useCloud harus dipanggil di dalam TaskProvider");
  return value;
}
