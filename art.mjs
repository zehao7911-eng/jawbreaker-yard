import * as P from './primitives.mjs';
import {armJoint} from './core.mjs';
const T=window.THREE;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent?.add(g);return g;}
export function link(mesh,a,b,width=.12){const d=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(V(0,1,0),d.clone().normalize());mesh.scale.set(width,d.length(),width);}
function shadow(parent,x,z,sx,sz){const m=new T.Mesh(new T.CircleGeometry(1,24),new T.MeshBasicMaterial({color:'#33494c',transparent:true,opacity:.15,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.021,z);m.scale.set(sx,sz,1);parent.add(m);return m;}
function cone(root,x,z){P.block(root,.34,.06,.34,'#293c4a',x,.04,z);P.cylinder(root,.035,.50,'#ea713b',x,.31,z,.16,false,8);P.cylinder(root,.08,.10,'#f5e8b8',x,.31,z,.105,false,8);}
function tree(root,x,z){P.cylinder(root,.10,1.3,'#71564b',x,.65,z);for(let i=0;i<3;i++)P.sphere(root,.70,'#5c8c75',x+Math.sin(i*4)*.35,1.6+i*.3,z+Math.cos(i*4)*.22,1,1,.9);}
function fence(root,x,z,width){P.block(root,width,.10,.10,'#b8b5a0',x,1.05,z);P.block(root,width,.10,.10,'#d4c5a5',x,.56,z);for(let q=-width/2;q<=width/2;q+=.7)P.block(root,.08,1.18,.11,'#507274',x+q,.59,z);}
export function yard(theme){
  const root=group(),pal=[['#bad9ce','#dcd4b5','#e8ac78'],['#b6d7dd','#b9c9bd','#5a8f9a'],['#333f63','#8997b2','#bd736c']][theme];
  P.block(root,28,.3,25,pal[1],0,-.17,-1,0);
  P.block(root,12,.05,10,theme===2?'#54627a':'#c9c3ad',0,-.005,1,0);
  for(let x=-6;x<=6;x+=.8){P.block(root,.016,.015,10,theme===2?'#6e7b90':'#b6b09b',x,.027,1,0);}
  for(let z=-4;z<=6;z+=.8)P.block(root,12,.015,.016,theme===2?'#6e7b90':'#b6b09b',0,.027,z,0);
  // Safety apron is geometry, with the target building well inside its boundaries.
  for(let s of [-1,1]){P.block(root,.12,.022,5.8,'#f1cb67',s*3.7,.035,.4,0);for(let i=0;i<12;i++){const b=P.block(root,.30,.025,.12,'#344952',s*3.7,.048,-2.3+i*.5,0);b.rotation.y=-.65;}}
  P.block(root,7.5,.025,.15,'#f1cb67',0,.035,-2.6,0);
  for(const [x,z]of[[-4,-2.5],[4,-2.5],[-4,2.8],[4,2.8]])cone(root,x,z);
  fence(root,0,-4.4,17);fence(root,-8.5,1.8,2.6);
  const hut=group(root,-6.7,0,-2.5);P.block(hut,2.5,1.7,1.6,'#e5ba82',0,.85,0);P.block(hut,2.8,.14,1.9,'#2d6267',0,1.77,0);P.block(hut,.65,1.2,.04,'#3b6872',-.58,.6,.82);P.block(hut,.65,.55,.04,'#94c9cc',.55,1.1,.83);P.sign(hut,'YARD 06',0,1.49,.855,1.6,'#f1e5bd','#2b4d57',0);
  for(let x of [-7,7]){P.cylinder(root,.06,4.7,'#4c6268',x,2.35,-3.4);P.block(root,1.0,.14,.40,'#293f50',x,4.65,-3.4);P.block(root,.8,.04,.30,'#ffe8a0',x,4.56,-3.4);shadow(root,x,-3.4,.4,.4);}
  if(theme===0){
    for(let i=0;i<6;i++){let x=-11+i*4.2,h=4+Math.sin(i*7)*1.4;P.block(root,3.0,h,2.1,i%2?'#d99c7c':'#92aaa0',x,h/2,-8.5);P.block(root,3.2,.18,2.3,'#537a77',x,h,-8.5);for(let n=0;n<3;n++)for(let s of [-1,1])P.block(root,.52,.62,.03,'#f5dfad',x+s*.65,.8+n*1.1,-7.43);}
    for(let x of [-10,10])tree(root,x,-4);
    for(let i=0;i<4;i++)P.block(root,1.2,.16,.68,'#987b5c',5.6,.12+i*.18,-.8);
  }else if(theme===1){
    P.block(root,35,.1,8,'#6ca8ad',0,-.12,-10,0);for(let i=0;i<20;i++)P.block(root,.8,.012,.05,'#9fc9c0',Math.sin(i*13)*15,-.052,-7.2-(i%5)*1.1,0);
    for(let i=0;i<4;i++){const x=-9+i*5.8,c=i%2?'#cb815c':'#637d89';P.block(root,3.2,1.5,1.5,c,x,.75,-5.8);for(let n=0;n<10;n++)P.block(root,.035,1.3,.04,'#a0b4af',x-1.4+n*.30,.75,-5.02);}
    for(let s of [-1,1]){P.block(root,.24,6,.24,'#5b7680',s*8,3,-10);P.block(root,16,.3,.3,'#5b7680',0,6,-10);P.tube(root,[[s*8,5.8,-10],[s*5.7,7,-10],[0,6,-10]],.09,'#62828b');}
  }else{
    for(let i=0;i<9;i++){let x=-16+i*4,h=4+(i*7%5);P.block(root,2.6,h,2.5,i%2?'#414e70':'#526180',x,h/2,-10);for(let y=.8;y<h;y+=1.05)for(let s of [-1,1])P.block(root,.45,.52,.04,(i+s+y)%3>.5?'#e5b46f':'#74859d',x+s*.65,y,-8.72);}
    const moon=P.sphere(root,1.05,'#ead7b0',7,10,-15);moon.material=new T.MeshBasicMaterial({color:'#ead7b0'});
    for(let s of [-1,1]){P.block(root,1.2,2.4,1.2,'#405b76',s*6,1.2,-1);P.block(root,1.05,.5,.03,'#ef9b78',s*6,1.55,-.38);}
  }
  for(let i=0;i<5;i++){const x=4.8+(i%2)*.9,z=3.6+Math.floor(i/2)*.7;P.cylinder(root,.23,.55,i%2?'#ba7f50':'#648c8c',x,.28,z);P.cylinder(root,.24,.07,'#334e5b',x,.16,z);P.cylinder(root,.24,.07,'#334e5b',x,.43,z);}
  P.merge(root);shadow(root,0,.5,3.6,2.2);return root;
}
export function operator(parent){
  const root=group(parent), body=group(root,0,.76,0);
  P.block(body,.42,.55,.30,'#ecbd62',0,.18,0,.06);P.block(body,.30,.33,.04,'#38626c',0,.10,.16);for(let s of [-1,1])P.block(body,.05,.47,.025,'#f6e3a6',s*.13,.20,.177);
  P.cylinder(body,.082,.16,'#bf825e',0,.55,0);const head=group(body,0,.75,.015);
  P.sphere(head,.215,'#dca77b',0,0,0,.85,1.13,.88);P.sphere(head,.045,'#c18462',0,-.03,.19,.7,.85,.7);
  for(let s of [-1,1]){P.sphere(head,.033,'#263d43',s*.078,.035,.167,.6,.9,.4);P.block(head,.07,.022,.025,'#684633',s*.079,.10,.155,.005);P.sphere(head,.045,'#ce946c',s*.186,-.01,0,.6,1,.7);}
  P.tube(head,[[-.06,-.11,.155],[0,-.128,.173],[.06,-.11,.155]],.012,'#724d3e');
  P.sphere(head,.24,'#f6cd62',0,.13,-.013,1,.65,.9);P.block(head,.49,.035,.43,'#e8ac47',0,.095,.025,.04);P.block(head,.06,.13,.39,'#ffe3a0',0,.21,-.01,.02);P.merge(head);
  const arms=[];
  for(let s of [-1,1]){
    const a=V(s*.24,1.11,0),e=V(s*.32,.96,.23),h=V(s*.24,1.0,.41);
    for(let [u,v,color,w]of[[a,e,'#ecbd62',.095],[e,h,'#bf825e',.075]]){const m=P.cylinder(root,1,1,color);link(m,u,v,w);}
    P.sphere(root,.075,'#dca77b',h.x,h.y,h.z);P.cylinder(root,.018,.30,'#293c4a',h.x,.85,h.z);P.sphere(root,.045,'#293c4a',h.x,1.0,h.z);
    P.block(root,.15,.24,.3,'#3b5767',s*.13,.59,.15);P.block(root,.14,.39,.16,'#3b5767',s*.13,.36,.34);P.block(root,.18,.13,.31,'#2c3f49',s*.13,.17,.43,.03);
  }
  P.merge(root,new Set([body]));P.merge(body,new Set([head]));return{root,body,head};
}
export function digger(){
  const root=group(),cab=group(root,-3,0,4.0),paint='#e7aa3e';
  for(let s of [-1,1]){P.block(cab,.42,.62,2.0,'#2b4148',s*.66,.36,0,.10);for(let z=-.74;z<=.74;z+=.37){let wheel=P.cylinder(cab,.22,.42,'#526369',s*.69,.34,z,.22);wheel.rotation.z=Math.PI/2;}for(let z=-.9;z<=.9;z+=.15)P.block(cab,.45,.045,.045,'#6a7775',s*.66,.67,z,.006);}
  P.cylinder(cab,.62,.22,'#526369',0,.77,0);P.block(cab,1.45,.55,1.65,paint,0,1.02,0,.08);P.block(cab,.95,.58,.64,paint,0,1.12,-.65,.10);
  P.block(cab,.76,.13,.71,'#304954',-.29,1.37,.40);P.block(cab,.64,.75,.16,'#365761',-.29,1.80,.06);P.block(cab,.75,.12,.83,paint,-.29,2.31,.43,.04);
  for(let x of [-.69,.11])for(let z of [.02,.83])P.block(cab,.055,.92,.055,'#344d54',x,1.85,z,.012);
  const driver=operator(cab);driver.root.position.set(-.29,1.00,.27);driver.root.scale.setScalar(.68);
  for(let i=0;i<5;i++)P.block(cab,.56,.034,.025,'#526369',.28,.88+i*.08,-.988);
  P.block(cab,.55,.08,.05,'#f7d67e',.37,1.11,.84);P.sign(cab,'JAW 06',.37,1.1,-.986,.66,'#e7aa3e','#344d54',Math.PI);
  const beacon=P.cylinder(cab,.09,.12,'#f2c355',.02,2.43,.33);P.merge(cab,new Set([driver.root]));
  const arm=group(root), beams=[],rams=[];
  for(let i=0;i<2;i++){const b=P.block(arm,.24,1,.29,paint,0,0,0,.015);beams.push(b);rams.push(P.cylinder(arm,1,1,'#b7c6c4'));}
  const joints=[P.sphere(arm,.20,'#425c64'),P.sphere(arm,.19,'#425c64'),P.sphere(arm,.16,'#425c64')];
  const tool=group(root);P.block(tool,.58,.32,.38,'#425c64',0,.15,0,.05);const jaws=[];
  for(let s of [-1,1]){let jaw=group(tool,s*.23,0,0);P.block(jaw,.16,.53,.48,'#e7aa3e',0,-.22,0,.03);let tip=P.block(jaw,.38,.12,.48,'#526874',-s*.10,-.48,0,.02);for(let z of [-.16,0,.16])P.block(jaw,.17,.11,.07,'#c7d6cc',-s*.23,-.49,z,.01);P.merge(jaw);jaws.push(jaw);}
  shadow(root,-3,4,1.2,1.45);
  const base=V(-2.7,1.48,3.9), l1=4.3,l2=4.0;
  function poseTool(target,close=0,t=0){
    const solved=armJoint(base.toArray(),target.clone().add(V(0,.45,0)).toArray(),l1,l2),end=V(...solved.end),elbow=V(...solved.elbow);
    for(let i=0;i<2;i++){const a=i?elbow:base,b=i?end:elbow;link(beams[i],a,b,1);beams[i].scale.x=beams[i].scale.z=1;link(rams[i],a.clone().lerp(b,.20).add(V(.16,0,.12)),a.clone().lerp(b,.82).add(V(.16,0,.12)),.053);}
    joints[0].position.copy(base);joints[1].position.copy(elbow);joints[2].position.copy(end);tool.position.copy(end);tool.rotation.y=.10;
    jaws[0].rotation.z=-.48+close*.48;jaws[1].rotation.z=.48-close*.48;
    driver.head.rotation.y=.22+Math.sin(t*.8)*.05;driver.head.rotation.x=-.08-close*.10;driver.body.rotation.z=close*.025;
    beacon.material.emissive.setHex(close>.5?0x4b2400:0);
  }
  return{root,poseTool,tool,cab};
}
