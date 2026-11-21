import {makeReplication,makeTranslation} from './molecular-reactions.js';
import * as THREE from 'three';
import { ball, mesh, rod, path, organic, rim, sheet, surface, group, tag, particles, noise, sphere } from './surfaces.js';
import { interval, ease } from './processes.js';
import { structureInfo } from './structures.js';
import { pathwayInfo } from './pathways.js';
import {cellInterior,nuclearDetail,microtubuleNetwork,granules} from './cell-detail.js';

const TAU=Math.PI*2;
const lerp=(a,b,t)=>a+(b-a)*t;
const point=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
const names={mitochondrion:'Mitochondrion',chloroplast:'Chloroplast',membrane:'Plasma membrane',dna:'DNA',...Object.fromEntries(Object.entries({...structureInfo,...pathwayInfo}).map(([id,info])=>[id,info.name]))};
const identify=(g,id)=>tag(g,id,names[id],structureInfo[id]?.nodes[0]||({mitochondrion:'APBIO-2.1-10',chloroplast:'APBIO-2.1-09',membrane:'APBIO-2.3-01',dna:'APBIO-6.1-01'})[id]);

function nucleus(parent,small=false) {
 const g=group(parent);
 organic(g,[0,0,0],[1,1,.92],'#8875a3',{cut:true});
 organic(g,[0,0,-.015],[.94,.94,.87],'#55416d',{cut:true});rim(g,[.98,.98],'#c0a6d0',.045);
 for(let i=0;i<8;i++) {
  const a=i/8*TAU,p=[Math.cos(a)*.93,Math.sin(a)*.93,-.32];
  const pore=mesh(g,new THREE.TorusGeometry(.075,.025,8,16),surface('#ceb899'),p);pore.lookAt(new THREE.Vector3(...p).multiplyScalar(2));identify(pore,'nuclear-pore');
 }
 const chromatin=group(g),nucleosomes=[];
 for(let k=0;k<9;k++) {
  const points=Array.from({length:65},(_,i)=>{const a=i*.19+k*1.7;return [.58*Math.sin(a)*Math.cos(k+.2)+.07*Math.sin(a*3+k),.65*Math.cos(a*.81)+.04*Math.sin(a*2.3),-.13+.45*Math.sin(a*.53+k)];});
  path(chromatin,points,small?.011:.014,k%2?'#af8ca5':'#b99bcb');
  points.forEach((p,i)=>{if(i%4===0)nucleosomes.push(p);});
 }
 granules(chromatin,nucleosomes,'#bc9fbf',.023);identify(chromatin,'chromatin');
 const n=organic(g,[.23,-.17,.32],[.3,.32,.29],'#c27c9b',{roughness:.12});identify(n,'nucleolus');
 nuclearDetail(g);
 const subregions=[];for(let i=0;i<24;i++){const a=i*2.4,r=.08+Math.sqrt(i/24)*.2;subregions.push([.23+Math.cos(a)*r,-.17+Math.sin(a)*r,.5+Math.sin(i)*.045]);}
 identify(granules(g,subregions,'#e0a3b7',.024),'nucleolus');
 return identify(g,'nucleus');
}

