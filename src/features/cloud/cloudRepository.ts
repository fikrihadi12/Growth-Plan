import { supabase } from "../../lib/supabase";
import { parseWorkspaceV5 } from "../plans/workspaceMigration.ts";
import type { WorkspaceData } from "../plans/workspaceOperations";

export class CloudConflictError extends Error {
  constructor() { super("Data telah berubah pada perangkat lain. Simpan cadangan, lalu muat ulang versi cloud."); }
}

export async function loadCloudWorkspace(userId: string): Promise<{ data: WorkspaceData | null; version: number | null }> {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await supabase.from("user_workspaces")
    .select("data, version").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) return { data: null, version: null };
  // Data cloud tak valid harus menghentikan operasi; jangan pernah timpa dengan data kosong.
  const valid = parseWorkspaceV5(data.data);
  if (!valid || !Number.isSafeInteger(data.version) || data.version < 1) throw new Error("Data di server tidak valid. Penyimpanan dihentikan demi keamanan data.");
  return { data: valid, version: data.version };
}

/** Compare-and-swap: perubahan di tab/perangkat lain tidak tertimpa diam-diam. */
export async function saveCloudWorkspace(userId: string, workspace: WorkspaceData, expectedVersion: number | null): Promise<number> {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  if (!parseWorkspaceV5(workspace)) throw new Error("Workspace tidak valid; data tidak dikirim.");
  if (expectedVersion === null) {
    const { data, error } = await supabase.from("user_workspaces")
      .insert({ user_id: userId, version: 1, data: workspace })
      .select("version").single();
    if (error?.code === "23505") throw new CloudConflictError();
    if (error) throw error;
    return data.version;
  }
  const { data, error } = await supabase.from("user_workspaces")
    .update({ data: workspace, version: expectedVersion + 1, updated_at: new Date().toISOString() })
    .eq("user_id", userId).eq("version", expectedVersion)
    .select("version").maybeSingle();
  if (error) throw error;
  if (!data) throw new CloudConflictError();
  return data.version;
}
