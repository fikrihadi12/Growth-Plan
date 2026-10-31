import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHabitInput, isHabit, canCheckIn, weekStartISO, addDaysISO, getWeeklyProgress, todayLocalISO } from '../src/features/habits/habitRules.ts';
import { insertHabit, replaceHabit, removeHabitAndLogs, toggleHabitLog } from '../src/features/habits/habitOperations.ts';
import { parseWorkspaceV4, upgradeWorkspaceV3, upgradeWorkspaceV2 } from '../src/features/plans/workspaceMigration.ts';
import { removePlanAndTasks } from '../src/features/plans/workspaceOperations.ts';

const timestamp = '2026-10-01T00:00:00.000Z';
const metric = {label:'Buku dibaca',unit:'buku',current:2,target:12};
const goal = {id:'g1',name:'Program Fitness',description:'Gym',kind:'goal',category:'health',period:'yearly',status:'active',startDate:'2026-10-01',endDate:'2026-12-31',createdAt:timestamp,updatedAt:timestamp,goal:{progressMode:'tasks',metric}};
const project = {...goal,id:'p1',kind:'project',name:'Website',goal:null};
const habit = {id:'h1',planId:goal.id,name:'Gym',weeklyTarget:3,scheduledDays:[0,2,4],startDate:'2026-10-01',endDate:null,createdAt:timestamp,updatedAt:timestamp};
const log = (date,id=`log-${date}`)=>({id,habitId:habit.id,date,createdAt:timestamp});
const workspace = () => ({plans:[goal,project],tasks:[],milestones:[],habits:[],habitLogs:[]});
const withHabit = () => insertHabit(workspace(),habit);

// Business rules & calendar math

test('target 1–7 per minggu valid, 0/8/pecahan ditolak', () => {
  for (let weeklyTarget = 1; weeklyTarget <= 7; weeklyTarget++) assert.equal(validateHabitInput({...habit,weeklyTarget}),null);
  for (const weeklyTarget of [0,8,2.5,NaN]) assert.match(validateHabitInput({...habit,weeklyTarget}),/1–7/);
});
test('jadwal Senin–Minggu fleksibel, duplikat/hari invalid ditolak', () => {
  assert.equal(validateHabitInput({...habit,scheduledDays:[]}),null);
  assert.equal(validateHabitInput({...habit,scheduledDays:[6,0,3]}),null);
  assert.match(validateHabitInput({...habit,scheduledDays:[0,0]}),/Jadwal/);
  assert.match(validateHabitInput({...habit,scheduledDays:[7]}),/Jadwal/);
  assert.match(validateHabitInput({...habit,startDate:'2026-02-30'}),/Tanggal/);
  assert.match(validateHabitInput({...habit,endDate:'2026-09-30'}),/Tanggal/);
  assert.ok(isHabit(habit));
});
test('kalender dimulai Senin termasuk pergantian tahun', () => {
  assert.equal(weekStartISO('2026-10-31'),'2026-10-26');
  assert.equal(weekStartISO('2026-11-01'),'2026-10-26');
  assert.equal(weekStartISO('2026-11-02'),'2026-11-02');
  assert.equal(weekStartISO('2027-01-01'),'2026-12-28');
  assert.equal(addDaysISO('2026-12-28',6),'2027-01-03');
  assert.equal(todayLocalISO(new Date(2026, 9, 31, 23, 59)), '2026-10-31');
});
test('tidak boleh check-in di masa depan, sebelum mulai, atau sesudah selesai', () => {
  const bounded={...habit,startDate:'2026-10-05',endDate:'2026-10-31'};
  assert.equal(canCheckIn(bounded,'2026-10-04','2026-10-31'),false);
  assert.equal(canCheckIn(bounded,'2026-10-31','2026-10-31'),true);
  assert.equal(canCheckIn(bounded,'2026-11-01','2026-11-02'),false);
  assert.equal(canCheckIn(bounded,'2026-11-01','2026-10-31'),false);
  assert.equal(canCheckIn(bounded,'2026-02-30','2026-10-31'),false);
});

