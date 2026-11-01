import type { WorkspaceData } from "../plans/workspaceOperations";
import { parseWorkspaceV5, upgradeWorkspaceV4, upgradeWorkspaceV3, upgradeWorkspaceV2 } from "../plans/workspaceMigration.ts";

export const LOCAL_KEYS = ["taskflow.demo.workspace.v5", "taskflow.demo.workspace.v4", "taskflow.demo.workspace.v3", "taskflow.demo.workspace.v2"] as const;
export const pendingKey = (userId: string) => `growthplan.pending.${userId}`;

/** Workspace akun baru sengaja kosong: tidak ada data demo yang diunggah tanpa persetujuan. */
export function emptyWorkspace(): WorkspaceData {
  return { plans: [], tasks: [], milestones: [], habits: [], habitLogs: [], habitTargets: [], reflections: [] };
}
export function workspaceIsEmpty(data: WorkspaceData): boolean {
  return Object.values(data).every((items) => items.length === 0);
}

export function readLegacyWorkspace(storage: Pick<Storage, "getItem">): { key: string; data: WorkspaceData } | null {
  // Fallback berurutan; jika data lama rusak, jangan menimpa data cloud.
  for (const [index, key] of LOCAL_KEYS.entries()) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    try {
      const value: unknown = JSON.parse(raw);
      const converted = index === 0 ? parseWorkspaceV5(value)
        : index === 1 ? upgradeWorkspaceV4(value)
          : index === 2 ? (() => { const v4 = upgradeWorkspaceV3(value); return v4 ? upgradeWorkspaceV4(v4) : null; })()
            : (() => { const v4 = upgradeWorkspaceV2(value); return v4 ? upgradeWorkspaceV4(v4) : null; })();
      if (converted) return { key, data: converted };
    } catch { /* Abaikan JSON rusak; jangan hapus aslinya. */ }
  }
  return null;
}

export type PendingDraft = { baseVersion: number | null; data: WorkspaceData };
export function parsePendingDraft(value: unknown): PendingDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.baseVersion !== null && (!Number.isInteger(record.baseVersion) || Number(record.baseVersion) < 1)) return null;
  const data = parseWorkspaceV5(record.data);
  return data ? { baseVersion: record.baseVersion as number | null, data } : null;
}
