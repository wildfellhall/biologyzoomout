import * as THREE from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {group,mesh,surface,ball,rod,organic,path as tube,cloneForView} from '../surfaces.js';
import {glyph} from './glyphs.js';
const loader=new SVGLoader();
const bankX=i=>([2,0,3,1].indexOf(i)-1.5)*1.5;
const position=point=>[(point[0]-320)/100,(180-point[1])/100,0];
function makePiece(parent,shape){
 const g=group(parent);
 if(shape==='water'){
  ball(g,[0,-.08,0],.23,'#ba7569','atom');for(const sign of [-1,1]){ball(g,[sign*.25,.15,0],.14,'#e4e5d5','atom');rod(g,[0,-.08,0],[sign*.25,.15,0],.065,'#bca36b','atom');}return g;
 }
 if(shape==='helix'){
  const points=Array.from({length:70},(_,i)=>[Math.cos(i*.28)*.21,(i-34.5)*.012,Math.sin(i*.28)*.21]);tube(g,points,.055,'#82a696','atom');return g;
 }
 if(shape==='two-dna'){
  for(const x of [-.24,.24]){const dna=makePiece(g,'dna');dna.scale.setScalar(.7);dna.position.x=x;}return g;
 }
 if(shape==='dna'){
  for(let i=0;i<12;i++){const y=(i-5.5)*.065,a=i*.65,x=Math.cos(a)*.19,z=Math.sin(a)*.19;ball(g,[x,y,z],.045,'#73988a','atom');ball(g,[-x,y,-z],.045,'#b0a171','atom');rod(g,[x,y,z],[-x,y,-z],.022,'#a78a9e','atom');}return g;
 }
 if(['cell','vesicle','volume','protein','substrate','oxygen','hydrogen','ion'].includes(shape)){
  const isCell=['cell','vesicle'].includes(shape),protein=shape==='protein';
  if(protein){for(let i=0;i<8;i++){const a=i*.77;organic(g,[Math.cos(a)*.2,Math.sin(a)*.2,Math.sin(a*2)*.07],[.16,.14,.14],i%3?'#82a696':'#baa374',{roughness:.09,detail:20});}}
  else{organic(g,[0,0,0],[.4,.32,.28],shape==='oxygen'?'#ba7569':shape==='hydrogen'?'#d9dfcf':'#8cae9c',{cut:isCell,roughness:.04,detail:28});if(isCell)ball(g,[.03,0,.05],.14,'#a2869f','atom');}return g;
 }
 // Layered, beveled extrusions keep conceptual pieces readable from oblique
 // angles. These are 3D schematics, not atom-resolved molecular structures.
 const parsed=loader.parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100">${glyph(shape)}</svg>`);
 let layer=0;
 for(const p of parsed.paths){
  const style=p.userData.style,z=layer++*.008;
  if(style.fill&&style.fill!=='none')for(const s of SVGLoader.createShapes(p)){
   const geo=new THREE.ExtrudeGeometry(s,{depth:9,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:1.5,bevelThickness:1.5,curveSegments:10});
   const obj=mesh(g,geo,surface(style.fill,'atom'),[-.48,.4,z]);obj.scale.set(.008,-.008,.008);
  }
  if(style.stroke&&style.stroke!=='none')for(const sub of p.subPaths){const geo=SVGLoader.pointsToStroke(sub.getPoints(),style);if(geo){const obj=mesh(g,geo,surface(style.stroke,'atom'),[-.48,.4,.09+z]);obj.scale.set(.008,-.008,.008);}}
 }
 return g;
}
export function makeLessonPuzzle(data){
 const a=data.activity,root=this.root,pieces=new Map(),targets=new Map();
 for(const [i,slot]of a.slots.entries()){
  const pos=position(a.parts[i].point),g=group(root,pos);
  const ring=mesh(g,new THREE.TorusGeometry(.48,.018,8,48),surface('#99aa99','atom'));
  ring.material=cloneForView(ring.material);
  const hit=mesh(g,new THREE.CircleGeometry(.47,40),surface('#bac7b1','atom',{transparent:true,opacity:.16,depthWrite:false}));
  ring.userData={lessonSlot:slot.id,label:`Position ${i+1}`};hit.userData={lessonSlot:slot.id,label:`Position ${i+1}`};targets.set(slot.id,ring);
  this.annotation(String(i+1),[pos[0],pos[1]+.65,.12],{lessonSlot:slot.id,label:`Position ${i+1}`});
 }
 for(const [i,part]of a.parts.entries()){
  const g=makePiece(root,part.shape),materials=new Map();
  g.traverse(o=>{if(o.isMesh){
   o.userData={...o.userData,lessonPiece:part.id,label:part.label};
   // Selecting one piece must not recolor other pieces using the same palette.
   if(!materials.has(o.material))materials.set(o.material,cloneForView(o.material));
   o.material=materials.get(o.material);
  }});pieces.set(part.id,g);g.position.set(bankX(i),-2.6,.15);
 }
 if(a.sequence)for(let i=0;i<(a.layout==='cycle'?4:3);i++){
  const p=new THREE.Vector3(...position(a.parts[i].point)),q=new THREE.Vector3(...position(a.parts[(i+1)%4].point)),d=q.clone().sub(p).normalize();p.addScaledVector(d,.58);q.addScaledVector(d,-.58);p.z=q.z=-.12;rod(root,p.toArray(),q.toArray(),.014,'#b8c3b2');
 }
 const bound=new THREE.Box3(new THREE.Vector3(-3.25,-3.2,-.5),new THREE.Vector3(3.25,2.25,.8));
 this.processRig={bounds:bound,cameraScale:1,update(){},place(placements,selected,correct){
  for(const [i,part]of a.parts.entries()){
   const slot=a.slots.find(s=>placements[s.id]===part.id),g=pieces.get(part.id);
   g.position.set(...(slot?position(a.parts[a.slots.indexOf(slot)].point):[bankX(i),-2.6,.15]));g.position.z=.13;
   g.scale.setScalar(selected===part.id?1.14:1);
   g.traverse(o=>{if(o.material?.emissive){o.material.emissive.set(selected===part.id?'#456f50':'#000000');o.material.emissiveIntensity=.24;}});
  }
  for(const [slot,ring]of targets)ring.material.color.set(correct?(correct.includes(slot)?'#507c57':'#b35d40'):'#99aa99');
 }};
}
