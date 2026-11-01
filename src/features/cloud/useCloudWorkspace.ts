import type { SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseWorkspaceV5 } from "../plans/workspaceMigration.ts";
import type { WorkspaceData } from "../plans/workspaceOperations";
import type { CloudPhase } from "./cloudContext";
import { CloudConflictError, loadCloudWorkspace, saveCloudWorkspace } from "./cloudRepository";
import type { PendingDraft } from "./cloudRules";
import { emptyWorkspace, parsePendingDraft, pendingKey, readLegacyWorkspace, workspaceIsEmpty } from "./cloudRules";

export function useCloudWorkspace(userId: string) {
  const [workspace, setState] = useState<WorkspaceData>(emptyWorkspace);
  const [phase, setPhase] = useState<CloudPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<PendingDraft | null>(null);
  const [availableLocalData, setAvailableLocalData] = useState(false);
  const workspaceRef = useRef(workspace);
  const phaseRef = useRef<CloudPhase>("loading");
  const versionRef = useRef<number | null>(null);
  const pendingRef = useRef(false);
  const writingRef = useRef(false);
  const generationRef = useRef(0);

  const changePhase = useCallback((next: CloudPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const saveBackup = useCallback(
    (data: WorkspaceData) => {
      try {
        window.localStorage.setItem(pendingKey(userId), JSON.stringify({ baseVersion: versionRef.current, data }));
      } catch {
        /* Server tetap dicoba; UI akan menampilkan kegagalan koneksi jika terjadi. */
      }
    },
    [userId],
  );
  const clearBackup = useCallback(() => {
    try {
      window.localStorage.removeItem(pendingKey(userId));
    } catch {
      /* storage diblokir */
    }
  }, [userId]);

  const flush = useCallback(async () => {
    if (writingRef.current || (phaseRef.current !== "saved" && phaseRef.current !== "saving" && phaseRef.current !== "offline")) return;
    writingRef.current = true;
    const generation = generationRef.current;
    try {
      while (pendingRef.current && generationRef.current === generation) {
        pendingRef.current = false;
        const snapshot = workspaceRef.current;
        changePhase("saving");
        try {
          const newVersion = await saveCloudWorkspace(userId, snapshot, versionRef.current);
          if (generationRef.current !== generation) return;
          versionRef.current = newVersion;
          if (pendingRef.current) saveBackup(workspaceRef.current);
          else {
            clearBackup();
            setError(null);
            changePhase("saved");
          }
        } catch (caught) {
          if (generationRef.current !== generation) return;
          pendingRef.current = true;
          const conflict = caught instanceof CloudConflictError;
          setError(caught instanceof Error ? caught.message : "Gagal menyimpan ke Supabase.");
          changePhase(conflict ? "conflict" : "offline");
          return;
        }
      }
    } finally {
      writingRef.current = false;
    }
  }, [changePhase, clearBackup, saveBackup, userId]);

  const load = useCallback(async () => {
    const generation = ++generationRef.current;
    writingRef.current = false;
    pendingRef.current = false;

    // Beri kesempatan effect selesai sebelum memperbarui state.
    await Promise.resolve();

    if (generation !== generationRef.current) return;

    changePhase("loading");
    setError(null);
    setDraft(null);
    let localDraft: PendingDraft | null = null;
    try {
      const raw = window.localStorage.getItem(pendingKey(userId));
      if (raw) localDraft = parsePendingDraft(JSON.parse(raw));
    } catch {
      /* browser storage tidak dapat diakses */
    }
    // Baca cadangan SEBELUM network: saat offline tetap bisa diunduh tanpa mengunggah.
    setDraft(localDraft);
    try {
      const found = await loadCloudWorkspace(userId);
      if (generation !== generationRef.current) return;
      const data = found.data ?? emptyWorkspace();
      versionRef.current = found.version;
      workspaceRef.current = data;
      setState(data);
      // Bila request lama sebenarnya sudah tersimpan sebelum koneksi terputus,
      // cocokkan snapshot dan cloud agar tidak memunculkan peringatan palsu.
      if (localDraft && JSON.stringify(localDraft.data) === JSON.stringify(data)) {
        clearBackup();
        localDraft = null;
      }
      setDraft(localDraft);
      try {
        const old = readLegacyWorkspace(window.localStorage);
        setAvailableLocalData(Boolean(old && !workspaceIsEmpty(old.data)));
      } catch {
        setAvailableLocalData(false);
      }
      // Pulihkan hanya atas keputusan user; jangan pernah unggah otomatis sesudah reload.
      changePhase(localDraft ? "recovery" : "saved");
    } catch (caught) {
      if (generation !== generationRef.current) return;
      setError(caught instanceof Error ? caught.message : "Tidak dapat membaca data cloud.");
      changePhase("fatal");
    }
  }, [changePhase, clearBackup, userId]);

  useEffect(() => {
    void load();
    return () => {
      generationRef.current += 1;
    };
  }, [load]);

  const setWorkspace = useCallback(
    (change: SetStateAction<WorkspaceData>) => {
      if (!["saved", "saving", "offline"].includes(phaseRef.current)) return;
      const previous = workspaceRef.current;
      const next = typeof change === "function" ? change(previous) : change;
      if (next === previous) return;
      if (!parseWorkspaceV5(next)) {
        setError("Perubahan dibatalkan: hasil operasi tidak memenuhi validasi data. Muat ulang versi cloud dan periksa kode fitur terkait.");
        changePhase("fatal"); // Hindari UI mengaku berhasil ketika data tidak valid.
        return;
      }
      workspaceRef.current = next;
      pendingRef.current = true;
      setState(next);
      saveBackup(next);
      if (phaseRef.current !== "offline") {
        changePhase("saving");
        void flush();
      }
    },
    [changePhase, flush, saveBackup],
  );

  const retrySave = useCallback(() => {
    if (phaseRef.current !== "offline") return;
    changePhase("saving");
    void flush();
  }, [changePhase, flush]);

  const recoverDraft = useCallback(() => {
    if (phaseRef.current !== "recovery" || !draft) return;
    if (draft.baseVersion !== versionRef.current) {
      setError("Versi cloud sudah berbeda. Ekspor cadangan dahulu; pemulihan otomatis diblokir agar tidak menimpa data perangkat lain.");
      return;
    }
    setDraft(null);
    changePhase("saved");
    setWorkspace(draft.data);
  }, [changePhase, draft, setWorkspace]);

  const discardDraft = useCallback(() => {
    if (phaseRef.current !== "recovery") return;
    clearBackup();
    setDraft(null);
    changePhase("saved");
  }, [changePhase, clearBackup]);

  const importLocalData = useCallback((): boolean => {
    if (phaseRef.current !== "saved" || !workspaceIsEmpty(workspaceRef.current)) return false;
    try {
      const existing = readLegacyWorkspace(window.localStorage);
      if (!existing || workspaceIsEmpty(existing.data)) return false;
      setWorkspace(existing.data);
      return true;
    } catch {
      return false;
    }
  }, [setWorkspace]);

  const exportBackup = useCallback(() => {
    const payload = { exportedAt: new Date().toISOString(), userId, version: versionRef.current, data: workspaceRef.current, draft };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "growthplan-cadangan-pribadi.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [userId, draft]);

  return { workspace, setWorkspace, phase, error, draft, availableLocalData, retrySave, reloadCloud: load, recoverDraft, discardDraft, importLocalData, exportBackup };
}