function cisterna(parent,y,width,color,phase=0) {
 const geometry=new THREE.PlaneGeometry(2,2,28,10),pos=geometry.attributes.position;
 for(let i=0;i<pos.count;i++) {
  const u=pos.getX(i),v=pos.getY(i);
  pos.setXYZ(i,u*width,y+.15*u*u+.055*Math.sin(u*5+phase),v*.45*(1-.13*u*u)+.16*Math.sin(u*2.4));
 }
 geometry.computeVertexNormals();mesh(parent,geometry,surface(color));
 const inner=geometry.clone();inner.translate(0,-.075,0);mesh(parent,inner,surface(color));
 for(const side of [-1,1]) path(parent,Array.from({length:24},(_,i)=>{const u=i/23*2-1;return [u*width,y+.15*u*u+.055*Math.sin(u*5+phase),side*.45*(1-.13*u*u)+.16*Math.sin(u*2.4)];}),.045,color);
}
function er(parent,rough=true) {
 const g=group(parent);
 if(rough) {
  for(let k=0;k<5;k++) {
   cisterna(g,(k-2)*.23,1.15-k*.07,['#bc9d8a','#d2ad96','#c59b85'][k%3],k);
   const large=[],small=[];for(let j=0;j<13;j++){const x=(j/12*2-1)*(1.15-k*.07),z=.33*Math.sin(j*2.4);large.push([x,(k-2)*.23+.075,z]);small.push([x+.025,(k-2)*.23+.12,z+.01]);}identify(granules(g,large,'#79536f',.047),'ribosome');identify(granules(g,small,'#b58f9d',.032),'ribosome');
  }
 } else {
  for(let k=0;k<8;k++) {const x=(k%4-1.5)*.42,z=(Math.floor(k/4)-.5)*.55;path(g,[[x,-.7,z],[x+.25,-.2,z+.2],[x-.18,.3,z-.1],[x+.14,.7,z+.3]],.065,'#a79b6c');}
  for(let k=0;k<4;k++)path(g,[[-.7,k*.3-.4,-.2],[0,k*.3-.3,.1],[.7,k*.3-.4,.2]],.065,'#b5a57a');
 }
 return identify(g,rough?'rough-er':'smooth-er');
}
function golgi(parent) {
 const g=group(parent);
 for(let k=0;k<6;k++)cisterna(g,(k-2.5)*.2,1.15-Math.abs(k-2.5)*.12,['#b88a9b','#c696a4','#d4acb6'][k%3],k*.6);
 for(let i=0;i<7;i++)identify(organic(g,[(i%2?1:-1)*(1.03+i*.035),.65-i*.19,.3*Math.sin(i)],.11,'#d2aeb9'),'vesicle');
 return identify(g,'golgi');
}
function synthase(parent,light=false) {
 const g=group(parent),rotor=group(g);
 for(let i=0;i<10;i++){const a=i/10*TAU;ball(rotor,[Math.cos(a)*.23,-.2,Math.sin(a)*.23],[.085,.27,.085],'#d3ad5e');}
 rod(rotor,[0,-.25,0],[0,.65,0],.06,'#e4c782');
 for(let i=0;i<3;i++){const a=i/3*TAU;organic(rotor,[Math.cos(a)*.2,.65,Math.sin(a)*.2],[.24,.23,.24],i%2?'#d5a556':'#b68d50',{roughness:.1});}
 path(g,[[.35,-.35,0],[.45,0,.05],[.45,.65,.05],[.18,.75,0]],.05,'#a1b0a7');
 g.userData.rotor=rotor;identify(g,light?'chloroplast-atp-synthase':'atp-synthase');return g;
}
function organelle(parent,chloroplast=false,mini=false) {
 const g=group(parent),s=[2.35,.93,1.03],color=chloroplast?'#527f4f':'#b26749';
 organic(g,[0,0,0],s,color,{cut:true,roughness:.08});
 organic(g,[0,0,.015],[2.19,.79,.92],chloroplast?'#9fbd63':'#d4916a',{cut:true,roughness:.05});
 rim(g,s,chloroplast?'#b1c577':'#e6b48b',.042);rim(g,[2.19,.79],chloroplast?'#5d853d':'#9b4c37',.025);
 if(chloroplast) {
  const thylakoids=group(g);
  for(let k=0;k<5;k++) {
   const x=(k-2)*.78;
   for(let j=0;j<5;j++) {
    organic(thylakoids,[x,(j-2)*.19,.05],[.45,.068,.53],j%2?'#638a3d':'#7b9c47',{roughness:.045});
    if(k<4)rod(thylakoids,[x+.32,(j-2)*.19,-.28],[x+.5,(j-2)*.19,-.3],.027,'#8daa54');
   }
  }
  identify(thylakoids,'thylakoid');
 } else {
  for(let k=0;k<9;k++) {
   const x=(k-4)*.43;
   const geometry=new THREE.PlaneGeometry(2,2,14,22),p=geometry.attributes.position;
   for(let i=0;i<p.count;i++) {const u=p.getX(i),v=p.getY(i);p.setXYZ(i,x+.1*Math.sin(v*5+k)+.045*u*u,v*.66*(1-.08*Math.abs(k-4)),u*.65-.16);}
   geometry.computeVertexNormals();mesh(g,geometry,surface(k%2?'#be7552':'#d89970'));
   path(g,Array.from({length:24},(_,i)=>{const v=i/23*2-1;return [x+.1*Math.sin(v*5+k)+.045,v*.66*(1-.08*Math.abs(k-4)),.49];}),.038,'#ebbb8e');
  }
 }
 if(!mini) {
  for(let i=0;i<26;i++)ball(g,[Math.sin(i*2.4)*1.9,Math.cos(i*1.7)*.56,-.3+Math.sin(i*3)*.26],.026,chloroplast?'#bfd280':'#d1b28a');
  const dna=path(g,Array.from({length:25},(_,i)=>{const a=i/24*TAU;return [-1.65+.22*Math.cos(a),-.45+.14*Math.sin(a),.28+.06*Math.sin(a*3)];}),.018,'#e5c697');identify(dna,chloroplast?'chloroplast-dna':'mitochondrial-dna');
  const atp=synthase(g,chloroplast);atp.position.set(1.25,-.28,.55);atp.scale.setScalar(.4);atp.rotation.z=Math.PI;
 }
 return identify(g,chloroplast?'chloroplast':'mitochondrion');
}
function ribosome(parent) {
 const g=group(parent);
 organic(g,[0,.3,0],[.83,.57,.65],'#be8c94',{roughness:.2});
 organic(g,[0,-.36,.03],[.73,.3,.52],'#c4ab77',{roughness:.17});
 for(let i=0;i<6;i++)organic(g,[.48*Math.sin(i*2.4),.52+.12*Math.cos(i),.4*Math.cos(i*2.4)],.23,i%2?'#b78286':'#d2a6a2',{roughness:.15});
 path(g,[[-1.7,-.07,.4],[-.8,-.05,.5],[0,-.08,.52],[.8,-.05,.48],[1.7,-.07,.3]],.045,'#91b3bc');
 return identify(g,'ribosome');
}
function vesicle(parent,id='vesicle') {
 const g=group(parent),color=id==='lysosome'?'#859c59':id==='peroxisome'?'#a8a45e':'#c6a1b9';
 organic(g,[0,0,0],[.8,.8,.8],color,{cut:true,roughness:.07});rim(g,[.8,.8],color,.035);
 for(let i=0;i<13;i++){const a=i*2.4,r=.15+Math.sqrt(i/13)*.45;organic(g,[Math.cos(a)*r,Math.sin(a)*r,Math.sin(i)*.23],[.13,.085,.12],i%2?'#d3b674':'#bf8e9b',{roughness:.1});}
 return identify(g,id);
}
function centrosome(parent) {
 const g=group(parent);
 for(let k=0;k<2;k++) {const centriole=group(g,[k?.4:-.5,k?.25:-.15,0]);centriole.rotation.z=k?Math.PI/2:0;
  for(let j=0;j<9;j++)for(let n=0;n<3;n++){const a=j/9*TAU+n*.16,r=.25+n*.027;rod(centriole,[Math.cos(a)*r,-.65,Math.sin(a)*r],[Math.cos(a)*r,.65,Math.sin(a)*r],.035,n%2?'#bdaf7e':'#d6bf87');}
 }
 return identify(g,'centrosome');
}
function cytoskeleton(parent) {
 const g=group(parent);
 for(let i=0;i<9;i++) {const a=i/9*TAU;path(g,[[-.4,-.2,-.3],[Math.cos(a),Math.sin(a)*.9,-.3],[Math.cos(a)*2.7,Math.sin(a)*1.9,-.1]],.026,i%2?'#739da3':'#c3a566');}
 return identify(g,'cytoskeleton');
}
function cell(parent,plant=false) {
 const g=group(parent);let shell;
 if(plant) {
  // Rounded rectangular wall, open at its front face.
  const shape=new THREE.Shape();shape.moveTo(-2.65,-1.9);shape.lineTo(2.65,-1.9);shape.quadraticCurveTo(3.15,-1.9,3.15,-1.4);shape.lineTo(3.15,1.4);shape.quadraticCurveTo(3.15,1.9,2.65,1.9);shape.lineTo(-2.65,1.9);shape.quadraticCurveTo(-3.15,1.9,-3.15,1.4);shape.lineTo(-3.15,-1.4);shape.quadraticCurveTo(-3.15,-1.9,-2.65,-1.9);
  shell=mesh(g,new THREE.ExtrudeGeometry(shape,{depth:.11,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:3,steps:1}),surface('#687d45'),[0,0,-1.2]);identify(shell,'cell-wall');
  const outline=shape.getPoints(80).map(p=>[p.x,p.y,0]);const wall=path(g,outline,.13,'#9aab62', 'membrane',true);identify(wall,'cell-wall');
  for(let i=0;i<outline.length;i+=4){const p=outline[i];identify(rod(g,[p[0],p[1],-1.12],p,.07,'#7b9452'),'cell-wall');}
  identify(path(g,outline.map(p=>p.map((v,j)=>j<2?v*.96:v-.04)),.047,'#c6be88','membrane',true),'membrane');
  const vac=organic(g,[.65,-.1,-.3],[1.42,1.38,.7],'#4f939f',{opacity:.65,roughness:.025});identify(vac,'vacuole');
 } else {
  shell=organic(g,[0,0,0],[3.2,2.35,1.8],'#7b8f85',{cut:true,roughness:.075});identify(shell,'membrane');
  const inner=organic(g,[0,0,.015],[3.08,2.23,1.7],'#43616a',{cut:true,roughness:.05});identify(inner,'membrane');
  identify(rim(g,[3.15,2.3],'#b3b394',.052),'membrane');
 }
 cellInterior(g,plant);
 if(!plant)microtubuleNetwork(g);
 const n=nucleus(g,true);n.position.set(plant?-1.75:-.95,.55,.18);n.scale.setScalar(plant?.68:.88);
 const re=er(g);re.position.set(plant?-1.7:-1.25,-.68,.2);re.scale.setScalar(.64);re.rotation.z=-.25;
 identify(path(g,plant?[[-1.7,-.08,.18],[-1.8,-.25,.2],[-1.7,-.35,.2]]:[[-1.3,-.23,.18],[-1.35,-.31,.2],[-1.25,-.38,.2]],.065,'#bc9d8a'),'rough-er');
 const se=er(g,false);se.position.set(plant?-2.4:-2.3,.1,.12);se.scale.setScalar(.45);se.rotation.z=-.4;
 const go=golgi(g);go.position.set(plant?1.95:1.1,-.75,.65);go.scale.setScalar(.58);go.rotation.z=.22;
 const mitochondriaPositions=plant?[[-.25,-1.52,.13],[2.3,.55,.1]]:[[1.55,.85,.15],[-.75,-1.65,.02],[2.18,-.1,.2]];
 mitochondriaPositions.forEach((p,i)=>{const m=organelle(g,false,true);m.position.set(...p);m.scale.setScalar(.28);m.rotation.z=(i-.5)*.65;});
 if(plant)for(const [i,p]of [[-2.45,1.25,.1],[.2,1.57,.05],[2.52,-.85,.15]].entries()){const ch=organelle(g,true,true);ch.position.set(...p);ch.scale.setScalar(.27);ch.rotation.z=i*.5-.2;}
 if(!plant){const c=centrosome(g);c.position.set(.7,.1,.45);c.scale.setScalar(.3);}
 const vesicles=plant?['peroxisome','vesicle']:['lysosome','peroxisome','vesicle'];
 vesicles.forEach((id,i)=>{const v=vesicle(g,id);v.position.set(plant?-2.45+i*2.4:1.4-i*.9,plant?-.9:1.45, .35);v.scale.setScalar(.25+i*.025);});
 const ribos=group(g);for(let i=0;i<38;i++){const a=i*2.4,r=1.1+Math.sqrt(i/38)*1.6;const x=Math.cos(a)*r,y=Math.sin(a)*r*.68;if(plant&&Math.abs(x-.6)<1.5&&Math.abs(y)<1.3)continue;ball(ribos,[x,y,-.4+Math.sin(i)*.35],.033,'#d3b3a6');}identify(ribos,'free-ribosome');
 return g;
}

