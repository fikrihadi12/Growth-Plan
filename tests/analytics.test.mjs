import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeeklyProgress } from '../src/features/habits/habitRules.ts';
import { baselineTarget, targetForWeek } from '../src/features/habits/targetHistory.ts';
import { validateReflection } from '../src/features/habits/reflectionRules.ts';
import { getWeeklySeries, getConsistency, getMonthlySeries, getYearConsistency, getCompletedWeekStreak } from '../src/features/analytics/analyticsRules.ts';
import { insertHabit, replaceHabit, removeHabitAndLogs, saveReflection, removeReflection } from '../src/features/habits/habitOperations.ts';
import { parseWorkspaceV5, upgradeWorkspaceV4 } from '../src/features/plans/workspaceMigration.ts';
import { removePlanAndTasks } from '../src/features/plans/workspaceOperations.ts';

const now='2026-10-31T10:00:00.000Z';
const goal={id:'g1',name:'Fitness',description:'Gym',kind:'goal',category:'health',period:'yearly',status:'active',startDate:'2026-09-01',endDate:null,createdAt:now,updatedAt:now,goal:{progressMode:'tasks',metric:{label:'Sesi',unit:'kali',current:0,target:12}}};
const habit={id:'h1',planId:'g1',name:'Gym',weeklyTarget:3,scheduledDays:[0,2,4],startDate:'2026-09-07',endDate:null,createdAt:now,updatedAt:now};
const log=(date,id=`l-${date}`)=>({id,habitId:'h1',date,createdAt:now});
const v4=(logs=[])=>({plans:[goal],tasks:[],milestones:[],habits:[habit],habitLogs:logs});
const workspace=()=>upgradeWorkspaceV4(v4());

// Snapshot / target history

test('V4 ke V5 mempertahankan seluruh log, ID, dan membuat snapshot baseline',()=>{
 const old=v4([log('2026-10-26')]); const updated=upgradeWorkspaceV4(old);
 assert.ok(updated); assert.ok(parseWorkspaceV5(updated));
 assert.equal(updated.plans[0].id,'g1'); assert.deepEqual(updated.habitLogs,old.habitLogs);
 assert.deepEqual(updated.habitTargets,[baselineTarget(habit,'2026-09-07')]);
 assert.deepEqual(updated.reflections,[]);
});
test('target baru minggu ini tidak mengubah target minggu sebelumnya',()=>{
 const initial=workspace();
 const changed=replaceHabit(initial,'h1',{name:'Gym',weeklyTarget:5,scheduledDays:[0,2,4],startDate:habit.startDate,endDate:null},now,'2026-10-28');
 assert.equal(targetForWeek(changed.habits[0],changed.habitTargets,'2026-10-19'),3);
 assert.equal(targetForWeek(changed.habits[0],changed.habitTargets,'2026-10-26'),5);
 assert.equal(getWeeklyProgress(changed.habits[0],[], '2026-10-19', changed.habitTargets).target,3);
 assert.equal(getWeeklyProgress(changed.habits[0],[], '2026-11-02', changed.habitTargets).target,5);
 assert.equal(initial.habits[0].weeklyTarget,3);
});
test('edit target berulang dalam minggu sama menimpa snapshot minggu itu saja',()=>{
 const a=replaceHabit(workspace(),'h1',{...habit,weeklyTarget:4},now,'2026-10-27');
 const b=replaceHabit(a,'h1',{...habit,weeklyTarget:6},now,'2026-10-29');
 assert.equal(b.habitTargets.length,2);
 assert.equal(targetForWeek(b.habits[0],b.habitTargets,'2026-10-26'),6);
 assert.equal(targetForWeek(b.habits[0],b.habitTargets,'2026-10-19'),3);
});
test('validasi V5 menolak target snapshot duplikat, FK yatim dan target invalid',()=>{
 const base=workspace(); assert.ok(parseWorkspaceV5(base));
 assert.equal(parseWorkspaceV5({...base,habitTargets:[...base.habitTargets,...base.habitTargets]}),null);
 assert.equal(parseWorkspaceV5({...base,habitTargets:[{...base.habitTargets[0],habitId:'missing'}]}),null);
 assert.equal(parseWorkspaceV5({...base,habitTargets:[{...base.habitTargets[0],target:8}]}),null);
 assert.equal(parseWorkspaceV5({...base,habitTargets:[]}),null);
});

