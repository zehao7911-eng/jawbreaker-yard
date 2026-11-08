import * as P from './primitives.mjs';
import {yard,digger,group} from './art.mjs';
import {JOBS,blueprint,liveCells,clamp} from './core.mjs';
const T=window.THREE;
export function createView(canvas){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(43,1,.1,90), sun=new T.DirectionalLight('#fff0d0',2.15);
  sun.position.set(-6,13,7);scene.add(sun,new T.HemisphereLight('#dceef4','#74725b',1.6));
  let stage=null,machine=null,building=null,job=0,light=false,gentle=false,t=0,kick=0,ornaments=[];
  const dummy=new T.Object3D(),ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,0,1),-.9),hitPoint=new T.Vector3();
  const max=400,blockGeo=new T.BoxGeometry(.63,.48,.60),blockMat=new T.MeshStandardMaterial({roughness:.84,metalness:.03});
  const bricks=new T.InstancedMesh(blockGeo,blockMat,max),windows=new T.InstancedMesh(new T.BoxGeometry(.37,.28,.025),new T.MeshStandardMaterial({roughness:.3,metalness:.22}),max);
  const bolts=new T.InstancedMesh(new T.TorusGeometry(.095,.032,5,10),new T.MeshStandardMaterial({color:'#ffc95e',roughness:.36,metalness:.5}),3);
  scene.add(bricks,windows,bolts);bricks.instanceMatrix.setUsage(T.DynamicDrawUsage);windows.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const debris=new T.InstancedMesh(new T.BoxGeometry(1,1,1),blockMat,180),dust=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:'#edcf9c',transparent:true,opacity:.65,depthWrite:false}),90);
  scene.add(debris,dust);const rubble=[],puffs=[];
  const marker=group(scene);const ring=new T.Mesh(new T.TorusGeometry(.33,.025,5,32),new T.MeshBasicMaterial({color:'#fff4c2',depthTest:false}));marker.add(ring);
  for(let s of [-1,1]){P.block(marker,.11,.05,.03,'#fff4c2',s*.39,0,0,0);P.block(marker,.05,.11,.03,'#fff4c2',0,s*.35,0,0);}
  marker.renderOrder=10;let target=new T.Vector3(0,1,.9),previous=target.clone();
  function position(c){return new T.Vector3((c.x-(JOBS[job].cols-1)/2)*.68,.30+c.y*.52,c.z*.65-.32);}
  function color(c){return c.kind==='glass'?'#8bb8bb':c.kind==='steel'?'#5b7480':[['#d68d68','#c57859'],['#b6c5b8','#8caaa6'],['#a8a1b5','#897b9f']][JOBS[job].theme][(c.x+c.y+c.z)%2];}
  function sync(run){
    const live=liveCells(run);bricks.count=live.length;windows.count=0;bolts.count=0;
    const gone=new Set(run.removed);for(const o of ornaments)if(!o.falling)o.root.visible=!gone.has(o.id);
    for(let i=0;i<live.length;i++){
      const c=live[i],p=position(c);dummy.position.copy(p);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();bricks.setMatrixAt(i,dummy.matrix);
      // Material darkens once armour has cracked; windows follow surviving blocks.
      bricks.setColorAt(i,new T.Color(c.kind==='steel'&&c.hp===1?'#d8b26c':color(c)));
      if(c.z===1&&c.y>0&&(c.kind==='glass'||c.y%2===1&&c.x%2===0)){
        dummy.position.z+=.317;dummy.scale.set(.98,.96,1);dummy.updateMatrix();windows.setMatrixAt(windows.count,dummy.matrix);windows.setColorAt(windows.count++,new T.Color(c.kind==='glass'?'#d5e6d9':JOBS[job].theme===2?'#f5d599':'#335e69'));
      }
      if(c.bolt){dummy.position.copy(p);dummy.position.z+=.36;dummy.scale.set(1,1,1);dummy.updateMatrix();bolts.setMatrixAt(bolts.count++,dummy.matrix);}
    }
    bricks.instanceMatrix.needsUpdate=true;if(bricks.instanceColor)bricks.instanceColor.needsUpdate=true;windows.instanceMatrix.needsUpdate=true;if(windows.instanceColor)windows.instanceColor.needsUpdate=true;bolts.instanceMatrix.needsUpdate=true;
  }
  function setJob(run){
    if(stage){scene.remove(stage);P.dispose(stage);}if(machine){scene.remove(machine.root);P.dispose(machine.root);}
    if(building){scene.remove(building);P.dispose(building);}building=group(scene);ornaments=[];
    job=run.job;stage=yard(JOBS[job].theme);scene.add(stage);machine=digger();scene.add(machine.root);rubble.length=0;puffs.length=0;
    canvas.parentElement.dataset.night=String(JOBS[job].theme===2);
    const sky=['#c5dbce','#bed7d8','#4b557b'][JOBS[job].theme];scene.background=new T.Color(sky);scene.fog=new T.Fog(sky,27,56);
    sun.intensity=JOBS[job].theme===2?1.7:2.15;
    const bp=blueprint(job),shape=JOBS[job].shape;
    for(let x=0;x<JOBS[job].cols;x++){
      const c=bp.filter(c=>c.x===x&&c.z===1).sort((a,b)=>b.y-a.y)[0];if(!c)continue;
      const p=position(c),o=group(building,p.x,p.y,p.z);
      P.block(o,.70,.10,1.35,'#3f7379',0,.30,-.32,.02);
      if(shape==='house'&&x===2){P.block(o,.24,.55,.31,'#9f735e',0,.6,-.3,.02);P.block(o,.32,.08,.40,'#e8c79a',0,.90,-.3,.02);}
      if(shape==='tank'){P.block(o,.62,.15,1.35,'#c0d4c7',0,.40,-.32,.03);if(x%2===0)P.cylinder(o,.04,.70,'#526874',0,.76,-.4);}
      if(shape==='bridge'&&x>1&&x<7){P.block(o,.06,.3,.06,'#e6c48b',-.28,.50,.28);P.block(o,.70,.05,.05,'#e6c48b',0,.64,.28);}
      if(shape==='factory'&&x===4){P.cylinder(o,.28,.30,'#526874',0,.53,-.25);P.cylinder(o,.33,.08,'#b7c6c4',0,.72,-.25);}
      if(shape==='radio'&&x===3){P.cylinder(o,.04,1.2,'#b7c6c4',0,.9,-.32);P.tube(o,[[-.45,1.5,-.32],[0,1.15,-.32],[.45,1.5,-.32]],.025,'#f2ca75');}
      if(shape==='hotel'&&x===4){P.sign(o,'VACANCY',0,.83,.01,1.85,'#e7b45e','#3e4d62',0);P.block(o,.07,.6,.08,'#526874',0,.5,-.1);}
      P.merge(o);ornaments.push({root:o,id:c.id,origin:p.clone(),falling:null});
    }
    target.set(0,1.0,.9);previous.copy(target);sync(run);resize();
  }
  function resize(){
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,light?1:1.5));renderer.setSize(w,h,false);camera.aspect=w/h;
    const portrait=w/h<.85,d=portrait?Math.max(16.5,11.2/(w/h)):15.5;
    camera.position.set(d*.23,d*.42,d);camera.lookAt(-1.15,JOBS[job].rows>9?3.3:2.6,1.0);camera.updateProjectionMatrix();
  }
  function aim(clientX,clientY){const rect=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),camera);if(ray.ray.intersectPlane(plane,hitPoint))target.set(clamp(hitPoint.x,-3.0,3.0),clamp(hitPoint.y,.30,6.15),.9);return gridTarget();}
  function gridTarget(){return{x:target.x/.68+(JOBS[job].cols-1)/2,y:(target.y-.30)/.52};}
  function moveAim(dx,dy){target.x=clamp(target.x+dx,-3,3);target.y=clamp(target.y+dy,.3,6.15);return gridTarget();}
  function focus(c){if(c)target.copy(position(c)).setZ(.9);}
  function impact(events){
    for(const e of events){
      if(e.type==='bite')kick=Math.min(.11,.025+e.blocks.length*.003);
      for(const c of e.blocks||[]){
        const p=position(c);rubble.push({p,v:new T.Vector3((Math.sin(c.x*5+c.y)*.5)+(c.impact?.6:0),c.impact?1.6:.2,1+Math.cos(c.y*6)*.7),r:new T.Vector3(),spin:new T.Vector3(Math.sin(c.y+2),Math.cos(c.x),Math.sin(c.x+c.y)),color:color(c),life:0,size:new T.Vector3(.60,.45,.57)});
        for(const o of ornaments)if(o.id===c.id){o.falling=rubble[rubble.length-1];o.root.visible=true;}
        if(puffs.length<80)puffs.push({p:p.clone(),v:new T.Vector3(Math.sin(c.x*2+c.y),.6,Math.cos(c.y*2)),life:0});
      }
    }
    if(rubble.length>180)rubble.splice(0,rubble.length-180);
  }
  function render(dt,{closed=0,active=false,paused=false,preview=false}={}){
    if(!paused){t+=dt;kick=Math.max(0,kick-dt*.30);previous.lerp(target,1-Math.exp(-dt*12));}
    marker.visible=active;marker.position.copy(target);ring.scale.setScalar(1+Math.sin(t*5)*.035);ring.material.color.set(closed>.5?'#f8b448':'#fff4c2');
    if(machine)machine.poseTool(previous,closed,t);
    let i=0;
    for(let n=rubble.length-1;n>=0;n--){const a=rubble[n];if(!paused){a.life+=dt;a.v.y-=8.0*dt;a.p.addScaledVector(a.v,dt);a.r.addScaledVector(a.spin,dt*1.5);if(a.p.y<.22){a.p.y=.22;a.v.y=Math.abs(a.v.y)*.18;a.v.x*=.75;a.v.z*=.75;a.spin.multiplyScalar(.6);}}if(a.life>7){rubble.splice(n,1);continue;}dummy.position.copy(a.p);dummy.rotation.set(a.r.x,a.r.y,a.r.z);dummy.scale.copy(a.size).multiplyScalar(a.life>5?Math.max(.01,(7-a.life)/2):1);dummy.updateMatrix();debris.setMatrixAt(i,dummy.matrix);debris.setColorAt(i++,new T.Color(a.color));}
    debris.count=i;debris.instanceMatrix.needsUpdate=true;if(debris.instanceColor)debris.instanceColor.needsUpdate=true;i=0;
    for(const o of ornaments)if(o.falling){o.root.position.copy(o.falling.p);o.root.rotation.set(o.falling.r.x,o.falling.r.y,o.falling.r.z);o.root.visible=o.falling.life<5;}
    for(let n=puffs.length-1;n>=0;n--){const a=puffs[n];if(!paused){a.life+=dt;a.p.addScaledVector(a.v,dt);}if(a.life>1.2){puffs.splice(n,1);continue;}dummy.position.copy(a.p);dummy.rotation.set(0,0,0);dummy.scale.setScalar((.08+a.life*.19)*(1-a.life/1.2));dummy.updateMatrix();dust.setMatrixAt(i++,dummy.matrix);}
    dust.count=i;dust.instanceMatrix.needsUpdate=true;
    const shake=gentle||paused?0:Math.sin(t*93)*kick;camera.setViewOffset(canvas.width,canvas.height,shake*12,shake*7,canvas.width,canvas.height);renderer.render(scene,camera);camera.clearViewOffset();
  }
  function settings(p){light=p.light;gentle=p.gentle;P.material('#e7aa3e').color.set(['#e7aa3e','#398ba1','#56617e'][p.paint||0]);resize();}
  return{setJob,sync,aim,moveAim,gridTarget,focus,impact,render,resize,settings,drawCalls:()=>renderer.info.render.calls};
}