function processDots(parent,count,color) {const dots=particles(parent,count,color,.075);dots.group.visible=false;return dots;}
function energyRig(parent,light=false) {
 // An enlarged membrane inset is shown only during playback.
 const g=group(parent,[0,-1.7,1.1],.85);g.visible=false;
 const membrane=mesh(g,new THREE.BoxGeometry(5,.16,1.2),surface(light?'#668b45':'#a37556'));
 const proteins=[];
 for(let i=0;i<3;i++) {const p=organic(g,[-1.7+i*1.2,.03,0],[.25,.43,.28],['#ae829b','#bd9b6b','#87a7aa'][i],{roughness:.13});proteins.push(p);}
 const atp=synthase(g,light);atp.position.set(1.85,0,0);atp.rotation.z=Math.PI;
 const proton=particles(g,12,'#efd16d',.065),electron=particles(g,3,'#84dde3',.055),photon=particles(g,2,'#fff0b0',.08);
 const product=ball(g,[1.85,-1,0],.16,'#9cceb2');product.visible=false;
 const oxygen=group(g),nadph=group(g);
 ball(oxygen,[-.08,0,0],.085,'#d47767','atom');ball(oxygen,[.08,0,0],.085,'#d47767','atom');
 ball(nadph,[0,0,0],.14,'#7cbeb3','atom');ball(nadph,[.15,0,0],.075,'#d6bd7a','atom');
 return {update(s){
  g.visible=!!s;if(!s)return;const t=s.energyInput===0?0:s.t;
  for(let i=0;i<proton.items.length;i++) {
   const p=proton.items[i],x=-2.1+(i%6)*.65,initial=[x,-.55-(i%2)*.25,Math.sin(i)*.3],outside=[x,.65+(i%2)*.2,Math.sin(i)*.3];
   const pumped=interval(t,.06+i*.018,.25+i*.018);let pos=point(initial,outside,pumped);
   if(t>.58){const cycle=interval(t,.58+i*.017,.78+i*.017);pos=cycle<.5?point(outside,[1.85,.5,0],cycle*2):point([1.85,.5,0],[1.85,-.9,0],(cycle-.5)*2);}
   if(s.condition==='leaky'&&i<10&&t>.58)pos=point(outside,[x,-.9,Math.sin(i)*.3],interval(t,.58,.84));
   p.position.set(...pos);
  }
  electron.items.forEach((p,i)=>{p.visible=t<.6&&s.energyInput!==0;p.position.set(-1.9+((t*3+i*.24)%1)*3.8,.18,.3);});
  photon.items.forEach((p,i)=>{p.visible=light&&t<.64&&s.energyInput!==0;const v=(t*4+i*.5)%1;p.position.set(i? .7:-1.7,1.8-v*1.8,0);});
  atp.userData.rotor.rotation.y=interval(t,.58,1)*Math.PI*10*(s.coupling??1);
  product.visible=t>.74;product.scale.setScalar(.16);product.position.set(1.85+interval(t,.74,1)*.6,-.95,0);
  oxygen.visible=light&&t>.08;oxygen.position.set(-1.85-interval(t,.08,.35)*.35,.8+interval(t,.08,.35)*.3,0);
  nadph.visible=light&&t>.5;nadph.position.set(.7,-.65-interval(t,.5,.78)*.3,0);
 }};
}