test('buat habit hanya di Goal aktif; ID tidak boleh duplikat', () => {
  const created=withHabit();
  assert.equal(created.habits.length,1);
  assert.notEqual(created,workspace());
  assert.equal(insertHabit(created,habit),created);
  const other = workspace();
  assert.equal(insertHabit(other,{...habit,planId:project.id}),other);
  const archived={...workspace(),plans:[{...goal,status:'archived'},project]};
  assert.equal(insertHabit(archived,habit),archived);
});
test('check-in hanya satu per hari, klik ulang menghapusnya dan tidak merusak task', () => {
  const initial=withHabit();
  let seq=0;
  const factory=()=>log('2026-10-26',`new-${++seq}`);
  const a=toggleHabitLog(initial,habit.id,'2026-10-26','2026-10-31',factory);
  assert.equal(a.habitLogs.length,1);
  const b=toggleHabitLog(a,habit.id,'2026-10-26','2026-10-31',factory);
  assert.equal(b.habitLogs.length,0);
  const c=toggleHabitLog(b,habit.id,'2026-10-26','2026-10-31',factory);
  assert.equal(c.habitLogs.length,1);
  assert.equal(seq,2);
  assert.equal(initial.habitLogs.length,0);
});
test('check-in masa depan tidak mengubah data maupun memanggil factory', () => {
  const initial=withHabit();
  let called=false;
  const invalid=toggleHabitLog(initial,habit.id,'2026-11-01','2026-10-31',()=>{called=true;return log('2026-11-01');});
  assert.equal(invalid,initial);
  assert.equal(called,false);
});
test('Goal arsip tidak bisa check-in, edit atau hapus habit', () => {
  const active=withHabit();
  const archived={...active,plans:[{...goal,status:'archived'},project]};
  assert.equal(toggleHabitLog(archived,habit.id,'2026-10-26','2026-10-31',()=>log('2026-10-26')),archived);
  assert.equal(replaceHabit(archived,habit.id,{...habit,name:'New'},timestamp),archived);
  assert.equal(removeHabitAndLogs(archived,habit.id),archived);
});
test('edit tanggal tidak bisa mengecualikan log historis; edit target tidak menghapus log', () => {
  const existing={...withHabit(),habitLogs:[log('2026-10-26')]};
  assert.equal(replaceHabit(existing,habit.id,{...habit,startDate:'2026-10-27'},timestamp),existing);
  const updated=replaceHabit(existing,habit.id,{...habit,weeklyTarget:4},timestamp);
  assert.equal(updated.habits[0].weeklyTarget,4);
  assert.equal(updated.habitLogs[0].date,'2026-10-26');
  assert.equal(existing.habits[0].weeklyTarget,3);
});
test('progres mingguan 2/3 = 67%, minggu baru 0/3 dan riwayat tetap', () => {
  const logs=[log('2026-10-26'),log('2026-10-28')];
  const previous=getWeeklyProgress(habit,logs,'2026-10-31');
  const next=getWeeklyProgress(habit,logs,'2026-11-02');
  assert.deepEqual([previous.start,previous.end,previous.completed,previous.percent],['2026-10-26','2026-11-01',2,67]);
  assert.deepEqual([next.start,next.completed,next.percent],['2026-11-02',0,0]);
  assert.equal(logs.length,2);
});
test('pencapaian berlebih dibatasi 100%, ekstra tetap tercatat', () => {
  const logs=['2026-10-26','2026-10-27','2026-10-28','2026-10-29'].map((date)=>log(date));
  const progress=getWeeklyProgress(habit,logs,'2026-10-31');
  assert.equal(progress.percent,100);
  assert.equal(progress.completed,4);
  assert.equal(progress.extra,1);
});
test('hapus habit ikut menghapus log tetapi tidak menghapus Goal', () => {
  const a={...withHabit(),habitLogs:[log('2026-10-26')]};
  const b=removeHabitAndLogs(a,habit.id);
  assert.equal(b.habits.length,0);
  assert.equal(b.habitLogs.length,0);
  assert.equal(b.plans.length,2);
});
test('hapus Goal membersihkan tasks, milestones, habits dan logs terkait', () => {
  const initial={...withHabit(),habitLogs:[log('2026-10-26')],tasks:[{id:'t1',projectId:goal.id,title:'Daftar gym',status:'todo',priority:'medium',dueDate:null,createdAt:timestamp}],milestones:[{id:'m1',planId:goal.id,title:'Daftar gym',dueDate:null,createdAt:timestamp,completedAt:null}]};
  const removed=removePlanAndTasks(initial,goal.id);
  assert.equal(removed.habits.length,0);
  assert.equal(removed.habitLogs.length,0);
  assert.equal(removed.tasks.length,0);
  assert.equal(removed.milestones.length,0);
  assert.equal(removed.plans.length,1);
  assert.equal(removed.plans[0].id,project.id);
});