test('pembuatan habit baru langsung menghasilkan snapshot valid',()=>{
 const blank={...workspace(),habits:[],habitTargets:[]};
 const created=insertHabit(blank,habit);
 assert.equal(created.habitTargets.length,1);
 assert.ok(parseWorkspaceV5(created));
});

test('ubah tanggal mulai tanpa log mereset baseline; dengan log akan ditolak',()=>{
 const initial=workspace();
 const changed=replaceHabit(initial,'h1',{...habit,startDate:'2026-09-14'},now,'2026-10-31');
 assert.equal(changed.habitTargets[0].effectiveWeek,'2026-09-14');
 assert.ok(parseWorkspaceV5(changed));
 const logged={...initial,habitLogs:[log('2026-10-26')]};
 assert.equal(replaceHabit(logged,'h1',{...habit,startDate:'2026-09-14'},now,'2026-10-31'),logged);
});

// Analytics

test('12 minggu tidak menilai minggu sekarang sebagai gagal',()=>{
 const stats=getWeeklySeries([habit],[],workspace().habitTargets,'2026-10-31',12);
 assert.equal(stats.length,12); assert.equal(stats.at(-1).start,'2026-10-26');
 assert.equal(stats.at(-1).eligible,0);
 assert.equal(stats.at(-2).eligible,1);
});
test('minggu parsial saat habit dimulai tidak masuk denominator konsistensi',()=>{
 const newHabit={...habit,startDate:'2026-10-28'};
 const snapshots=[baselineTarget(newHabit,'2026-10-26')];
 const data=getWeeklySeries([newHabit],[],snapshots,'2026-11-02',2);
 assert.equal(data[0].eligible,0); assert.equal(data[1].eligible,0);
 assert.equal(getConsistency(data).percent,null);
});
test('minggu penuh tercapai dihitung, target histori dipakai bukan target terbaru',()=>{
 let w=workspace();
 w={...w,habitLogs:[log('2026-10-19'),log('2026-10-20'),log('2026-10-21')]};
 w=replaceHabit(w,'h1',{...habit,weeklyTarget:5},now,'2026-10-26');
 const data=getWeeklySeries(w.habits,w.habitLogs,w.habitTargets,'2026-10-31',2);
 assert.deepEqual([data[0].target,data[0].met,data[0].eligible],[3,1,1]);
 assert.equal(data[1].target,5);
 assert.equal(getConsistency(data).percent,100);
});
test('jumlah sesi bulanan mencakup bulan tahun berbeda dan tidak menyamakan bulan dengan 4 minggu',()=>{
 const logs=[log('2026-09-30'),log('2026-10-01'),log('2026-10-31'),log('2026-11-01')];
 const months=getMonthlySeries([habit],logs,'2026-10-31',3);
 assert.deepEqual(months.map(x=>[x.month,x.completed]),[['2026-08',0],['2026-09',1],['2026-10',2]]);
});
test('tahun historis hanya menilai minggu penuh di dalam tahun',()=>{
 const x={...habit,startDate:'2026-01-05',weeklyTarget:1};
 const t=[baselineTarget(x,'2026-01-05')];
 const logs=[log('2026-01-05')];
 const year=getYearConsistency([x],logs,t,'2026-01-19',2026);
 assert.equal(year.eligible,2); assert.equal(year.met,1); assert.equal(year.percent,50);
});
test('streak tidak menghitung minggu berjalan dan berhenti pada minggu gagal',()=>{
 const logs=['2026-10-12','2026-10-13','2026-10-14','2026-10-19','2026-10-20','2026-10-21'].map(log);
 assert.equal(getCompletedWeekStreak(habit,logs,workspace().habitTargets,'2026-10-31'),2);
 assert.equal(getCompletedWeekStreak(habit,logs,workspace().habitTargets,'2026-10-22'),1);
});

// Reflections

