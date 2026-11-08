export const JOBS = [
  {name:'Brick & Breakfast',tag:'OLD TOWN / 01',cols:7,rows:7,theme:0,par:7,shape:'house'},
  {name:'The Water Works',tag:'DOCKSIDE / 02',cols:7,rows:10,theme:1,par:7,shape:'tank'},
  {name:'Skybridge Suites',tag:'OLD TOWN / 03',cols:9,rows:9,theme:0,par:9,shape:'bridge'},
  {name:'Cold Storage',tag:'DOCKSIDE / 04',cols:9,rows:8,theme:1,par:12,shape:'factory'},
  {name:'Radio Goodbye',tag:'AFTER HOURS / 05',cols:7,rows:12,theme:2,par:9,shape:'radio'},
  {name:'Glass Half Gone',tag:'AFTER HOURS / 06',cols:9,rows:12,theme:2,par:11,shape:'hotel'}
];
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function armJoint(base,end,a=4.3,b=4.0){
  const delta=end.map((v,i)=>v-base[i]),length=Math.hypot(...delta),d=delta.map(v=>v/(length||1));
  const reach=clamp(length,Math.abs(a-b)+.00001,a+b-.00001),along=(reach*reach+a*a-b*b)/(2*reach),height=Math.sqrt(Math.max(0,a*a-along*along));
  let bend=[-d[0]*d[1],1-d[1]*d[1],-d[2]*d[1]],n=Math.hypot(...bend);if(n<.0001){bend=[1,0,0];n=1;}
  return{elbow:base.map((v,i)=>v+d[i]*along+bend[i]/n*height),end:base.map((v,i)=>v+d[i]*reach)};
}
const key=(x,y,z)=>`${x},${y},${z}`;
export function blueprint(job){
  const j=JOBS[job], cells=[];
  for(let y=0;y<j.rows;y++) for(let x=0;x<j.cols;x++) for(let z=0;z<2;z++){
    let exists=true;
    if(j.shape==='house'&&y>=5) exists=Math.abs(x-3)<=6-y;
    if(j.shape==='tank'&&y<6) exists=x===1||x===5;
    if(j.shape==='bridge'&&y<5) exists=x<2||x>6;
    if(j.shape==='factory'&&y>5) exists=x>1&&x<7;
    if(j.shape==='radio'&&y>5) exists=Math.abs(x-3)<=Math.max(0,Math.floor((12-y)/3));
    if(j.shape==='hotel'&&y<3) exists=x===1||x===4||x===7;
    if(!exists)continue;
    const glass=(j.shape==='hotel'&&y>2&&y%3!==0)||(j.shape==='tank'&&y>=6);
    const steel=(j.shape==='radio'&&y<6&&x===3)||(j.shape==='factory'&&y===0&&x%3===0);
    cells.push({id:key(x,y,z),x,y,z,kind:glass?'glass':steel?'steel':'brick',hp:steel?2:1});
  }
  // Bolts are physical members, recovered when their block falls or is bitten.
  const front=cells.filter(c=>c.z===1&&c.y>=1);
  for(let i=0;i<3;i++)front[Math.floor((i+.5)*front.length/3)].bolt=true;
  return cells;
}
export function makeRun(job=0){return{job,removed:[],damaged:[],bites:0,bolts:0,largest:0,finished:false,stars:0,started:false};}
export function liveCells(r){const gone=new Set(r.removed), hurt=new Set(r.damaged);return blueprint(r.job).filter(c=>!gone.has(c.id)).map(c=>({...c,hp:c.hp-(hurt.has(c.id)?1:0)}));}
export function progress(r){return r.removed.length/blueprint(r.job).length;}
export function targetAt(r,x,y){
  const cells=liveCells(r);let best=null, d=Infinity;
  for(const c of cells){let dd=(c.x-x)**2+(c.y-y)**2;if(dd<d-.0001||Math.abs(dd-d)<.0001&&c.z>(best?.z??-1)){best=c;d=dd;}}
  return d<2.2?best:null;
}
export function lockBite(run,x,y){const cell=targetAt(run,x,y);return !run.finished&&cell?{job:run.job,cell:{...cell},used:false}:null;}
export function strikeBite(run,command){
  if(!command||command.used||command.job!==run.job||run.finished)return[];
  command.used=true;
  return liveCells(run).some(c=>c.id===command.cell.id)?bite(run,command.cell.x,command.cell.y):[];
}
export function forecast(run,x,y){
  const command=lockBite(run,x,y);if(!command)return{cell:null,blocks:[],count:0,armoured:false};
  const copy={...run,removed:[...run.removed],damaged:[...run.damaged]};
  const events=strikeBite(copy,command),blocks=events.flatMap(e=>e.blocks||[]);
  return{cell:command.cell,blocks,count:blocks.length,armoured:events[0]?.armoured===true};
}
export function bite(r,x,y){
  if(r.finished)return[];
  const c=targetAt(r,x,y);if(!c)return[];
  r.started=true;r.bites++;
  const all=blueprint(r.job), gone=new Set(r.removed), hurt=new Set(r.damaged), detached=[];
  // A full-depth bite gives the tool a predictable, phone-readable footprint.
  for(const q of all.filter(q=>q.x===c.x&&q.y===c.y&&!gone.has(q.id))){
    if(q.hp-(hurt.has(q.id)?1:0)>1){hurt.add(q.id);continue;}
    gone.add(q.id);detached.push({...q,impact:true});
  }
  const remaining=all.filter(q=>!gone.has(q.id)), indexed=new Map(remaining.map(q=>[q.id,q]));
  // Bounded lateral bearing: masonry needs a vertical load path; bridge and tank
  // girders can bridge their authored span. This is a structural arcade model.
  const span={house:0,tank:2,bridge:3,factory:0,radio:0,hotel:1}[JOBS[r.job].shape];
  const supported=new Set(), costs=new Map(), queue=remaining.filter(q=>q.y===0);
  for(const q of queue){supported.add(q.id);costs.set(q.id,0);}
  for(let i=0;i<queue.length;i++){
    const q=queue[i];
    for(const [dx,dy,dz]of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
      const id=key(q.x+dx,q.y+dy,q.z+dz),cost=costs.get(q.id)+(dx?1:0);if(indexed.has(id)&&cost<=span&&cost<(costs.get(id)??Infinity)){supported.add(id);costs.set(id,cost);queue.push(indexed.get(id));}
    }
  }
  for(const q of remaining)if(!supported.has(q.id)){gone.add(q.id);detached.push({...q,impact:false});}
  r.removed=Array.from(gone);r.damaged=Array.from(hurt).filter(id=>!gone.has(id));
  r.bolts=all.filter(q=>q.bolt&&gone.has(q.id)).length;r.largest=Math.max(r.largest,detached.length);
  const events=[{type:'bite',cell:c,blocks:detached,armoured:detached.length===0}];
  if(progress(r)>=.95){
    // Final ground scraps are scooped as the completion cleanup, not silently counted as hits.
    const cleanup=all.filter(q=>!gone.has(q.id));
    r.removed=all.map(q=>q.id);r.damaged=[];r.bolts=3;r.finished=true;
    r.stars=1+(r.bites<=JOBS[r.job].par+4?1:0)+(r.bites<=JOBS[r.job].par?1:0);
    events.push({type:'finish',blocks:cleanup,stars:r.stars});
  }
  return events;
}
export function defaultProfile(){return{best:Array(6).fill(0),chains:Array(6).fill(0),selected:0,paint:0,sound:true,light:false,gentle:false,rewards:{like:false,comment:false},run:null};}
export const totalStars=p=>p.best.reduce((a,b)=>a+b,0);
export function cleanProfile(raw){
  const p=defaultProfile();if(!raw||typeof raw!=='object')return p;
  if(Array.isArray(raw.best))p.best=p.best.map((_,i)=>Number.isInteger(raw.best[i])?clamp(raw.best[i],0,3):0);
  if(Array.isArray(raw.chains))p.chains=p.chains.map((_,i)=>Number.isInteger(raw.chains[i])?clamp(raw.chains[i],0,blueprint(i).length):0);
  p.selected=Number.isInteger(raw.selected)?clamp(raw.selected,0,5):0;
  p.paint=Number.isInteger(raw.paint)?clamp(raw.paint,0,2):0;
  p.sound=raw.sound!==false;p.light=raw.light===true;p.gentle=raw.gentle===true;
  p.rewards={like:raw.rewards?.like===true,comment:raw.rewards?.comment===true};
  const r=raw.run;
  if(r&&Number.isInteger(r.job)&&r.job>=0&&r.job<6&&Number.isInteger(r.bites)&&r.bites>=0&&r.bites<10000&&Array.isArray(r.removed)&&Array.isArray(r.damaged)&&typeof r.started==='boolean'&&typeof r.finished==='boolean'){
    const bp=blueprint(r.job),ids=new Set(bp.map(q=>q.id));
    if(r.removed.length<=bp.length&&new Set(r.removed).size===r.removed.length&&r.removed.every(id=>ids.has(id))&&r.damaged.every(id=>ids.has(id)&&bp.find(q=>q.id===id).hp===2&&!r.removed.includes(id))){
      const done=r.removed.length===bp.length;
      if(r.finished===done&&(!r.bites?r.removed.length===0:true)){
        p.run={job:r.job,removed:[...r.removed],damaged:[...new Set(r.damaged)],bites:r.bites,
          bolts:bp.filter(q=>q.bolt&&r.removed.includes(q.id)).length,
          largest:Number.isInteger(r.largest)?clamp(r.largest,0,bp.length):0,finished:done,
          stars:done?1+(r.bites<=JOBS[r.job].par+4?1:0)+(r.bites<=JOBS[r.job].par?1:0):0,started:r.started};
        if(done)p.best[r.job]=Math.max(p.best[r.job],p.run.stars);
        p.chains[r.job]=Math.max(p.chains[r.job],p.run.largest);
      }
    }
  }
  if(p.paint===1&&totalStars(p)<6&&!p.rewards.like)p.paint=0;
  if(p.paint===2&&totalStars(p)<12&&!p.rewards.comment)p.paint=0;
  return p;
}
export function mergeProfile(local,remote){const p=cleanProfile(local),q=cleanProfile(remote);return cleanProfile({...p,best:p.best.map((v,i)=>Math.max(v,q.best[i])),chains:p.chains.map((v,i)=>Math.max(v,q.chains[i])),run:p.run||q.run,rewards:{like:p.rewards.like||q.rewards.like,comment:p.rewards.comment||q.rewards.comment}});}
