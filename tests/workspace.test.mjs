import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlanInput, isDateISO } from '../src/features/plans/planRules.ts';
import { validateGoalMetric, validateMilestoneInput, defaultGoalSettings } from '../src/features/plans/goalRules.ts';
import { getPlanProgress } from '../src/features/plans/goalProgress.ts';
import { parseWorkspaceV3, upgradeWorkspaceV2 } from '../src/features/plans/workspaceMigration.ts';
import {
  replacePlan, removePlanAndTasks, insertTask, replaceTaskInWorkspace,
  updateTaskInWorkspace, removeTaskFromWorkspace, changeGoalMode, setGoalMetric,
  insertMilestone, replaceMilestone, setMilestoneComplete, removeMilestone,
} from '../src/features/plans/workspaceOperations.ts';

const basic = {name:'Gym 12 Minggu',description:'Olahraga',kind:'goal',period:'weekly',category:'health',startDate:'2026-10-01',endDate:'2026-12-31'};
const goal = {...basic,id:'goal-1',status:'active',createdAt:'2026-10-01T00:00:00Z',updatedAt:'2026-10-01T00:00:00Z',goal:defaultGoalSettings()};
const project = {...goal,id:'project-1',name:'Aplikasi React',kind:'project',goal:null};
const task = {id:'task-1',projectId:goal.id,title:'Daftar gym',status:'todo',priority:'medium',dueDate:null,createdAt:'2026-10-01T00:00:00Z'};
const milestone = {id:'milestone-1',planId:goal.id,title:'Menyelesaikan tahap 1',dueDate:null,createdAt:'2026-10-01T00:00:00Z',completedAt:null};
const workspace=()=>({plans:[goal,project],tasks:[],milestones:[],habits:[],habitLogs:[]});

// 1. Business rules

test('periode rencana, tanggal, input angka dan milestone tervalidasi',()=>{
 for(const period of ['daily','weekly','monthly','yearly']) assert.equal(validatePlanInput({...basic,period}),null);
 assert.equal(isDateISO('2026-02-30'),false);
 assert.equal(validateGoalMetric({label:'Jumlah buku',unit:'buku',current:0,target:12}),null);
 assert.match(validateGoalMetric({label:'Buku',unit:'buku',current:0,target:0}),/Target/);
 assert.match(validateGoalMetric({label:'Buku',unit:'buku',current:-1,target:12}),/Realisasi/);
 assert.match(validateGoalMetric({label:'Buku',unit:'buku',current:NaN,target:12}),/Realisasi/);
 assert.equal(validateMilestoneInput({title:'Ujian tahap 1',dueDate:'2026-12-01'}),null);
 assert.match(validateMilestoneInput({title:'x',dueDate:null}),/milestone/);
 assert.match(validateMilestoneInput({title:'Valid',dueDate:'2026-02-30'}),/Tanggal/);
});

// 2. Tasks vs goal progress

test('Progress tugas tetap 0 saat kosong; tugas 1/2 menjadi 50%',()=>{
 const empty=workspace();
 assert.equal(getPlanProgress(goal,empty.tasks,empty.milestones).percent,0);
 const twoTasks=[task,{...task,id:'task-2',status:'done'}];
 assert.equal(getPlanProgress(goal,twoTasks,[]).percent,50);
 assert.equal(getPlanProgress(project,twoTasks,[]).percent,0);
});

test('mode milestone tidak menghitung tugas; 1/2 milestone menjadi 50%',()=>{
 const modeGoal={...goal,goal:{...goal.goal,progressMode:'milestones'}};
 const milestones=[{...milestone,completedAt:'2026-10-03T00:00:00Z'},{...milestone,id:'milestone-2'}];
 const summary=getPlanProgress(modeGoal,[{...task,status:'done'}],milestones);
 assert.equal(summary.percent,50);
 assert.equal(summary.completed,1);
 assert.equal(summary.total,2);
});

test('mode angka membatasi progress 100%, tetapi angka realisasi asli dipertahankan',()=>{
 const numberGoal={...goal,goal:{progressMode:'numeric',metric:{label:'Buku',unit:'buku',current:15,target:12}}};
 const summary=getPlanProgress(numberGoal,[task],[milestone]);
 assert.equal(summary.percent,100);
 assert.equal(summary.completed,15);
 assert.equal(summary.total,12);
 assert.equal(summary.caption,'15 / 12 buku');
});

// 3. Atomic workspace mutations