export const detailedBuilders={
 makeEnergyRig(light){return energyRig(this.root,light);},
 makeChloroplastATP(){synthase(this.root,true);this.processRig=energyRig(this.root,true);this.energyAnnotations(true);},
 makeCell(kind) {
  cell(this.root,kind==='plant-cell');
  this.annotation('Nucleus',[-1,.9,.5],{inspect:'nucleus',label:'Nucleus'});
  this.annotation('Golgi apparatus',[1.1,-.65,.8],{inspect:'golgi',label:'Golgi apparatus'});
  this.annotation('Mitochondrion',[1.55,.85,.3],{inspect:'mitochondrion',label:'Mitochondrion'});
  this.processRig=this.secretionRig(this.root,kind);
 },
 secretionRig(parent,kind) {
  const g=group(parent),ves=vesicle(g);ves.scale.setScalar(.18);
  const cargo=ball(g,[-1.15,-.6,.85],.08,'#8ee0dd','glow',{emissive:'#8ee0dd',emissiveIntensity:.45});g.visible=false;
  const a=[kind==='plant-cell'?-1.7:-1.2,-.6,.9],b=[kind==='plant-cell'?1.95:1.1,-.65,1],c=[kind==='plant-cell'?2.9:2.85,.15,.4],d=[3.5,.2,.5];
  return {update(s){g.visible=!!s;if(!s)return;const t=s.t;let p=t<.25?a:t<.5?point(a,b,interval(t,.25,.5)):t<.73?b:point(b,c,interval(t,.73,.9));ves.position.set(...p);ves.visible=t>.22&&t<.91;cargo.position.set(...(t>.9?point(c,d,interval(t,.9,1)):p));cargo.scale.setScalar(.08*(.35+.65*interval(t,0,.22)));}};
 },
 makeOrganelle(kind) {
  const chl=kind==='chloroplast';const model=organelle(this.root,chl);if(chl)model.traverse(o=>{if(o.userData.inspect==='atp-synthase'){o.userData.inspect='chloroplast-atp-synthase';o.userData.label='Chloroplast ATP synthase';}});
  this.annotation(chl?'Thylakoids':'ATP synthase',chl?[0,.4,.3]:[1.25,-.3,.7],{inspect:chl?'thylakoid':'atp-synthase',label:chl?'Thylakoid membrane':'ATP synthase'});
  this.processRig=energyRig(this.root,chl);
  this.energyAnnotations(chl);
 },
 energyAnnotations(light) {
  this.annotation(light?'Thylakoid lumen · H⁺':'Intermembrane space · H⁺',[0,-.83,1.2],{processOnly:true});
  if(light){
   this.annotation('Stroma',[-1.1,-2.65,1.2],{processOnly:true});
   this.annotation('O₂',[-1.9,-.7,1.2],{processOnly:true,after:.08,visibleWhen:s=>s?.energyInput>0});
   this.annotation('NADPH',[.6,-2.65,1.2],{processOnly:true,after:.5,visibleWhen:s=>s?.energyInput>0});
   this.annotation('ATP',[1.9,-2.65,1.2],{processOnly:true,after:.74,visibleWhen:s=>s?.energyInput>0});
  }else this.annotation('Matrix · ADP + Pᵢ → ATP',[.8,-2.65,1.2],{processOnly:true});
 },
 makeStructure(id) {
  if(id==='nucleus')nucleus(this.root);
  else if(id==='rough-er'||id==='smooth-er'){er(this.root,id==='rough-er');}
  else if(id==='golgi'){golgi(this.root);}
  else if(id==='ribosome'){const body=ribosome(this.root);this.makeTranslationRig(body);}
  else if(['lysosome','peroxisome','vesicle'].includes(id)){vesicle(this.root,id);}
  else if(id==='centrosome')centrosome(this.root);
  else if(id==='cytoskeleton'){cytoskeleton(this.root);microtubuleNetwork(this.root);}
  else if(id==='atp-synthase'){synthase(this.root);this.processRig=energyRig(this.root,false);this.energyAnnotations(false);}
  else if(id==='thylakoid'){organelle(this.root,true);this.processRig=energyRig(this.root,true);this.energyAnnotations(true);}
  else if(id==='vacuole'){organic(this.root,[0,0,0],[1.7,2,1.2],'#5e9eac',{cut:true});rim(this.root,[1.7,2],'#b3c9b7',.05);for(let i=0;i<35;i++)ball(this.root,[Math.sin(i*2.4)*1.3,Math.cos(i*2.4)*1.6,-.3+Math.sin(i)*.4],.04,'#8ac3cc');}
  else if(id==='cell-wall'){for(let k=0;k<3;k++)for(let i=0;i<12;i++){const pts=Array.from({length:18},(_,j)=>[j/17*4-2,(i-5.5)*.25+Math.sin(j*.6+k)*.05,k*.22]);const fiber=path(this.root,pts,.045,k%2?'#b4ac79':'#839064');if(k%2)fiber.rotation.z=.45;}}
  else if(id==='nucleolus'){organic(this.root,[0,0,0],[1,1.1,1],'#b17491',{roughness:.2});for(let i=0;i<18;i++)organic(this.root,[Math.sin(i*2.4)*.8,Math.cos(i*2.4)*.8,Math.sin(i)*.7],.17,'#ce99af',{roughness:.15});}
  else if(id==='nuclear-pore'){for(let i=0;i<8;i++){const a=i/8*TAU;organic(this.root,[Math.cos(a),Math.sin(a),0],[.28,.28,.35],'#b79a7f',{roughness:.15});path(this.root,[[Math.cos(a),Math.sin(a),0],[Math.cos(a)*.7,Math.sin(a)*.7,.8],[Math.cos(a)*.3,Math.sin(a)*.3,1.3]],.035,'#c6aa91');}}
  else if(id==='enzyme')this.makeEnzyme();
  else if(id==='leaf')this.makeLeaf();
 },
 makeTranslationRig:makeTranslation,
 makeEnzyme() {
  const enzyme=group(this.root);
  for(let i=0;i<18;i++){const a=.55+i/17*(TAU-1.1);organic(enzyme,[Math.cos(a)*1.3,Math.sin(a)*1.15,Math.sin(i*2.4)*.22],[.48,.44,.52],i%3?'#688a9c':'#819aa4',{roughness:.16});}
  const substrate=group(this.root),a=organic(substrate,[0,.2,0],[.24,.24,.22],'#d4ad64',{roughness:.06}),b=organic(substrate,[0,-.2,0],[.24,.24,.22],'#97b4b3',{roughness:.06});
  const bond=rod(substrate,[0,.2,0],[0,-.2,0],.07,'#c7a263');
  const oxygen=ball(this.root,[3,1.4,0],.12,'#c56d5e','atom'),hydrogen1=ball(this.root,[2.84,1.5,0],.07,'#ece9da','atom'),hydrogen2=ball(this.root,[3.16,1.5,0],.07,'#ece9da','atom');
  this.processRig={update(s){
   const t=s?.t||0,bind=interval(t,0,.28),react=interval(t,.48,.65),release=interval(t,.76,1),x=lerp(3,1.3,bind)+release*1.5;
   substrate.position.set(x,0,.12);a.position.y=.2+react*.16+release*.28;b.position.y=-.2-react*.16-release*.28;bond.visible=react<.5;
   const water=[lerp(3,1.3,bind),lerp(1.4,.8,bind),.12];
   oxygen.position.set(...point(water,[x,a.position.y+.27,.12],react));
   hydrogen1.position.set(...point([water[0]-.16,water[1]+.1,.12],[x-.1,a.position.y+.4,.12],react));
   hydrogen2.position.set(...point([water[0]+.16,water[1]+.1,.12],[x,b.position.y-.27,.12],react));
   enzyme.scale.y=1-.06*Math.sin(interval(t,.25,.85)*Math.PI);
  }};
  this.annotation('A–B + H₂O → A–OH + H–B',[0,-1.6,0],{processOnly:true});
 },
 makeMembrane() {
  for(let x=-6;x<=6;x++)for(let z=-4;z<=4;z++){if(Math.abs(x)<2&&Math.abs(z)<2)continue;for(const side of [-1,1]){
   const xx=x*.39,zz=z*.4,y=side*.66+.035*Math.sin(x+z);identify(ball(this.root,[xx,y,zz],.18,'#8daaa0'),'phospholipid');
   for(const o of [-.07,.07])path(this.root,[[xx+o,y-side*.16,zz],[xx+o+.03,side*.28,zz+.04],[xx+o-.04,side*.04,zz+.09]],.035,'#b9a474');
  }}
  for(let i=0;i<8;i++){const a=i/8*TAU;organic(this.root,[Math.cos(a)*.53,0,Math.sin(a)*.53],[.19,.98,.19],i%2?'#ad87a3':'#927692',{roughness:.08});}
  const dots=processDots(this.root,24,'#7bd3d4');
  this.processRig={update(s){dots.group.visible=!!s;if(!s)return;dots.items.forEach((p,i)=>p.position.set(...s.positions[i]));}};
  this.annotation('Channel',[.55,.95,0],'APBIO-2.6-01');this.annotation('Hydrophobic tails',[-2,0,.8],'APBIO-2.4-01');
 },
 makeDNA:makeReplication,
 makeProtein(protein) {
  if(!protein)return;const points=protein.atoms;const center=new THREE.Box3().setFromPoints(points.map(a=>new THREE.Vector3(a.x,a.y,a.z))).getCenter(new THREE.Vector3());
  for(const a of points){const colors={C:'#879b98',N:'#728fae',O:'#ba8077',S:'#c4b36b'},radii={C:1.7,N:1.55,O:1.52,S:1.8};const atom=ball(this.root,[(a.x-center.x)*.18,(a.y-center.y)*.18,(a.z-center.z)*.18],(radii[a.element]||1.5)*.18,colors[a.element]||'#a8aaa0','atom');atom.userData={atom:a,element:a.element};}
  this.annotation('Folded protein',[0,1.9,0],'APBIO-1.7-05');
 },
};