test('migrasi V3 -> V4 mempertahankan ID dan Goal settings serta riwayat lama', () => {
  const v3={plans:[goal,project],tasks:[],milestones:[]};
  const updated=upgradeWorkspaceV3(v3);
  assert.ok(updated);
  assert.equal(updated.plans[0].id,goal.id);
  assert.equal(updated.plans[0].goal.metric.current,2);
  assert.deepEqual(updated.habits,[]);
  assert.deepEqual(updated.habitLogs,[]);
  assert.ok(parseWorkspaceV4(updated));
});
test('migrasi V2 langsung V4 tetap berfungsi',()=>{
  const v2={plans:[{...goal,goal:undefined}],tasks:[]};
  const data=upgradeWorkspaceV2(v2);
  assert.ok(data);
  assert.equal(data.plans[0].id,goal.id);
  assert.deepEqual(data.habits,[]);
  assert.ok(parseWorkspaceV4(data));
});
test('V4 menolak log duplikat, log tanpa habit, habit pada Project, log di luar rentang',()=>{
  const valid={...withHabit(),habitLogs:[log('2026-10-26')]};
  assert.ok(parseWorkspaceV4(valid));
  assert.equal(parseWorkspaceV4({...valid,habitLogs:[...valid.habitLogs,log('2026-10-26','another')]}),null);
  assert.equal(parseWorkspaceV4({...valid,habitLogs:[{...log('2026-10-27'),habitId:'missing'}]}),null);
  assert.equal(parseWorkspaceV4({...valid,habits:[{...habit,planId:project.id}]}),null);
  assert.equal(parseWorkspaceV4({...valid,habitLogs:[log('2026-09-30')]}),null);
  assert.equal(parseWorkspaceV4({...valid,habits:[habit,habit]}),null);
});

test('data demo Tahap 3B kompatibel dengan penyimpanan V4', async () => {
  const { createDemoPlans } = await import('../src/features/plans/demoPlans.ts');
  const { createDemoTasks } = await import('../src/features/tasks/demoData.ts');
  const initial={plans:createDemoPlans(),tasks:createDemoTasks(),milestones:[],habits:[],habitLogs:[]};
  assert.ok(parseWorkspaceV4(initial));
});

test('data lain tetap utuh ketika check-in habit ditambahkan', () => {
  const base={...withHabit(),tasks:[{id:'t1',projectId:goal.id,title:'Lari',status:'todo',priority:'medium',dueDate:null,createdAt:timestamp}],milestones:[{id:'m1',planId:goal.id,title:'Ikut lomba',dueDate:null,createdAt:timestamp,completedAt:null}]};
  const next=toggleHabitLog(base,habit.id,'2026-10-26','2026-10-31',()=>log('2026-10-26'));
  assert.deepEqual(next.tasks,base.tasks);
  assert.deepEqual(next.milestones,base.milestones);
  assert.equal(next.habitLogs.length,1);
});
