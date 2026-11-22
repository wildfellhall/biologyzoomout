import * as THREE from 'three';
import {ball,rod,path,organic,mesh,surface,group} from '../surfaces.js';
import {plant,rabbit,fox,shrub,groundCover,plantSoil} from '../organisms.js';
import {terrain} from '../habitat-terrain.js';
import {sampleLab} from './labs.js';
import {clamp,ramp,ecologyDisplay} from './visual-state.js';
const colors=['#a47eb1','#dab889','#bd8b91'];
function location(i,n,r=3.8){const a=i*2.399;return [Math.cos(a)*Math.sqrt((i+.5)/n)*r,Math.sin(a)*Math.sqrt((i+.5)/n)*r];}
function fish(parent){
 const g=group(parent);organic(g,[0,0,0],[.35,.13,.09],'#b6b6a1',{roughness:.02,kind:'atom'});
 const tail=new THREE.BufferGeometry();tail.setAttribute('position',new THREE.Float32BufferAttribute([-.28,0,0,-.51,.19,0,-.51,-.19,0],3));tail.computeVertexNormals();mesh(g,tail,surface('#7a968d'));
 for(const z of [-.08,.08])ball(g,[.2,.045,z],.018,'#273d32','atom');return g;
}
export function makeEcologyLesson(kind,visual){
 const supported=['food-web','growth','habitat','plant','reaction-norm','population','population-pair','distribution'];
 if(!supported.includes(visual))return false;
 const root=this.root,world=group(root),updates=[];world.rotation.set(.26,-.16,0);
 let bounds=new THREE.Box3(new THREE.Vector3(-5.5,-3,-5.5),new THREE.Vector3(5.5,4,5.5));
 const label=(text,p,visibleWhen)=>{const v=new THREE.Vector3(...p).applyEuler(world.rotation);this.annotation(text,v.toArray(),{processOnly:true,visibleWhen});return this.annotations.at(-1).element;};
 const finish=()=>{this.processRig={bounds,lighting:'habitat',visualFamily:`ecology-${kind}`,cameraScale:.97,update:s=>{const state=s||sampleLab(kind,0);updates.forEach(f=>f(state));}};this.processRig.update(null);return true;};
 if(visual==='plant'||visual==='reaction-norm'){
  world.rotation.set(.05,-.18,0);bounds=new THREE.Box3(new THREE.Vector3(-2.9,-1.5,-1.8),new THREE.Vector3(2.9,4,1.8));
  const specimens=visual==='plant'?[plant(world,0,0,1,colors[0],true)]:[plant(world,-1.1,0,.8,colors[0]),plant(world,1.1,0,.8,colors[1])];
  plantSoil(world);const sun=ball(world,[2.1,3.1,-.2],.24,'#e8ca77','glow',{emissive:'#e8ca77',emissiveIntensity:.25});
  const roots=specimens.map(p=>p.children[0]);
  // Curve each shoot's geometry around its fixed root. Cloning protects the
  // shared anatomical meshes used by Zoom Out and other cached lesson views.
  const bendParts=[];
  if(visual==='plant')for(const o of roots[0].children){
   if(o.isMesh){o.geometry=o.geometry.clone();bendParts.push({o,base:o.geometry.attributes.position.array.slice(),pos:o.position.clone(),q:o.quaternion.clone()});}
   else bendParts.push({o,pos:o.position.clone(),q:o.quaternion.clone()});
  }
  const status=label('',[0,3.7,.5]);
  updates.push(s=>{
   if(visual==='plant'){
    const bend=s.bend/2.4;
    for(const {o,base,pos,q}of bendParts){
     o.position.copy(pos);o.quaternion.copy(q);
     if(base){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const y=base[i*3+1];a.setXYZ(i,base[i*3]+bend*Math.max(0,y)**2,y,base[i*3+2]);}a.needsUpdate=true;o.geometry.computeVertexNormals();}
     o.position.x+=bend*Math.max(0,pos.y)**2;o.rotateZ(-2*bend*Math.max(0,pos.y));
    }
    sun.visible=s.condition!=='uniform';status.textContent=`Fixed roots · shoot bends ${s.value.toFixed(0)}° toward the cue`;
   }else{specimens.forEach((p,i)=>p.scale.setScalar(.35+(i?s.b:s.a)*.085));status.textContent=`Same treatment · genotype A ${s.a.toFixed(1)} / B ${s.b.toFixed(1)}`;}
  });return finish();
 }
 if(kind==='resistance'){
  mesh(world,new THREE.CylinderGeometry(4.5,4.5,.16,72),surface('#bed0c1','water',{opacity:.38}),[0,0,0]);
  const organisms=Array.from({length:2},(_,v)=>Array.from({length:30},(_,i)=>{const [x,z]=location(i,30,3.8),g=group(world,[x,.17,z]);g.rotation.y=i*2.399;const body=mesh(g,new THREE.CapsuleGeometry(.095,.28,5,16),surface(v?'#c3a06b':'#638776'));body.rotation.z=Math.PI/2;path(g,[[-.22,0,0],[-.35,.04,.08],[-.5,0,-.03],[-.67,.03,.05]],.009,v?'#c3a06b':'#638776');return g;}));
  const status=label('',[0,2.4,0]);label('Green: resistant · gold: susceptible',[0,.1,4]);
  updates.push(s=>{const counts=ecologyDisplay(kind,s).counts;organisms.forEach((items,v)=>items.forEach((g,i)=>{g.visible=v===0?i<counts[0]:i>=counts[0];g.rotation.y=i*2.399+.03*Math.sin(s.t*8+i);}));status.textContent=`Generation ${s.generation} · resistance frequency ${s.p.toFixed(2)}`;});return finish();
 }
 terrain(world);groundCover(world,4.6,4,true);
 if(kind==='drift'){
  const alleleColors=['#638776','#c3a06b'],markers=[];
  for(let i=0;i<20;i++){const [x,z]=location(i,20,3.7);plant(world,x,z,.43,'#c4bfc0');for(const side of [-1,1]){const m=ball(world,[x+side*.1,.3,z+.2],.08,alleleColors[0],'atom');m.material=m.material.clone();markers.push(m);}}
  const status=label('',[0,3.1,0]);label('20 paired samples · green A / gold a',[0,.1,4.2]);
  updates.push(s=>{const copies=Math.round(s.p*40);markers.forEach((m,i)=>m.material.color.set(alleleColors[(i*17)%40<copies?0:1]));status.textContent=`Population ${s.population} · generation ${s.generation} · p = ${s.p.toFixed(2)}`;});return finish();
 }
 if(visual==='growth'){
  const animals=Array.from({length:40},(_,i)=>{const a=rabbit(world,'#a38c72',i<2),[x,z]=location(i,40);a.position.set(x,.09,z);a.rotation.y=i*2.399;return a;});
  const food=Array.from({length:12},(_,i)=>{const [x,z]=location(i,12,4.4);return plant(world,x,z,.36,colors[i%3]);});
  const status=label('',[0,3.05,0]);label('1 rabbit ≈ 20 individuals',[0,-.25,4.4]);
  updates.push(s=>{const d=ecologyDisplay(kind,s);animals.forEach((a,i)=>{a.visible=i<d.rabbits;const [x,z]=location(i,40);a.position.set(x+.06*Math.sin(s.t*6+i),.09,z+.06*Math.cos(s.t*5+i));a.rotation.y=i*2.399+.14*Math.sin(s.t*8+i);});food.forEach((f,i)=>f.visible=kind!=='logistic'||s.capacity>200||i<5);status.textContent=`N ≈ ${s.value.toFixed(0)}${s.capacity?` · K = ${s.capacity}`:''} · time ${s.time.toFixed(1)}`;});return finish();
 }
 if(visual==='food-web'){
  const plants=Array.from({length:10},(_,i)=>plant(world,-2.6+(i%3)*.45,-1.4+Math.floor(i/3)*.65,.62,colors[i%3]));
  const herbivores=Array.from({length:8},(_,i)=>{const a=rabbit(world,'#a38c72',i<2);a.position.set(-.25+(i%2)*.6,.1,-1.3+Math.floor(i/2)*.85);a.rotation.y=.6;return a;});
  const predators=Array.from({length:2},(_,i)=>{const a=fox(world,'#ad7042',true);a.position.set(2.7,.1,-.65+i*1.8);a.rotation.y=.5;return a;});
  const routes=group(world);
  const arrows=[path(routes,[[-1.5,1.2,1.8],[-.9,1.5,1.8],[.15,1.1,1.8]],.025,'#b49455'),path(routes,[[.8,1.1,1.8],[1.6,1.45,1.8],[2.55,1.1,1.8]],.025,'#b49455')];
  for(const [x,y]of [[.15,1.1],[2.55,1.1]]){rod(routes,[x-.2,y+.14,1.8],[x,y,1.8],.025,'#b49455');rod(routes,[x-.2,y-.1,1.8],[x,y,1.8],.025,'#b49455');}
  const dots=Array.from({length:20},()=>ball(world,[0,0,0],.055,'#e5c46a','glow',{emissive:'#b69a40',emissiveIntensity:.2}));
  const secondary=Array.from({length:4},()=>ball(world,[0,0,0],.055,'#e5c46a','glow',{emissive:'#b69a40',emissiveIntensity:.2}));
  label('Producers',[-2.5,2.3,0]);label('Herbivores',[.2,2.3,0]);label('Predators',[2.8,2.3,0]);
  const status=label('',[0,-.15,4.4]);
  updates.push(s=>{
   const d=kind==='community'?ecologyDisplay(kind,s):{rabbits:3,foxes:1,shoots:10};plants.forEach((p,i)=>p.visible=i<d.shoots);herbivores.forEach((a,i)=>{a.visible=i<d.rabbits;a.rotation.y=.6+.18*Math.sin(s.t*8+i);});predators.forEach((a,i)=>{a.visible=i<d.foxes;a.rotation.y=.5+.12*Math.sin(s.t*6+i);});
   dots.forEach((p,i)=>{p.visible=kind==='energy-flow'&&i<(s.distribution[1]/100);const u=(s.t*2+i/20)%1;p.position.set(-1.5+1.65*u,1.2+.3*Math.sin(u*Math.PI),1.8);});routes.visible=kind==='energy-flow';secondary.forEach((p,i)=>{p.visible=kind==='energy-flow'&&i<(s.distribution[2]/100);const u=(s.t*2+i/4)%1;p.position.set(.8+1.75*u,1.1+.35*Math.sin(u*Math.PI),1.8);});
   if(kind==='energy-flow')status.textContent=`${(s.efficiency*100).toFixed(0)}% transfer per trophic step`;
   else status.textContent=`Predators ${s.predator} → herbivores ${s.herbivore.toFixed(0)} → plant biomass ${s.plant.toFixed(0)}%`;
  });return finish();
 }
 if(kind==='disturbance'){
  const water=organic(world,[0,.42,0],[3.8,.38,3.4],'#699d9b',{kind:'water',opacity:.57,roughness:.01});
  const algae=Array.from({length:40},(_,i)=>{const [x,z]=location(i,40,3.1);return organic(world,[x,.8,z],[.2,.035,.13],'#648b43',{kind:'leaf',detail:16});});
  const detritus=Array.from({length:24},(_,i)=>{const [x,z]=location(i,24,2.9);return organic(world,[x,.2,z],[.12,.04,.1],'#88714c',{kind:'soil',detail:12});});
  const microbes=Array.from({length:16},(_,i)=>{const [x,z]=location(i,16,2.5);return organic(world,[x,.25,z],[.07,.04,.04],'#ad9387',{detail:12});});
  const oxygen=Array.from({length:24},()=>ball(world,[0,0,0],.048,'#abd8e3','atom'));
  const swimmers=Array.from({length:3},(_,i)=>{const f=fish(world);f.position.set(-1.3+i*1.2,.48,.5-i*.7);return f;});
  const nutrients=Array.from({length:8},()=>ball(world,[0,0,0],.06,'#d5b56d','atom'));
  for(let i=0;i<6;i++)plant(world,-3.8+i*.6,-2.6,.55,colors[0]);
  const status=label('',[0,3.4,.2]);label('Decomposers',[-1.7,.3,3],s=>s?.t>.3);label('O₂',[2.2,.95,2.7]);
  updates.push(s=>{
   const d=ecologyDisplay(kind,s);algae.forEach((a,i)=>a.visible=i<d.algae);detritus.forEach((a,i)=>{a.visible=i<d.detritus;a.position.y=.2+.4*(1-ramp(s.t,.3,1));});microbes.forEach((a,i)=>a.visible=i<d.detritus*.65);
   oxygen.forEach((o,i)=>{o.visible=i<d.oxygen;const [x,z]=location(i,24,3);o.position.set(x+.025*Math.sin(s.t*8+i),.5+.09*Math.sin(i*2.4),z);});
   nutrients.forEach((n,i)=>{n.visible=s.t<.25&&i<(s.condition==='enriched'?8:3);n.position.set(-1.1+i*.25,2.5-2*ramp(s.t,0,.25),-.4);});
   swimmers.forEach((f,i)=>{f.position.x=-1.3+i*1.2+.2*Math.sin(s.t*7+i);f.rotation.y=.2*Math.sin(s.t*4+i);});
   status.textContent=`Algae ${s.algae.toFixed(0)} · decomposition ${s.decomposition.toFixed(0)} · O₂ index ${s.value.toFixed(0)}`;
  });return finish();
 }
 if(kind==='biodiversity'){
  const patches=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>plant(world,(i-1)*2.2+(j-1)*.45,(j-1)*1.1,.7,colors[i])));
  const uniform=Array.from({length:9},(_,i)=>plant(world,(i%3-1)*2.2+(Math.floor(i/3)-1)*.45,(Math.floor(i/3)-1)*1.1,.7,colors[0]));
  const status=label('',[0,3.15,.1]);label('Same initial function · different response traits',[0,-.1,4.2]);
  updates.push(s=>{patches.forEach((ps,i)=>ps.forEach(p=>{p.visible=s.diverse;p.scale.setScalar(.7*Math.cbrt(s.contributors[i]));}));uniform.forEach(p=>{p.visible=!s.diverse;p.scale.setScalar(.7*Math.cbrt(s.contributors[0]));});status.textContent=`${s.t<.3?'Before disturbance':s.t<.6?'Disturbance':'Recovery'} · function ${s.value.toFixed(0)}%`;});return finish();
 }
 // Evolution uses the same detailed flowering plants as the explorer. Each
 // generation changes representation, never a phenotype recoloring in place.
 const paired=visual==='population-pair',slots=paired?32:30;
 const cohorts=Array.from({length:3},(_,variant)=>Array.from({length:slots},(_,i)=>{
  let [x,z]=location(paired?i%16:i,paired?16:30,paired?1.65:3.8);if(paired)x+=i<16?-2.35:2.35;
  return plant(world,x,z,.43,['#638776','#c3a06b','#a68aab'][variant]);
 }));
 const status=label('',[0,3.1,.1]);
 if(paired){path(world,[[0,.1,-4.6],[0,.2,0],[0,.1,4.6]],.12,'#8f8b72','soil');label('Population A',[-2.3,2.3,-1]);label('Population B',[2.3,2.3,-1]);}
 label(kind==='selection'?'AA: green · Aa: gold · aa: purple':'Representative cohort · colors match the diagram',[0,-.1,4.4]);
 updates.push(s=>{
  const d=ecologyDisplay(kind,s),counts=paired?[d.left,d.right]:[d.counts];
  cohorts.forEach((ps,variant)=>ps.forEach((p,i)=>{const side=paired&&i>=16?1:0,index=paired?i%16:i,ds=counts[side],start=ds.slice(0,variant).reduce((a,b)=>a+b,0);p.visible=index>=start&&index<start+(ds[variant]||0);}));
  status.textContent=paired?`Generation ${Math.floor(s.t*12)} · frequency difference ${s.value.toFixed(2)}`:kind==='variation'?`${s.value.toFixed(0)} / 100 survive the disturbance`:s.generation!==undefined?`Generation ${s.generation} · allele frequency ${s.p.toFixed(2)}`:'Inherited trait classes · differential representation';
 });return finish();
}
