import test from 'node:test';
import assert from 'node:assert/strict';
import { insertPlan, replacePlan, removePlanAndTasks, insertTask, updateTaskInWorkspace, removeTaskFromWorkspace } from '../src/features/plans/workspaceOperations.ts';
import { validatePlanInput, isDateISO } from '../src/features/plans/planRules.ts';

const baseInput = {name:'Gym 12 Minggu', description:'Olahraga', kind:'goal', period:'weekly', category:'health', startDate:'2026-10-01', endDate:'2026-12-31'};
const plan = { ...baseInput, id:'new-1', status:'active', createdAt:'now', updatedAt:'now' };
const exampleTask = {id:'task-1', projectId:'new-1', title:'Beli sepatu', status:'todo', priority:'medium', dueDate:null, createdAt:'now'};

test('input plan valid dan periode semua diterima', () => {
  for (const period of ['daily','weekly','monthly','yearly']) assert.equal(validatePlanInput({...baseInput, period}),null);
  assert.equal(validatePlanInput({...baseInput,name:' '}),'Nama rencana harus 2–80 karakter.');
  assert.equal(validatePlanInput({...baseInput,endDate:'2026-09-30'}),'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
  assert.equal(isDateISO('2026-02-30'),false);
  assert.equal(isDateISO('2028-02-29'),true);
  assert.equal(validatePlanInput({...baseInput,category:'__proto__'}),'Jenis, periode, atau kategori tidak valid.');
});

test('CRUD plan baru, edit, dan archive tidak menghapus tugas', () => {
  const blank={plans:[],tasks:[]};
  const created=insertPlan(blank,plan);
  assert.equal(created.plans.length,1);
  assert.equal(blank.plans.length,0,'operasi tidak mutasi data lama');
  const withTask=insertTask(created,exampleTask);
  const edited=replacePlan(withTask,{...plan,name:'Fitness 12 Minggu'});
  assert.equal(edited.plans[0].name,'Fitness 12 Minggu');
  assert.equal(edited.tasks.length,1);
  const archived=replacePlan(edited,{...edited.plans[0],status:'archived'});
  assert.equal(archived.tasks.length,1,'archive mempertahankan tugas');
  assert.equal(insertTask(archived,{...exampleTask,id:'task-2'}),archived,'tugas baru tidak bisa masuk plan arsip');
});

test('hapus plan menghapus hanya tugas plan terkait', () => {
  const other={...plan,id:'other'};
  const initial={plans:[plan,other],tasks:[exampleTask,{...exampleTask,id:'task-other',projectId:'other'}]};
  const updated=removePlanAndTasks(initial,'new-1');
  assert.deepEqual(updated.plans.map(x=>x.id),['other']);
  assert.deepEqual(updated.tasks.map(x=>x.id),['task-other']);
});

test('ubah status dan hapus tugas tidak merusak plan', () => {
  const initial=insertTask({plans:[plan],tasks:[]},exampleTask);
  const changed=updateTaskInWorkspace(initial,'task-1','done');
  assert.equal(changed.tasks[0].status,'done');
  assert.equal(initial.tasks[0].status,'todo');
  const deleted=removeTaskFromWorkspace(changed,'task-1');
  assert.equal(deleted.tasks.length,0);
  assert.equal(deleted.plans.length,1);
});
