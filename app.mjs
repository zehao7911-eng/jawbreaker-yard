import {JOBS,makeRun,blueprint,liveCells,targetAt,bite,lockBite,strikeBite,forecast,progress,defaultProfile,cleanProfile,mergeProfile,totalStars,clamp} from './core.mjs';
import {createView} from './view.mjs';
import {bridge} from './sdk.mjs';
import {makeAudio} from './audio.mjs';
const $=id=>document.getElementById(id),KEY='jawbreaker-yard-v1';
let profile;try{profile=cleanProfile(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{profile=defaultProfile();}
let run=profile.run||makeRun(profile.selected),mode='home',held=false,cycle=-1,struck=false,committed=null,queued=null,session=false,toastUntil=0,finishDelay=0,pointer=null;
let view;try{view=createView($('world'),kind=>audio.play(kind==='glass'?'glassLand':'land'));}catch{$('error').hidden=false;throw Error('WebGL initialization failed');}
const audio=makeAudio();audio.set(profile.sound);view.setJob(run);view.settings(profile);
let sdk;
function store(cloud=true){profile.run=run;try{localStorage.setItem(KEY,JSON.stringify(profile));}catch{}if(cloud)sdk?.save();}
function mountSDK(){return bridge({read:()=>profile,write:(raw,remote)=>{
  const adopt=remote&&!profile.run&&mode==='home'&&!session&&cycle<0&&!run.started;
  profile=remote?mergeProfile(profile,raw):cleanProfile(raw);try{localStorage.setItem(KEY,JSON.stringify(profile));}catch{}
  if(adopt&&profile.run){run=profile.run;view.setJob(run);if(run.finished)result();else home();}
},changed:e=>{if(e.type==='reward'){view.settings(profile);toast(e.kind==='like'?'COBALT PAINT UNLOCKED':'MIDNIGHT PAINT UNLOCKED');updateSocial(true);refreshPaints();}else if(e.type==='support'){updateSocial(true);fitViewport();}else if(e.type==='connected')fitViewport();}});}
sdk=mountSDK();
function fitViewport(){const v=sdk?.viewport(),w=Math.min(innerWidth,v?.width||innerWidth),h=Math.min(innerHeight,v?.height||innerHeight);document.documentElement.style.setProperty('--game-width',w+'px');document.documentElement.style.setProperty('--game-height',h+'px');view.resize();}
fitViewport();
function toast(message){$('pop').textContent=message;$('pop').classList.add('show');toastUntil=performance.now()+1400;}
function ui(active){$('hud').hidden=!active;$('controls').hidden=!active;$('pause').hidden=mode==='home';$('panel').classList.toggle('veil',mode==='pause'||mode==='jobs'||mode==='garage');}
function panel(html){$('panel').innerHTML=html;ui(mode==='play');}
function updateHUD(){const pct=Math.round(progress(run)*100);$('job-tag').textContent=JOBS[run.job].tag;$('job-title').textContent=JOBS[run.job].name;$('percent').innerHTML=pct+'<span>%</span>';$('progress').style.width=pct+'%';$('bites').textContent=run.bites+' BITES';$('par').textContent='GOLD ≤ '+JOBS[run.job].par+' BITES';$('bolts').textContent=Array.from({length:3},(_,i)=>i<run.bolts?'⬢':'○').join(' ');$('bolts').setAttribute('aria-label',`${run.bolts} of 3 salvage bolts recovered`);$('record').textContent=profile.chains[run.job]?'BEST CHAIN ×'+profile.chains[run.job]:'';}
function refreshAim(){if(mode!=='play')return;const a=committed&&!committed.used?committed.cell:view.gridTarget(),p=forecast(run,a.x,a.y);view.previewHit(p);$('tip').textContent=p.armoured?'ARMOURED · TWO BITES':p.count>2?'CHAIN PREVIEW ×'+p.count:p.cell?'READY TO CRUNCH':'Drag onto the building';}
function refreshPaints(){const n=totalStars(profile);for(const b of document.querySelectorAll('[data-paint]')){const i=+b.dataset.paint;b.disabled=i===1&&n<6&&!profile.rewards.like||i===2&&n<12&&!profile.rewards.comment;}}
function neutral(){held=false;pointer=null;$('crunch').classList.remove('engaged');}
function home(){neutral();cycle=-1;committed=null;queued=null;mode='home';panel(`<section class="sheet cover"><small class="eyebrow">A LITTLE HEAVY MACHINERY</small><h1>JAWBREAKER<br>YARD</h1><p class="sub">BIG JAWS. SMALL BUILDINGS.</p><p class="lead">Bite out a support.<br>Bring the whole block down.</p><button class="primary" data-action="play">${run.started&&!run.finished?'RESUME DEMOLITION':'CLOCK IN'} →</button><div class="row"><button data-action="jobs">JOBS <small>6 STRUCTURES</small></button><button data-action="garage">GARAGE <small>${totalStars(profile)} / 18 ★</small></button></div><div class="meta"><span>REAL-TIME 3D</span><span>ONE FINGER · NO TIMER</span></div></section>`);}
function play(job=null){
  if(job!==null){if(session){sdk.end();session=false;}neutral();cycle=-1;committed=null;queued=null;finishDelay=0;run=makeRun(job);profile.selected=job;sdk.prepare();view.setJob(run);store();}
  else if(run.finished){play(Math.min(5,run.job+1));return;}
  mode='play';panel('');updateHUD();refreshAim();audio.wake();
}
function pause(){if(mode!=='play')return;if(run.finished){finishDelay=0;result();return;}neutral();queued=null;audio.stop();mode='pause';panel(`<section class="sheet"><small class="eyebrow">HOLD THAT THOUGHT</small><h2>Taking a breather.</h2><p class="lead">Your yard is exactly where you left it.</p><button class="primary" data-action="resume">BACK TO WORK →</button><div class="options"><button data-action="sound">SOUND ${profile.sound?'ON':'OFF'}</button><button data-action="light">${profile.light?'LIGHT':'FULL'} DETAIL</button><button data-action="gentle">${profile.gentle?'GENTLE':'JUICY'} MOTION</button></div><div class="row"><button data-action="jobs">JOBS</button><button data-action="garage">GARAGE</button></div><button class="back" data-action="home">TITLE</button><p class="fine">Progress saves after each bite. Drag to aim, or use arrow keys. Hold Space to bite.</p></section>`);store();updateSocial();}
function jobs(){neutral();mode='jobs';panel(`<section class="sheet"><small class="eyebrow">FOREMAN'S CLIPBOARD</small><h2>Pick your next shift.</h2><div class="jobs">${JOBS.map((j,i)=>`<button data-job="${i}" ${i>0&&!profile.best[i-1]&&!profile.best[i]?'disabled':''}><small>0${i+1} / ${['TOWN','DOCK','NIGHT'][j.theme]}</small><b>${j.name}</b><span>${profile.best[i]?'★'.repeat(profile.best[i])+'☆'.repeat(3-profile.best[i]):i>0&&!profile.best[i-1]?'LOCKED':'READY TO CRUNCH'}</span></button>`).join('')}</div><button class="back" data-action="back">← BACK</button></section>`);}
function garage(){neutral();mode='garage';const stars=totalStars(profile);panel(`<section class="sheet"><small class="eyebrow">YOUR PIECE OF HEAVY METAL</small><h2>The paint shop.</h2><p class="lead">Earn stars. Freshen up your jaws.<br>All six structures use the same capable machine.</p><div class="paint-grid">${['YARD GOLD','COBALT','MIDNIGHT'].map((n,i)=>`<button data-paint="${i}" class="${profile.paint===i?'on':''}" ${i===1&&stars<6&&!profile.rewards.like||i===2&&stars<12&&!profile.rewards.comment?'disabled':''}>${n}<small>${i===0?'ORIGINAL':i===1?'6 ★':'12 ★'}</small></button>`).join('')}</div><p class="fine">${stars} / 18 best stars · Best results count once. Replaying never removes a medal.</p><div id="social"></div><button class="back" data-action="back">← BACK</button></section>`);updateSocial();}
function updateSocial(existingOnly=false){const el=$('social');if(!el||existingOnly&&!el.textContent)return;const height=el.getBoundingClientRect().height;if(existingOnly)el.style.minHeight=height+'px';const s=sdk?.support()||{};el.className='social';el.textContent=[s.like?(profile.rewards.like?'Cobalt received.':'Optional in GameWave: a confirmed like also unlocks Cobalt.'):null,s.comment?(profile.rewards.comment?'Midnight received.':'A new direct comment also unlocks Midnight.'):null].filter(Boolean).join(' ');if(el.textContent)el.textContent+=' No interaction is needed to play. Local claims apply to this browser; supported cloud saves can retain them.';el.hidden=!el.textContent&&!existingOnly;}
function result(){mode='result';neutral();cycle=-1;queued=null;const unlocked=totalStars(profile),j=JOBS[run.job];panel(`<section class="sheet receipt"><small class="eyebrow">SITE CLEAR / 0${run.job+1}</small><h2>That came down nicely.</h2><div class="stars" aria-label="${run.stars} stars">${'★'.repeat(run.stars)}${'☆'.repeat(3-run.stars)}</div><div class="stats"><div><b>${run.bites}</b><small>BITES</small></div><div><b>${run.largest}</b><small>BIGGEST CHAIN</small></div><div><b>3 / 3</b><small>SALVAGE</small></div></div><p class="unlocked">${run.stars===3?'Gold shift!':`Gold target: ${j.par} bites. Cut low supports to drop whole sections.`}${unlocked>=12?' Midnight paint earned.':unlocked>=6?' Cobalt paint earned.':''}</p><button class="primary" data-action="next">${run.job===5?'BACK TO THE YARD':'NEXT STRUCTURE →'}</button><div class="row"><button data-action="retry">REPLAY</button><button data-action="garage">GARAGE · ${unlocked} ★</button></div></section>`);}
function startCycle(){
  if(mode!=='play'||run.finished)return;
  const a=view.gridTarget();if(cycle>=0){queued={x:a.x,y:a.y};return;}
  const command=lockBite(run,a.x,a.y);if(command)beginCycle(command);
}
function beginCycle(command){
  committed=command;
  cycle=0;struck=false;view.focus(committed.cell);refreshAim();audio.wake();audio.play('servo');if(!session){sdk.start();session=true;audio.play('start');}
}
function strike(){const old=run.bolts,oldChain=profile.chains[run.job],events=strikeBite(run,committed);if(!events.length)return;
  profile.chains[run.job]=Math.max(oldChain,run.largest);
  view.impact(events);view.sync(run);updateHUD();audio.play('bite',events[0].blocks.length,events[0].cell.kind);
  view.previewHit(null);const chain=events[0].blocks.length;if(chain>oldChain&&chain>5){audio.play('record');toast('NEW BEST ×'+chain);}else if(run.bolts>old){audio.play('bolt');toast('SALVAGE +'+(run.bolts-old));}else if(chain>5)toast('CHAIN × '+chain);else if(events[0].armoured)toast('ARMOUR CRACKED');
  if(events.some(e=>e.type==='finish')){profile.best[run.job]=Math.max(profile.best[run.job],run.stars);neutral();sdk.end();session=false;finishDelay=1.6;audio.play('finish');}
  store();
}
function focusSupport(){const ground=liveCells(run).filter(c=>c.y===0).sort((a,b)=>a.x-b.x);if(ground.length){view.focus(ground[0]);refreshAim();}}
$('panel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;audio.wake();const action=b.dataset.action;
  if(b.dataset.job!==undefined){play(+b.dataset.job);focusSupport();return;}
  if(b.dataset.paint!==undefined){profile.paint=+b.dataset.paint;view.settings(profile);store();garage();return;}
  if(action==='play'){play();focusSupport();}else if(action==='resume'){play();}else if(action==='back'){if(run.finished)result();else if(run.started||session)play();else home();}
  else if(action==='home')home();else if(action==='jobs')jobs();else if(action==='garage')garage();
  else if(action==='next'){if(run.job===5)jobs();else{play(run.job+1);focusSupport();}}
  else if(action==='retry'){play(run.job);focusSupport();}
  else if(['sound','light','gentle'].includes(action)){profile[action]=!profile[action];audio.set(profile.sound);view.settings(profile);store();mode='play';pause();}
});
$('pause').onclick=pause;$('brand').onclick=e=>{e.preventDefault();if(mode==='play')pause();else home();};$('support').onclick=()=>{if(mode==='play'){focusSupport();audio.wake();}};
function down(e,onCanvas){if(mode!=='play'||run.finished)return;e.preventDefault();pointer=e.pointerId;e.currentTarget.setPointerCapture?.(e.pointerId);held=true;$('crunch').classList.add('engaged');if(onCanvas)view.aim(e.clientX,e.clientY);startCycle();}
$('world').addEventListener('pointerdown',e=>down(e,true));$('crunch').addEventListener('pointerdown',e=>down(e,false));
$('world').addEventListener('pointermove',e=>{if(mode==='play'&&pointer===e.pointerId){view.aim(e.clientX,e.clientY);if(cycle<0)refreshAim();if(held&&cycle<0)startCycle();}});
function up(e){if(pointer===e.pointerId){if(e.type==='pointercancel')queued=null;if(e.type==='pointercancel'&&!struck){cycle=-1;committed=null;refreshAim();}neutral();}}
for(const name of ['pointerup','pointercancel','lostpointercapture'])for(const id of ['world','crunch'])$(id).addEventListener(name,up);
window.addEventListener('keydown',e=>{if([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();if(e.key==='Escape'){if(mode==='play')pause();else if(mode==='pause')play();return;}if(mode!=='play')return;if(e.key===' '){if(!e.repeat){held=true;$('crunch').classList.add('engaged');startCycle();}}else if(e.key.startsWith('Arrow')){view.moveAim(e.key==='ArrowLeft'?-.35:e.key==='ArrowRight'?.35:0,e.key==='ArrowUp'?.30:e.key==='ArrowDown'?-.30:0);if(cycle<0)refreshAim();}});
window.addEventListener('keyup',e=>{if(e.key===' ')neutral();});
window.addEventListener('blur',()=>{if(mode==='play')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')pause();});
window.addEventListener('resize',fitViewport);window.addEventListener('pagehide',()=>{neutral();cycle=-1;committed=null;queued=null;store();sdk.stop();audio.stop();});window.addEventListener('pageshow',e=>{if(e.persisted){sdk=mountSDK();session=false;sdk.prepare();fitViewport();}});
let last=performance.now();function frame(now){const dt=clamp((now-last)/1000,0,.05);last=now;
  const paused=mode!=='play'&&mode!=='home';
  if(mode==='play'&&cycle>=0&&!run.finished){cycle+=dt;if(cycle>=.30&&!struck){struck=true;strike();}if(cycle>=.72){cycle=-1;committed=null;const next=queued;queued=null;if(!run.finished&&next){const command=lockBite(run,next.x,next.y);if(command)beginCycle(command);else refreshAim();}else if(held&&!run.finished)startCycle();else refreshAim();}}
  if(finishDelay>0&&mode==='play'){finishDelay-=dt;if(finishDelay<=0)result();}
  if(toastUntil&&now>toastUntil){$('pop').classList.remove('show');$('pop').textContent='';toastUntil=0;}
  const closed=cycle<0?0:Math.min(1,cycle/.30)*Math.max(0,1-(cycle-.39)/.30);
  $('crunch').style.setProperty('--bite',cycle<0?'0%':Math.min(100,cycle/.72*100)+'%');
  view.render(dt,{closed:clamp(closed,0,1),locked:cycle>=0?committed?.cell:null,active:mode==='play'&&!run.finished,paused,preview:mode==='home'});requestAnimationFrame(frame);
}
if(run.finished)result();else home();updateHUD();requestAnimationFrame(frame);




