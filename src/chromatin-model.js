import * as THREE from 'three';
import {ball,surface,group,tag} from './surfaces.js';
// A representative geometry, not atomic coordinates or a molecular-dynamics trace.
// Rendered crossbars sample the duplex; they are not a count of base pairs.
function tube(parent,count,radius,color){
 const radial=10,geometry=new THREE.BufferGeometry(),positions=new Float32Array(count*(radial+1)*3),normals=new Float32Array(positions.length),indices=[];
 for(let i=0;i<count-1;i++)for(let j=0;j<radial;j++){const a=i*(radial+1)+j,b=a+radial+1;indices.push(a,a+1,b,b,a+1,b+1);}
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3).setUsage(THREE.DynamicDrawUsage));geometry.setIndex(indices);
 const object=new THREE.Mesh(geometry,surface(color,'membrane'));object.frustumCulled=false;parent.add(object);
 const tangent=new THREE.Vector3(),u=new THREE.Vector3(),v=new THREE.Vector3(),axis=new THREE.Vector3();
 return {object,update(points){for(let i=0;i<count;i++){
  tangent.subVectors(points[Math.min(count-1,i+1)],points[Math.max(0,i-1)]).normalize();axis.set(0,Math.abs(tangent.y)>.9?0:1,Math.abs(tangent.y)>.9?1:0);u.crossVectors(tangent,axis).normalize();v.crossVectors(tangent,u);
  for(let j=0;j<=radial;j++){const a=j/radial*Math.PI*2,nx=u.x*Math.cos(a)+v.x*Math.sin(a),ny=u.y*Math.cos(a)+v.y*Math.sin(a),nz=u.z*Math.cos(a)+v.z*Math.sin(a),k=(i*(radial+1)+j)*3;positions[k]=points[i].x+nx*radius;positions[k+1]=points[i].y+ny*radius;positions[k+2]=points[i].z+nz*radius;normals[k]=nx;normals[k+1]=ny;normals[k+2]=nz;}
 }geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;}};
}
function bead(parent,scale=1){
 const g=group(parent,[0,0,0],scale),n=132;
 const colors=['#a889a3','#c2a3b6','#b297ba','#957d9c'];
 for(let i=0;i<8;i++){const a=i%4/4*Math.PI*2+(i>3?.45:0);ball(g,[Math.cos(a)*.45,(i<4?-.21:.21),Math.sin(a)*.45],[.5,.32,.47],colors[i%4],'membrane',{roughness:.62});}
 const strands=[tube(g,n,.035,'#d3b579'),tube(g,n,.035,'#7da99d')];
 for(const strand of strands)tag(strand.object,'dna','DNA duplex','APBIO-6.1-01');
 const pairGeometry=new THREE.CylinderGeometry(.018,.018,1,5),pairs=new THREE.InstancedMesh(pairGeometry,surface('#d8c7a2','atom'),44);pairs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);pairs.frustumCulled=false;g.add(pairs);
 const points=[Array.from({length:n},()=>new THREE.Vector3()),Array.from({length:n},()=>new THREE.Vector3())],dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3(),mid=new THREE.Vector3();
 let last=-1;
 function update(exposure){
  if(Math.abs(exposure-last)<.0001)return;last=exposure;
  for(let i=0;i<n;i++){
   const u=i/(n-1),a=(u-.5)*Math.PI*3.3,loose=Math.max(0,(Math.abs(u-.5)-.26)/.24),radius=1.08+exposure*loose*loose*.9;
   for(let strand=0;strand<2;strand++){const twist=u*Math.PI*28+strand*Math.PI,r=radius+Math.cos(twist)*.075;points[strand][i].set(Math.cos(a)*r,(u-.5)*.82+Math.sin(twist)*.075,Math.sin(a)*r);}
  }
  strands.forEach((s,i)=>s.update(points[i]));
  for(let j=0;j<44;j++){const i=j*3,a=points[0][i],b=points[1][i];direction.subVectors(b,a);mid.addVectors(a,b).multiplyScalar(.5);dummy.position.copy(mid);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(1,direction.length(),1);dummy.updateMatrix();pairs.setMatrixAt(j,dummy.matrix);}
  pairs.instanceMatrix.needsUpdate=true;
 }
 update(0);return {g,update,ends:()=>[points[0][0].clone().multiplyScalar(scale).add(g.position),points[0].at(-1).clone().multiplyScalar(scale).add(g.position)]};
}
export function makeNucleosome(){
 const model=bead(this.root,1);
 this.annotation('Histone core',[0,.8,0],'APBIO-6.1-01');this.annotation('DNA duplex',[1.25,-.5,.1],'APBIO-6.1-01');
 this.processRig={cameraScale:.88,bounds:new THREE.Box3(new THREE.Vector3(-2.2,-1.2,-2.2),new THREE.Vector3(2.2,1.2,2.2)),update(s){model.update(s?.exposure||0);}};
}
export function makeChromatin(){
 const beads=Array.from({length:7},()=>bead(this.root,.36));
 const links=Array.from({length:6},()=>[tube(this.root,24,.018,'#d3b579'),tube(this.root,24,.018,'#7da99d')]);
 const points=Array.from({length:24},()=>new THREE.Vector3());let last=-1;
 this.annotation('Nucleosomes',[0,1.45,0],'APBIO-6.1-01');
 this.processRig={cameraScale:.88,bounds:new THREE.Box3(new THREE.Vector3(-4,-2,-2),new THREE.Vector3(4,2,2)),update(s){
  const compact=s?.compaction||0;if(Math.abs(last-compact)<.0001)return;last=compact;
  beads.forEach((b,i)=>{const a=i*2.3;const open=new THREE.Vector3((i-3)*1.02,Math.sin(i*.8)*.25,Math.cos(i*.8)*.2),fold=new THREE.Vector3(Math.cos(a)*.85,(i-3)*.38,Math.sin(a)*.85);b.g.position.copy(open.lerp(fold,compact));});
  for(let i=0;i<6;i++){const a=beads[i].ends()[1],b=beads[i+1].ends()[0];for(let strand=0;strand<2;strand++){for(let j=0;j<24;j++){const u=j/23;points[j].copy(a).lerp(b,u);points[j].y+=Math.sin(u*Math.PI)*.16+(strand?-.025:.025);points[j].z+=Math.sin(u*Math.PI*6+strand*Math.PI)*.025;}links[i][strand].update(points);}}
 }};this.processRig.update(null);
 for(const b of beads)tag(b.g,'nucleosome','Nucleosome','APBIO-6.1-01');
}
