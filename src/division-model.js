import * as THREE from 'three';
import {ball,rod,organic,group,mesh,surface} from './surfaces.js';
import {divisionState} from './division-state.js';
const originColors=['#578f88','#c77f6d'],gold='#b69c62';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=(t,a,b)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
function strandPart(parent,from,to,color){
 const geometry=new THREE.CylinderGeometry(.073,.073,to-from,12,24,false);
 const base=geometry.attributes.position.array.slice();
 const object=mesh(parent,geometry,surface(color,'membrane',{roughness:.42,clearcoat:.25}).clone());
 return {object,update(c,s){
  const a=geometry.attributes.position,condense=s.condensation;
  for(let i=0;i<a.count;i++){
   const x=base[i*3],v=base[i*3+1]+(from+to)/2,z=base[i*3+2],bend=(c.sister?1:-1)*.24*Math.abs(v)+c.lean*Math.abs(v)*2;
   const cross=c.exchange>0&&c.exchange<1?(c.homolog?-1:1)*.34*Math.sin(c.exchange*Math.PI)*Math.max(0,v*2):0;
   const coilX=.19*Math.sin(v*11+c.id),coilZ=.12*Math.cos(v*13+c.id),radius=(.48+.52*condense)*(1+.1*Math.sin(v*58+c.id));
   a.setXYZ(i,x*radius+condense*bend+(1-condense)*coilX+cross,v*c.length,z*radius+(1-condense)*coilZ);
  }
  a.needsUpdate=true;geometry.computeVertexNormals();
  object.material.color.set(originColors[c.homolog]);
  if(from>0)object.material.color.lerp(new THREE.Color(originColors[1-c.homolog]),c.exchange);
  object.material.opacity=c.opacity;object.material.transparent=c.opacity<1;object.material.depthWrite=c.opacity>=1;
 }};
}
function membrane(parent){
 const g=group(parent),geometry=new THREE.SphereGeometry(1,48,32),base=geometry.attributes.position.array.slice();
 mesh(g,geometry,surface('#a7b9a2','membrane',{opacity:.11,roughness:.23,clearcoat:.5,depthWrite:false}));
 const outlineGeometry=new THREE.BufferGeometry();outlineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(96*3),3));
 const outline=new THREE.LineLoop(outlineGeometry,new THREE.LineBasicMaterial({color:'#829d85',transparent:true,opacity:.6}));g.add(outline);
 return {g,update(position,scale,pinch=0,axis=0){
  g.position.set(...position);const a=geometry.attributes.position;
  const distort=(x,y,z)=>{const central=axis===0?x:y,f=1-.96*pinch*Math.exp(-central*central/ .10);return [x*scale[0]*(axis===1?f:1),y*scale[1]*(axis===0?f:1),z*scale[2]*f];};
  for(let i=0;i<a.count;i++)a.setXYZ(i,...distort(base[i*3],base[i*3+1],base[i*3+2]));
  a.needsUpdate=true;geometry.computeVertexNormals();
  const line=outlineGeometry.attributes.position;for(let i=0;i<96;i++){const angle=i/96*Math.PI*2;line.setXYZ(i,...distort(Math.cos(angle),Math.sin(angle),0));}line.needsUpdate=true;
 }};
}
function centrosome(parent){
 const g=group(parent);ball(g,[0,0,0],.1,gold,'atom');
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2;rod(g,[Math.cos(a)*.07,-.14,Math.sin(a)*.07],[Math.cos(a)*.07,.14,Math.sin(a)*.07],.018,gold,'atom');}
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;rod(g,[0,0,0],[Math.cos(a)*.28,Math.sin(a)*.28,.07*Math.sin(i)],.008,'#c4b17b','atom');}
 return g;
}
function spindle(parent){
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(3*9*2*3),3));
 const lines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:gold,transparent:true,opacity:.8}));parent.add(lines);
 return {lines,update(a,b){const p=geometry.attributes.position;let index=0;for(let strand=0;strand<3;strand++)for(let j=0;j<9;j++)for(const u of [j/9,(j+1)/9]){const bow=Math.sin(u*Math.PI)*(strand-1)*.055;p.setXYZ(index++,a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u+bow,a[2]+(b[2]-a[2])*u+bow);}p.needsUpdate=true;}};
}
export function makeDivisionModel(kind){
 const root=this.root,meiotic=kind==='meiosis';
 const cells=Array.from({length:meiotic?7:3},()=>membrane(root));
 const nuclei=Array.from({length:meiotic?7:3},()=>organic(root,[0,0,0],[1,1,.62],'#b9abc4',{opacity:.13,roughness:.025,detail:32}));
 const poles=Array.from({length:4},()=>centrosome(root));
 const chromatids=Array.from({length:8},(_,id)=>{
  const g=group(root),color=originColors[Math.floor(id/2)%2];
  const lower=strandPart(g,-.5,.18,color),distal=strandPart(g,.18,.5,color),kinetochore=ball(g,[0,0,.085],.065,gold,'atom');
  return {g,lower,distal,kinetochore,fiber:spindle(root)};
 });
 const cohesions=Array.from({length:4},()=>rod(root,[0,0,0],[.2,0,0],.035,'#a796b2','atom'));
 const crossover=rod(root,[0,0,0],[.2,0,0],.025,'#d2b66c','atom');
 const labels=Array.from({length:meiotic?4:2},()=>{this.annotation('',[0,0,0],{processOnly:true,visibleWhen:s=>s?.divisionCount>0});return this.annotations.at(-1);});
 const spindleLabel=(()=>{this.annotation('Spindle microtubules',[0,1.8,0],{processOnly:true,visibleWhen:s=>s?.spindle>.5&&s?.divisionCount===0});return this.annotations.at(-1);})();
 const moveRod=(object,a,b,r)=>{const start=new THREE.Vector3(...a),d=new THREE.Vector3(...b).sub(start);object.position.copy(start).addScaledVector(d,.5);object.scale.set(r,Math.max(.001,d.length()),r);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());};
 const rig={bounds:new THREE.Box3(new THREE.Vector3(-3.5,-2.7,-1.2),new THREE.Vector3(3.5,2.7,1.2)),update:snapshot=>{
  const s=snapshot?.chromatids?snapshot:divisionState(kind,0),t=s.arrested?.49:s.t;
  rig.cameraScale=.78+.18*ease(t,meiotic?.5:.72,meiotic?.64:.96);
  cells.forEach(c=>c.g.visible=false);nuclei.forEach(n=>n.visible=false);
  const showCell=(index,p,size,pinch=0,axis=0)=>{cells[index].g.visible=true;cells[index].update(p,size,pinch,axis);};
  const showNucleus=(index,p,size,amount=s.envelope)=>{const n=nuclei[index];n.visible=amount>.01;n.position.set(...p);n.scale.set(size[0],size[1],size[2]);n.material.opacity=.13*amount;};
  if(s.divisionCount===0){
   showCell(0,[0,0,0],[2.45+.7*s.membraneI,2.12-.22*s.membraneI,.95],s.membraneI);
   if(t<(meiotic?.54:.72))showNucleus(0,[0,0,0],[1.5,1.65,.85]);
   else for(let side=0;side<2;side++)showNucleus(side+1,[side?1.7:-1.7,0,0],[1.04,1.2,.72]);
  }else if(!meiotic||s.divisionCount===1){
   for(let side=0;side<2;side++){
    const x=side?1.7:-1.7,pinch=meiotic?s.membraneII:0;
    showCell(side+1,[x,0,0],[1.43,1.85+.5*pinch,.85],pinch,1);
    if(!meiotic||t<.91)showNucleus(side+1,[x,0,0],[1.02,1.2,.72]);
    else for(let sister=0;sister<2;sister++)showNucleus(3+side*2+sister,[x,sister?-1.22:1.22,0],[.86,.7,.6]);
   }
  }else for(let side=0;side<2;side++)for(let sister=0;sister<2;sister++){
   const index=3+side*2+sister,p=[side?1.7:-1.7,sister?-1.22:1.22,0];showCell(index,p,[1.43,1.12,.72]);showNucleus(index,p,[.86,.7,.6]);
  }
  const spindleII=meiotic&&t>=.68;
  const polePositions=spindleII?[[-1.7,1.56,0],[-1.7,-1.56,0],[1.7,1.56,0],[1.7,-1.56,0]]:[[-2.1*ease(t,.18,.32),1.5*(1-ease(t,.18,.32)),0],[2.1*ease(t,.18,.32),1.5*(1-ease(t,.18,.32)),0]];
  poles.forEach((p,i)=>{p.visible=i<polePositions.length&&s.spindle>.02;if(p.visible)p.position.set(...polePositions[i]);});
  for(const c of s.chromatids){
   const part=chromatids[c.id];part.g.visible=c.visible;part.g.position.set(...c.position);part.g.rotation.z=spindleII?-Math.PI/2:0;
   part.lower.update(c,s);part.distal.update(c,s);part.kinetochore.visible=s.condensation>.4;
   const pole=spindleII?c.product:meiotic?Math.floor(c.product/2):c.sister;
   part.fiber.lines.visible=c.visible&&s.spindle>.2&&s.replication===1&&s.envelope<.15&&!(s.condition==='blocked'&&c.id===7);
   if(part.fiber.lines.visible)part.fiber.update(polePositions[pole],c.position);
  }
  cohesions.forEach((object,i)=>{const a=s.chromatids[i*2],b=s.chromatids[i*2+1];object.visible=s.replicated&&!a.separated;moveRod(object,a.position,b.position,.035);});
  crossover.visible=meiotic&&s.crossing>0&&t<.42;
  if(crossover.visible){const a=s.chromatids[1].position.slice(),b=s.chromatids[2].position.slice();a[1]+=.32;b[1]+=.32;moveRod(crossover,a,b,.025);}
  spindleLabel.position.set(0,1.8,0);
  labels.forEach((label,i)=>{
   const cell=s.cells[i];label.visibleWhen=()=>!!cell&&s.divisionCount>0;
   if(cell){const side=s.divisionCount===2?Math.floor(i/2):i;label.position.set(side?1.7:-1.7,s.divisionCount===2?(i%2?-2.35:.12):-1.6,0);label.element.textContent=`${cell.chromosomes} chromosomes · ${cell.contentC===null?`${cell.dna} DNA molecules`:`${Number(cell.contentC.toFixed(1))}C`}`;}
  });
 }};
 this.processRig=rig;rig.update(null);
}