test('buat, edit, dan pindah tugas antar rencana aktif tanpa kehilangan ID',()=>{
 const initial=insertTask(workspace(),task);
 assert.equal(initial.tasks.length,1);
 const changed=replaceTaskInWorkspace(initial,task.id,{title:'Daftar gym dan pelatih',projectId:project.id,priority:'high',dueDate:'2026-10-05'});
 assert.equal(changed.tasks[0].projectId,project.id);
 assert.equal(changed.tasks[0].id,task.id);
 assert.equal(initial.tasks[0].title,'Daftar gym');
 const invalid=replaceTaskInWorkspace(changed,task.id,{title:' ',projectId:project.id,priority:'high',dueDate:null});
 assert.equal(invalid,changed);
});

test('rencana arsip tidak bisa menambah/mengubah/menghapus tugas',()=>{
 const current=insertTask(workspace(),task);
 const archived=replacePlan(current,{...goal,status:'archived'});
 assert.equal(insertTask(archived,{...task,id:'task-2'}),archived);
 assert.equal(updateTaskInWorkspace(archived,task.id,'done'),archived);
 assert.equal(removeTaskFromWorkspace(archived,task.id),archived);
 assert.equal(replaceTaskInWorkspace(archived,task.id,{title:'Edit',projectId:project.id,priority:'low',dueDate:null}),archived);
});

test('milestone CRUD + toggle tidak mengubah status tugas dan tidak mutasi data sebelumnya',()=>{
 const initial=insertTask(workspace(),task);
 const a=insertMilestone(initial,milestone);
 const b=replaceMilestone(a,milestone.id,{title:'Menyelesaikan tahap 1 revisi',dueDate:'2026-10-15'});
 assert.equal(b.milestones[0].title,'Menyelesaikan tahap 1 revisi');
 const c=setMilestoneComplete(b,milestone.id,true,'2026-10-20T10:00:00Z');
 assert.equal(c.milestones[0].completedAt,'2026-10-20T10:00:00Z');
 assert.equal(c.tasks[0].status,'todo');
 assert.equal(a.milestones[0].completedAt,null);
 const d=setMilestoneComplete(c,milestone.id,false,'2026-10-20T11:00:00Z');
 assert.equal(d.milestones[0].completedAt,null);
 assert.equal(removeMilestone(d,milestone.id).milestones.length,0);
});

test('mode goal dapat diganti, metric tidak hilang saat pindah mode',()=>{
 const a=changeGoalMode(workspace(),goal.id,'numeric');
 const b=setGoalMetric(a,goal.id,{label:'Buku dibaca',unit:'buku',current:2,target:12});
 const c=changeGoalMode(b,goal.id,'milestones');
 assert.equal(c.plans[0].goal.metric.current,2);
 assert.equal(c.plans[0].goal.progressMode,'milestones');
 assert.equal(changeGoalMode(c,project.id,'numeric'),c,'project tidak punya progress mode goal');
});

test('hapus plan menghapus tugas dan milestone terkait, tidak menghapus data plan lain',()=>{
 const initial={plans:[goal,project],tasks:[task,{...task,id:'task-p',projectId:project.id}],milestones:[milestone],habits:[],habitLogs:[]};
 const updated=removePlanAndTasks(initial,goal.id);
 assert.deepEqual(updated.plans.map(p=>p.id),[project.id]);
 assert.deepEqual(updated.tasks.map(t=>t.id),['task-p']);
 assert.equal(updated.milestones.length,0);
});

// 4. Migrations and validation

test('data pengguna Tahap 3A termigrasi V2->V3 tanpa mengubah ID atau tugas',()=>{
 const v2={plans:[({...goal,goal:undefined})],tasks:[task]};
 const converted=upgradeWorkspaceV2(v2);
 assert.ok(converted);
 assert.equal(converted.plans[0].id,goal.id);
 assert.equal(converted.tasks[0].id,task.id);
 assert.equal(converted.plans[0].goal.progressMode,'tasks');
 assert.deepEqual(converted.milestones,[]);
 assert.ok(parseWorkspaceV3(converted));
});

test('validasi storage V3 menolak foreign key tidak valid dan duplikat ID',()=>{
 const valid={plans:[goal],tasks:[task],milestones:[milestone]};
 assert.ok(parseWorkspaceV3(valid));
 assert.equal(parseWorkspaceV3({...valid,milestones:[{...milestone,planId:'missing'}]}),null);
 assert.equal(parseWorkspaceV3({...valid,tasks:[task,{...task}]}),null);
 assert.equal(parseWorkspaceV3({...valid,plans:[project],milestones:[milestone],tasks:[]}),null);
});
