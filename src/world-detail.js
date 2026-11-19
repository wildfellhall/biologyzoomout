import * as THREE from 'three';
import {mesh,ball,rod,path,organic,surface,group,sharedGeometries} from './surfaces.js';
import {markFeature} from './field-notes.js';
import {naturalMaterial} from './natural-materials.js';
const TAU=Math.PI*2;
function bladeGeometry(){
 const g=new THREE.PlaneGeometry(1,1,6,2),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const u=p.getX(i)+.5,v=p.getY(i)*2;p.setXYZ(i,u-.5,v*Math.sin(Math.PI*u)*.28,.1*Math.sin(u*Math.PI)+.04*v*v);}
 g.computeVertexNormals();return g;
}
const blade=bladeGeometry();sharedGeometries.add(blade);
export function leafCloud(parent,centers,scale=1){
 const count=centers.length*70,leaves=new THREE.InstancedMesh(blade,surface('#a1b26b','leaf',{roughness:.8}),count),dummy=new THREE.Object3D();
 for(let i=0;i<count;i++){
  const c=centers[Math.floor(i/70)],j=i%70,a=j*2.4,r=Math.sqrt(j/70)*.6;
  dummy.position.set(c[0]+Math.cos(a)*r,c[1]+Math.sin(j*8.3)*.46,c[2]+Math.sin(a)*r);dummy.rotation.set(j*.65,i*.37,i*2.4);dummy.scale.setScalar(scale*(.22+(i%4)*.035));dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color(['#7a965a','#668348','#a0b46c','#526e42'][i%4]));
 }
 leaves.instanceMatrix.needsUpdate=true;leaves.castShadow=true;leaves.receiveShadow=true;parent.add(leaves);return leaves;
}
function mushrooms(parent){
 const g=group(parent);
 for(let i=0;i<5;i++){
  const x=(i-2)*.16,y=.25+Math.sin(i)*.04,z=.12*Math.cos(i*2.4),s=.7+(i%3)*.2;
  rod(g,[x,y,z],[x,y+.22*s,z],.025,'#cab992');
  mesh(g,new THREE.SphereGeometry(1,20,12,0,TAU,0,Math.PI/2),surface(i%2?'#b28d5c':'#9b7349','soil'),[x,y+.22*s,z],[.14*s,.07*s,.14*s]);
  for(let k=0;k<9;k++){const a=k/9*TAU;rod(g,[x,y+.215*s,z],[x+Math.cos(a)*.12*s,y+.215*s,z+Math.sin(a)*.12*s],.004,'#d1be94');}
 }
 return markFeature(g,'fungi');
}
function fern(parent,x,z,scale){
 const g=group(parent,[x,.1,z],scale);
 for(let k=0;k<5;k++){
  const a=k/5*TAU,pts=[];
  for(let j=0;j<9;j++){
   const t=j/8,p=[Math.cos(a)*t*.65,Math.sin(t*Math.PI*.8)*.65,Math.sin(a)*t*.65];pts.push(p);
   if(j===0||j===8)continue;
   for(const side of [-1,1]){const frond=mesh(g,blade,surface(j%2?'#788f4c':'#98a45a','leaf'),p,[.24*(1-t)+.06,.7,.7]);frond.rotation.set(-Math.PI/2,a+side*.8,side*.3);}
  }
  path(g,pts,.009,'#9ca76a','leaf');
 }
 return g;
}
export function woodlandFloor(parent,{stream=false,full=true}={}){
 const g=group(parent),count=full?95:45,litter=new THREE.InstancedMesh(blade,surface('#b2a576','leaf',{roughness:1}),count),dummy=new THREE.Object3D();
 for(let i=0;i<count;i++){
  const a=i*2.4,r=Math.sqrt(i/count)*4.7,x=Math.cos(a)*r,z=Math.sin(a)*r;
  dummy.position.set(x,stream&&Math.abs(x-Math.sin(z*.8)*.55)<.6?-.15:.11+Math.sin(i)*.025,z);dummy.rotation.set(-Math.PI/2+.12*Math.sin(i),i*3.7,.2*Math.sin(i),'YXZ');dummy.scale.set(.10+(i%5)*.02,.24,.28);dummy.updateMatrix();litter.setMatrixAt(i,dummy.matrix);litter.setColorAt(i,new THREE.Color(['#a49c63','#b88958','#776d43','#bfab74'][i%4]));
 }
 litter.instanceMatrix.needsUpdate=true;litter.receiveShadow=true;g.add(litter);markFeature(litter,'litter');
 const log=group(g,[-2.8,.29,1.65]);log.rotation.y=.4;
 const trunk=mesh(log,new THREE.CylinderGeometry(.2,.24,1.65,18),naturalMaterial('bark'));trunk.rotation.z=Math.PI/2;
 for(const side of [-1,1]){
  const cut=mesh(log,new THREE.CircleGeometry(.2,24),surface('#b69b6b','soil'),[side*.83,0,0]);cut.rotation.y=side*Math.PI/2;
  for(const radius of [.065,.12,.17]){const ring=mesh(log,new THREE.TorusGeometry(radius,.006,4,32),surface('#7e6848'),[side*.837,0,0]);ring.rotation.y=Math.PI/2;}
 }
 markFeature(log,'litter');mushrooms(log);
 if(full){fern(g,1.5,2.7,.75);fern(g,-1.5,-2.2,1);fern(g,3.5,-.6,.6);}
 const roots=group(g);
 for(let i=0;i<9;i++){
  const x=(i-4)*.85,z=Math.sqrt(Math.max(0,24-x*x));
  path(roots,[[x,-.04,z-.06],[x+.12,-.3,z+.035],[x-.16,-.62,z-.06],[x+.03,-.9,z-.12]],.018,i%2?'#b5a079':'#8a7453','bark');
  path(roots,[[x+.12,-.3,z+.035],[x+.3,-.46,z+.025],[x+.45,-.66,z-.02]],.008,'#b5a079','bark');
 }
 markFeature(roots,'roots');
 if(stream){
  for(let i=0;i<22;i++){
   const z=(i/21-.5)*8.5,side=i%2?1:-1,x=Math.sin(z*.8)*.55+side*(.65+(i%3)*.08);
   organic(g,[x,.09,z],[.12+(i%3)*.04,.08,.11],'#99957f',{roughness:.2,kind:'soil',detail:12});
  }
 }
 return g;
}
export function leafAnatomy(parent){
 const coating=mesh(parent,new THREE.BoxGeometry(4.04,.025,2.04),surface('#b1bd7c','leaf',{roughness:.3}),[0,.965,0]);markFeature(coating,'cuticle');
 const epidermis=new THREE.Shape();epidermis.moveTo(-2,-1);epidermis.lineTo(2,-1);epidermis.lineTo(2,1);epidermis.lineTo(-2,1);epidermis.closePath();
 const opening=new THREE.Path();opening.absellipse(-.65,.7,.13,.25,0,TAU,true);epidermis.holes.push(opening);
 const lower=mesh(parent,new THREE.ExtrudeGeometry(epidermis,{depth:.08,bevelEnabled:false}),surface('#80985c','leaf'),[0,-.76,0]);lower.rotation.x=Math.PI/2;
 // A vein and a stomatal chamber are exposed on the cut face.
 const vein=group(parent,[1.25,-.1,.58]);
 for(let i=0;i<4;i++){
  const x=(i-1.5)*.15;
  const tube=mesh(vein,new THREE.CylinderGeometry(.058,.058,1.7,12,1,true),surface('#bfaa6b'));tube.rotation.x=Math.PI/2;tube.position.set(x,.15,0);
  for(let j=0;j<7;j++)mesh(vein,new THREE.TorusGeometry(.059,.007,4,12),surface('#d5c188'),[x,.15,(j-3)*.23]);
  const phloem=mesh(vein,new THREE.CylinderGeometry(.05,.05,1.7,12),surface('#8d9f68'));phloem.rotation.x=Math.PI/2;phloem.position.set(x,-.1,0);
 }
 markFeature(vein,'vascular');
 const pore=group(parent,[-.65,-.76,.7]);
 for(const side of [-1,1]){
  const points=Array.from({length:20},(_,i)=>{const a=(i/19-.5)*Math.PI;return [side*(.06+.12*Math.cos(a)),.012,Math.sin(a)*.27];});
  path(pore,points,.055,'#778e4e','leaf');
  for(let i=0;i<4;i++)ball(pore,[side*.16,.065,(i-1.5)*.11],.024,'#486e3b');
 }
 markFeature(pore,'stomata');
 for(let i=0;i<11;i++){
  const x=(i%6-2.5)*.68,z=Math.floor(i/6)*.9-.4;
  const outline=[];for(let j=0;j<=6;j++){const a=j/6*TAU;outline.push([x+Math.cos(a)*.33,.984,z+Math.sin(a)*.38]);}path(parent,outline,.008,'#92a06d','leaf');
 }
}
export function epithelialMatrix(parent){
 const fibers=group(parent);
 for(let i=0;i<18;i++)path(fibers,[[-2.45,-.76,-1.35+i*.15],[-.8,-.8+.025*Math.sin(i),-.6+i*.08],[.8,-.77,.4+i*.03],[2.45,-.76,1.3-i*.15]],.014,i%2?'#b09d9d':'#c6b3ac');
 markFeature(fibers,'matrix');
 for(let x=0;x<5;x++)for(let z=0;z<4;z++){
  const p=[(x-2)*.79,.35,(z-1.5)*.72];for(let k=0;k<3;k++)ball(parent,[p[0],p[1]-k*.07,p[2]],.035,'#c8b28d');
 }
}
