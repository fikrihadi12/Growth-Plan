import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace, workspaceIsEmpty, readLegacyWorkspace, parsePendingDraft, pendingKey } from "../src/features/cloud/cloudRules.ts";
import { createDemoPlans } from "../src/features/plans/demoPlans.ts";
import { parseWorkspaceV5 } from "../src/features/plans/workspaceMigration.ts";

function storage(values) { return { getItem: (key) => Object.hasOwn(values, key) ? values[key] : null }; }

test("akun baru benar-benar kosong, bukan demo", () => {
  const data = emptyWorkspace();
  assert.equal(workspaceIsEmpty(data), true);
  assert.equal(parseWorkspaceV5(data)?.plans.length, 0);
});
test("membedakan workspace kosong dan berisi plan", () => {
  const data = { ...emptyWorkspace(), plans: createDemoPlans() };
  assert.equal(workspaceIsEmpty(data), false);
});
test("membaca cadangan V5 dan mempertahankan ID", () => {
  const demo = { ...emptyWorkspace(), plans: createDemoPlans() };
  const found = readLegacyWorkspace(storage({"taskflow.demo.workspace.v5": JSON.stringify(demo)}));
  assert.equal(found?.key,"taskflow.demo.workspace.v5");
  assert.equal(found?.data.plans[0].id,demo.plans[0].id);
});
test("migrasi dari V4 menciptakan snapshot baseline", () => {
  const demo = { plans: createDemoPlans(), tasks: [], milestones: [], habits: [], habitLogs: [] };
  const found = readLegacyWorkspace(storage({"taskflow.demo.workspace.v4": JSON.stringify(demo)}));
  assert.deepEqual(found?.data.habitTargets,[]);
  assert.deepEqual(found?.data.reflections,[]);
});
test("JSON V5 rusak tidak diimpor, V4 valid menjadi fallback", () => {
  const v4 = { plans: createDemoPlans(), tasks: [], milestones: [], habits: [], habitLogs: [] };
  const found = readLegacyWorkspace(storage({"taskflow.demo.workspace.v5": "{rusak", "taskflow.demo.workspace.v4": JSON.stringify(v4)}));
  assert.equal(found?.key,"taskflow.demo.workspace.v4");
});
test("backup pending menolak data tak valid", () => {
  assert.equal(parsePendingDraft({baseVersion:1,data:{plans:[]}}),null);
  assert.equal(parsePendingDraft({baseVersion:-2,data:emptyWorkspace()}),null);
  assert.equal(parsePendingDraft({baseVersion:0,data:emptyWorkspace()}),null);
});
test("backup pending mempertahankan versi dan data", () => {
  const draft = parsePendingDraft({baseVersion:7,data:emptyWorkspace()});
  assert.equal(draft?.baseVersion,7);
  assert.equal(draft?.data.tasks.length,0);
});
test("backup hanya ditautkan ke pengguna yang tepat", () => {
  assert.notEqual(pendingKey("user-a"),pendingKey("user-b"));
});