test('validasi refleksi membatasi panjang dan rating',()=>{
 assert.equal(validateReflection('Minggu cukup baik',5),null);
 assert.match(validateReflection(' ',null),/2–1000/);
 assert.match(validateReflection('bagus',8),/1–5/);
});
test('simpan/edit refleksi satu habit/minggu mempertahankan ID dan log',()=>{
 const initial={...workspace(),habitLogs:[log('2026-10-26')]};
 const entry={id:'r1',habitId:'h1',weekStart:'2026-10-26',note:'Minggu ini stabil',rating:4,updatedAt:now};
 const a=saveReflection(initial,entry,'2026-10-31');
 const b=saveReflection(a,{...entry,id:'r2',note:'Minggu makin bagus'},'2026-10-31');
 assert.equal(b.reflections.length,1); assert.equal(b.reflections[0].id,'r1');
 assert.deepEqual(b.habitLogs,initial.habitLogs);
 assert.ok(parseWorkspaceV5(b));
});
test('arsip Goal tidak boleh menulis atau menghapus refleksi',()=>{
 const archived={...workspace(),plans:[{...goal,status:'archived'}]};
 const entry={id:'r1',habitId:'h1',weekStart:'2026-10-26',note:'Dua sesi',rating:null,updatedAt:now};
 assert.equal(saveReflection(archived,entry,'2026-10-31'),archived);
 assert.equal(removeReflection(archived,'h1','2026-10-26'),archived);
});
test('refleksi masa depan dan minggu sebelum mulai ditolak',()=>{
 const entry={id:'r1',habitId:'h1',weekStart:'2026-11-02',note:'Bisa lanjut',rating:null,updatedAt:now};
 assert.equal(saveReflection(workspace(),entry,'2026-10-31').reflections.length,0);
 assert.equal(saveReflection(workspace(),{...entry,weekStart:'2026-08-31'},'2026-10-31').reflections.length,0);
});
test('hapus refleksi tidak menghapus habit maupun check-in',()=>{
 const entry={id:'r1',habitId:'h1',weekStart:'2026-10-26',note:'Lumayan baik',rating:4,updatedAt:now};
 const a=saveReflection({...workspace(),habitLogs:[log('2026-10-26')]},entry,'2026-10-31');
 const b=removeReflection(a,'h1','2026-10-26');
 assert.equal(b.reflections.length,0); assert.equal(b.habitLogs.length,1); assert.equal(b.habits.length,1);
});
test('hapus habit membersihkan check-in, target history dan refleksi terkait',()=>{
 const entry={id:'r1',habitId:'h1',weekStart:'2026-10-26',note:'Bagus minggu ini',rating:4,updatedAt:now};
 const a=saveReflection(workspace(),entry,'2026-10-31');
 const b=removeHabitAndLogs(a,'h1');
 assert.deepEqual([b.habits.length,b.habitTargets.length,b.reflections.length,b.habitLogs.length],[0,0,0,0]);
});
test('hapus Goal cascade sampai refleksi dan target tanpa merusak project lain',()=>{
 const other={...habit,id:'h2',planId:'g2'};
 const g2={...goal,id:'g2'};
 const second=insertHabit({...workspace(),plans:[goal,g2]},other);
 const removed=removePlanAndTasks(second,'g1');
 assert.equal(removed.habits.length,1); assert.equal(removed.habits[0].id,'h2');
 assert.equal(removed.habitTargets.length,1); assert.equal(removed.habitTargets[0].habitId,'h2');
 assert.ok(parseWorkspaceV5(removed));
});

test('validator V5 menolak refleksi duplikat dan referensi habit yang hilang',()=>{
 const entry={id:'r1',habitId:'h1',weekStart:'2026-10-26',note:'Lumayan baik',rating:4,updatedAt:now};
 const data=saveReflection(workspace(),entry,'2026-10-31');
 assert.equal(parseWorkspaceV5({...data,reflections:[...data.reflections,entry]}),null);
 assert.equal(parseWorkspaceV5({...data,reflections:[{...entry,habitId:'missing'}]}),null);
});
test('input tanggal refleksi rusak tidak menyebabkan exception dan tidak mengubah data',()=>{
 const entry={id:'r1',habitId:'h1',weekStart:'nonsense',note:'Catatan valid',rating:4,updatedAt:now};
 const initial=workspace();
 assert.equal(saveReflection(initial,entry,'2026-10-31'),initial);
});

test('edit tanggal akhir tidak boleh membuat jurnal di luar rentang (storage V5 tetap valid)',()=>{
 const entry={id:'r1',habitId:'h1',weekStart:'2026-10-26',note:'Minggu cukup bagus',rating:4,updatedAt:now};
 const base=saveReflection(workspace(),entry,'2026-10-31');
 const invalid=replaceHabit(base,'h1',{...habit,endDate:'2026-10-20'},now,'2026-10-31');
 assert.equal(invalid,base);
 assert.ok(parseWorkspaceV5(base));
});
