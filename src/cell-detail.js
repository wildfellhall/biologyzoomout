import * as THREE from 'three';
import {ball,rod,path,mesh,surface,group,tag,sharedGeometries} from './surfaces.js';
import {markFeature} from './field-notes.js';
const TAU=Math.PI*2;
const grainGeometry=new THREE.IcosahedronGeometry(1,1);sharedGeometries.add(grainGeometry);
export function granules(parent,points,color,size=.025){
 const inst=new THREE.InstancedMesh(grainGeometry,surface(color,'atom',{roughness:.6}),points.length),dummy=new THREE.Object3D();
 points.forEach((p,i)=>{dummy.position.set(...p);dummy.scale.setScalar(size*(.65+(i%7)/10));dummy.rotation.set(i*.8,i*.3,i);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});
 inst.instanceMatrix.needsUpdate=true;inst.castShadow=false;inst.receiveShadow=true;parent.add(inst);return inst;
}
export function cellInterior(parent,plant){
 const points=[];
 for(let i=0;i<900;i++){
  const x=Math.sin(i*127.1)*2.88,y=Math.sin(i*311.7)*1.98,z=-.8+(Math.sin(i*63.8)+1)*.64;
  if(x*x/8.3+y*y/4>1)continue;
  const nx=plant?-1.75:-.95,ny=.55,nr=plant?.76:1.02;
  if((x-nx)**2+(y-ny)**2<nr*nr)continue;
  if(plant&&((x-.65)/1.5)**2+((y+.1)/1.45)**2<1)continue;
  points.push([x,y,z]);
 }
 markFeature(granules(parent,points,'#b4b7a1',.018),'cytoplasm');
 const cortex=group(parent);
 for(let k=0;k<6;k++){
  const pts=Array.from({length:81},(_,i)=>{const a=i/80*TAU,r=1-k*.012,c=Math.cos(a),s=Math.sin(a);return [plant?Math.sign(c)*Math.abs(c)**.25*2.98*r:c*2.97*r,plant?Math.sign(s)*Math.abs(s)**.25*1.7*r:s*2.12*r,-.25+k*.065+.025*Math.sin(a*17)];});
  path(cortex,pts,.008,k%2?'#b99b7e':'#c2b88e');
 }
 markFeature(cortex,'cortex');
 if(plant){
  for(const side of [-1,1]){
   const fibers=group(parent);
   for(let i=0;i<12;i++)path(fibers,[[side*3.12,-1.65+i*.29,-1.12],[side*3.15,-1.52+i*.27,-.65],[side*3.1,-1.35+i*.24,-.05]],.012,i%2?'#bac484':'#718447');
   markFeature(fibers,'cellulose');
   for(let i=0;i<4;i++){
    const channel=group(parent,[side*3.1,-1.1+i*.7,-.32]);
    const tube=mesh(channel,new THREE.CylinderGeometry(.055,.055,.29,12,1,true),surface('#b4c595'));
    tube.rotation.z=Math.PI/2;rod(channel,[-.17,0,0],[.17,0,0],.016,'#7a8d64');markFeature(channel,'plasmodesmata');
   }
  }
 }else{
  const heads=[],inner=[],rim=group(parent);
  for(let i=0;i<180;i++){const a=i/180*TAU,c=Math.cos(a),s=Math.sin(a);heads.push([c*3.19,s*2.34,.012]);inner.push([c*3.09,s*2.24,.012]);if(i%2===0)rod(rim,[c*3.17,s*2.32,.01],[c*3.11,s*2.26,.01],.009,'#bfaf82');}
  tag(granules(rim,heads,'#b9bd9c',.035),'membrane','Plasma membrane');tag(granules(rim,inner,'#a4b5a4',.032),'membrane','Plasma membrane');tag(rim,'membrane','Plasma membrane');
  const sugars=group(parent);
  for(let i=0;i<15;i++){
   const a=i/15*TAU,c=Math.cos(a),s=Math.sin(a),base=[c*3.16,s*2.31,-.04],tip=[c*3.43,s*2.59,-.015];
   rod(sugars,base,tip,.012,'#94a3a0');
   for(let j=0;j<3;j++){const p=[tip[0]+Math.sin(a+j)*.07,tip[1]+Math.cos(a+j)*.07,tip[2]+j*.04];rod(sugars,tip,p,.009,'#b8a08f');ball(sugars,p,.036,j%2?'#a8b0c3':'#c8ad9b','atom');}
  }
  markFeature(sugars,'glycocalyx');
 }
}
export function nuclearDetail(parent){
 const dots=[];for(let i=0;i<110;i++){const a=i*2.4,r=Math.sqrt(i/110)*.78;dots.push([Math.cos(a)*r,Math.sin(a)*r,-.48+Math.sin(i)*.11]);}
 tag(granules(parent,dots,'#a895ba',.013),'chromatin','Chromatin','APBIO-6.1-01');
 for(let i=0;i<10;i++){
  const a=i/10*TAU,c=Math.cos(a),s=Math.sin(a);
  const pore=group(parent,[c*.94,s*.94,-.16]);pore.lookAt(new THREE.Vector3(c*2,s*2,-.1));
  for(let n=0;n<8;n++){const b=n/8*TAU;ball(pore,[Math.cos(b)*.064,Math.sin(b)*.064,0],[.018,.018,.028],'#d9c4a0','atom');}
  tag(pore,'nuclear-pore','Nuclear pore','APBIO-6.3-03');
 }
}
export function microtubuleNetwork(parent){
 const g=group(parent),origin=[.7,.1,.45];
 for(let i=0;i<12;i++){
  const a=i/12*TAU,end=[Math.cos(a)*2.7,Math.sin(a)*1.8,-.45],pts=[origin,[origin[0]*.5+end[0]*.45,origin[1]*.5+end[1]*.45,-1.05],end];
  path(g,pts,.018,i%2?'#829d9d':'#b9a477');
 }
 markFeature(g,'microtubules');return g;
}
