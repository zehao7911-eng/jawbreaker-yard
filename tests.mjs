import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JOBS,makeRun,liveCells,blueprint,bite,progress,defaultProfile,cleanProfile,mergeProfile,armJoint} from './core.mjs';
import {bridge} from './sdk.mjs';
let checks=0;const ok=(condition,message)=>{assert(condition,message);checks++;};
for(let job=0;job<6;job++)for(const style of ['supports','roof']){
  let run=makeRun(job),finishes=0,prior=0;
  for(let n=0;n<450&&!run.finished;n++){
    const cells=liveCells(run),c=[...cells].sort((a,b)=>style==='supports'?a.y-b.y||a.x-b.x:b.y-a.y||a.x-b.x)[0];
    const events=bite(run,c.x,c.y);finishes+=events.filter(e=>e.type==='finish').length;
    ok(run.removed.length>=prior,'Demolition never resurrects blocks');prior=run.removed.length;
    const restored=cleanProfile({...defaultProfile(),run}).run;
    assert.deepEqual(restored,run);checks++;
    if(n%2===0)run=restored;
  }
  ok(run.finished,`Job ${job} / ${style} clears`);ok(finishes===1,'One real finish');
  ok(progress(run)===1&&run.bolts===3,'Completion salvages all');ok(style!=='supports'||run.stars===3,'Support route earns gold');
  const receipt=JSON.stringify(run);ok(!bite(run,0,0).length,'No post-result bite');ok(JSON.stringify(run)===receipt,'Result immutable');
}
const r=makeRun(0);ok(!bite(r,100,100).length&&!r.started,'Empty space is not a real action');
const first=bite(r,0,0);ok(first[0].blocks.length>2,'Column collapses after removing its load path');
assert.deepEqual(cleanProfile({...defaultProfile(),run:r}).run,r);checks++;
ok(cleanProfile({run:{...r,removed:['foreign']}}).run===null,'Reject foreign cell ids');
ok(cleanProfile({run:{...r,removed:[...r.removed,r.removed[0]]}}).run===null,'Reject duplicate cells');
ok(cleanProfile({paint:2}).paint===0,'Unearned paint not selected');
const saved=cleanProfile({...defaultProfile(),run:r}),merged=mergeProfile(saved,{best:[3,2],run:makeRun(2),rewards:{comment:true}});
ok(merged.run.job===0&&merged.run.removed.length===r.removed.length,'Cloud merge keeps live checkpoint');ok(merged.best[0]===3&&merged.rewards.comment,'Cloud merge retains earned results');
const steel=makeRun(3),cell=blueprint(3).find(c=>c.kind==='steel');bite(steel,cell.x,cell.y);ok(steel.damaged.length===2,'Steel takes two bites');assert.deepEqual(cleanProfile({run:steel}).run,steel);checks++;
for(let x=-3;x<=3;x+=.3)for(let y=.3;y<=6.15;y+=.3){const base=[-2.7,1.48,3.9],target=[x,y+.45,.9],s=armJoint(base,target),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));ok(Math.abs(distance(base,s.elbow)-4.3)<1e-8,'Upper arm rigid');ok(Math.abs(distance(s.elbow,s.end)-4.0)<1e-8,'Forearm rigid');ok(distance(target,s.end)<1e-8,'Jaw reaches whole interaction plane');}

let host,starts=0,ends=0,off=0,like,comment,profile=saved,writes=[];
let serial=0;const timers=new Map(),schedule=(fn,ms)=>{timers.set(++serial,{fn,ms});return serial;},flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
const adapter=()=>bridge({host:()=>host,read:()=>profile,write:(raw,remote)=>{profile=remote?mergeProfile(profile,raw):cleanProfile(raw);},schedule,cancel:id=>timers.delete(id),timeout:80});
let sdk=adapter();sdk.start();sdk.save();host={gameStart:()=>starts++};sdk.connect();sdk.connect();ok(starts===1,'Late partial SDK starts actual session once');
Object.assign(host,{gameOver:()=>ends++,loadUserGameState:async()=>({}),saveUserGameState:async data=>{writes.push(data);return{code:0};},onLike:async cb=>{like=cb;return{code:0,data:{unsubscribe:()=>off++}};},onComment:async cb=>{comment=cb;return{code:0,data:{unsubscribe:()=>off++}};},getGameViewport:()=>({width:390,height:844,density:3})});
sdk.connect();await flush();ok(writes[0].game==='jawbreaker-yard'&&writes[0].v===1,'Own cloud envelope');assert.deepEqual(writes[0].profile.run,r);checks++;
ok(sdk.viewport().width===390&&sdk.viewport().density===3,'Density does not multiply CSS pixels');
like({project_id:'101',status:false});like({project_id:101,status:true});comment({project_id:'101'});ok(!profile.rewards.like&&!profile.rewards.comment,'Ignore unlike and malformed events');
like({project_id:'1000000000000000001',status:true,count:0});comment({project_id:'1000000000000000001',content:'',count:0});await flush();ok(profile.rewards.like&&profile.rewards.comment,'Confirmed positive and image-only direct callbacks');
const count=writes.length;like({project_id:'101',status:true,count:2});comment({project_id:'101',content:'again'});await flush();ok(writes.length===count,'Durable duplicate guards');
sdk.stop();ok(off===2,'Unsubscribe actual functions');
sdk=adapter();await flush();ok(starts===1,'Ready checkpoint is not automatic gameplay');
// Real controller action on a partially completed, restored job.
const loaded=cleanProfile(profile);profile=loaded;const live=liveCells(profile.run)[0];
sdk.start();const resumed=bite(profile.run,live.x,live.y);ok(resumed.length&&starts===2,'Next real restored bite starts resumed session once');sdk.start();ok(starts===2,'Repeated held input does not double-start');sdk.end();sdk.end();ok(ends===1,'End exactly once');sdk.stop();ok(off===4,'Reload listeners cleaned');
let resolveLate,lateOff=0;host={onLike:()=>new Promise(resolve=>{resolveLate=resolve;}),onComment:()=>Promise.reject(Error('offline'))};sdk=adapter();for(const [id,task]of [...timers])if(task.ms===80&&timers.delete(id))task.fn();await flush();ok(!sdk.support().like&&!sdk.support().comment,'Timeout/async errors leave gameplay independent');sdk.stop();resolveLate({code:0,data:{unsubscribe:()=>lateOff++}});await flush();ok(lateOff===1,'Late async listener cleaned');
let invalidWrites=0;host={loadUserGameState:()=>Promise.reject(Error('offline')),saveUserGameState:()=>invalidWrites++};sdk=adapter();sdk.save();await flush();ok(invalidWrites===0,'Rejected load never overwrites unknown cloud');sdk.stop();
host={loadUserGameState:async()=>({game:'another-game',v:1,profile:{}}),saveUserGameState:()=>invalidWrites++};sdk=adapter();sdk.save();await flush();ok(invalidWrites===0,'Foreign cloud envelope is read-only');sdk.stop();
host={gameStart:()=>Promise.reject(Error('no host')),gameOver:()=>{throw Error('no host');}};sdk=adapter();sdk.start();sdk.end();await flush();sdk.stop();ok(true,'Lifecycle failures contained');
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');ok(html===readFileSync(new URL('./standalone.html',import.meta.url),'utf8'),'Compiled aliases identical');for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(match[1]);ok(!html.includes('type="module" src='),'Offline build has no module fetch dependency');
console.log(`${checks} checks passed: 12 complete structure routes, checkpoints, rigid two-link arm across aim plane, independent SDK and cleanup.`);
