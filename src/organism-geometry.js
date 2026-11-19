import * as THREE from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {sharedGeometries} from './surfaces.js';

export const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const cache=new Map();
export function shared(key,make){if(!cache.has(key)){const g=make();sharedGeometries.add(g);cache.set(key,g);}return cache.get(key);}
export const smoothSphere=shared('organism-sphere',()=>new THREE.SphereGeometry(1,24,16));
export function tapered(points,radii,sides=8){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),steps=Math.max(12,points.length*6),frames=curve.computeFrenetFrames(steps,false),positions=[],uv=[],indices=[];
 for(let i=0;i<=steps;i++){
  const t=i/steps,c=curve.getPoint(t),r=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(r)),radius=THREE.MathUtils.lerp(radii[j],radii[j+1],r-j);
  for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2,p=c.clone().addScaledVector(frames.normals[i],Math.cos(a)*radius).addScaledVector(frames.binormals[i],Math.sin(a)*radius);positions.push(...p.toArray());uv.push(k/sides,t);}
 }
 for(let i=0;i<steps;i++)for(let k=0;k<sides;k++){const a=i*(sides+1)+k,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function merge(parts){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());return g;}
export function leafGeometry(petal=false,lengthSegments=18,widthSegments=8){
 const g=new THREE.PlaneGeometry(1,1,lengthSegments,widthSegments),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const t=p.getX(i)+.5,v=p.getY(i)*2,edge=petal?Math.sin(Math.PI*t)**.55:Math.sin(Math.PI*t)**.8;
  const width=(petal?.24:.22)*edge*(petal?1:1+.035*Math.sin(t*92));
  const envelope=Math.sin(t*Math.PI);
  p.setXYZ(i,t,v*width,.09*envelope-.06*t*t+(petal?.045:.026)*envelope*v*v+.012*Math.sin(t*5)*v*envelope);
 }
 g.computeVertexNormals();return g;
}
const bodyParts={
 rabbit:[[-.10,.23,0,.23,.185,.14],[-.185,.16,.085,.145,.145,.09],[-.185,.16,-.085,.145,.145,.09],[.075,.245,0,.13,.15,.105],[.16,.32,0,.085,.13,.078],[.238,.372,0,.116,.097,.083],[.30,.327,.025,.075,.045,.052],[.30,.327,-.025,.075,.045,.052],[.353,.335,0,.04,.029,.034],
  [.135,.135,.075,.027,.12,.025,-.22],[.135,.135,-.075,.027,.12,.025,-.22],
  [.158,.052,.083,.029,.042,.028],[.158,.052,-.083,.029,.042,.028],
  [.187,.027,.087,.069,.026,.030],[.187,.027,-.087,.069,.026,.030],
  [-.055,.028,.12,.105,.027,.047],[-.055,.028,-.12,.105,.027,.047]],
 fox:[[-.18,.32,0,.30,.12,.10],[.045,.34,0,.14,.15,.105],[.14,.43,0,.10,.15,.085],[.25,.52,0,.115,.09,.08],[.34,.485,0,.12,.044,.047]],
};
export function animalSkin(kind,detail=false){return shared(`${kind}-skin-${detail}`,()=>{
 const size=kind==='fox'?1.4:1,res=detail?96:50,effect=new MarchingCubes(res,new THREE.MeshBasicMaterial(),false,false,50000);
 effect.isolation=0;
 for(let z=0;z<res;z++)for(let y=0;y<res;y++)for(let x=0;x<res;x++){
  const px=(x/res-.5)*size,py=(y/res-.5)*size+.35,pz=(z/res-.5)*size;let d=10;
  for(const [cx,cy,cz,rx,ry,rz,angle=0] of bodyParts[kind]){
   const x=(px-cx)*Math.cos(angle)+(py-cy)*Math.sin(angle),y=-(px-cx)*Math.sin(angle)+(py-cy)*Math.cos(angle);
   const distance=(Math.hypot(x/rx,y/ry,(pz-cz)/rz)-1)*Math.min(rx,ry,rz),k=.019,h=Math.max(k-Math.abs(d-distance),0)/k;
   d=Math.min(d,distance)-h*h*k*.25;
  }
  effect.field[x+y*res+z*res*res]=-d;
 }
 effect.update();const count=effect.geometry.drawRange.count,g=new THREE.BufferGeometry();
 for(const name of ['position','normal'])g.setAttribute(name,new THREE.Float32BufferAttribute(effect.geometry.attributes[name].array.slice(0,count*3),3));
 g.scale(size/2,size/2,size/2);g.translate(0,.35,0);
 const p=g.attributes.position,colors=[],uv=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),belly=1-THREE.MathUtils.smoothstep(y,kind==='fox'?.26:.12,kind==='fox'?.35:.24),mottle=.94+.06*Math.sin(x*85+Math.sin(z*47))*Math.sin(y*71);
  colors.push(mottle*(1+.5*belly),mottle*(1+.85*belly),mottle*(1+1.1*belly));uv.push(x*2+z*.5,Math.atan2(z,y-.25)/Math.PI+1);
 }
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeBoundingBox();effect.geometry.dispose();effect.material.dispose();return g;
});}
export function coatFibers(kind){return shared(`${kind}-guard-hairs`,()=>{
 const skin=animalSkin(kind,true),p=skin.attributes.position,n=skin.attributes.normal,positions=[],colors=[];
 for(let i=0;i<30000;i++){
  const index=Math.floor(hash(i+3)*(p.count/3))*3,u=hash(i+17),v=hash(i+31)*(1-u);
  const a=new THREE.Vector3(),normal=new THREE.Vector3();
  for(let j=0;j<3;j++){const w=[u,v,1-u-v][j];a.addScaledVector(new THREE.Vector3().fromBufferAttribute(p,index+j),w);normal.addScaledVector(new THREE.Vector3().fromBufferAttribute(n,index+j),w);}
  normal.normalize();if(a.y<.04)continue;
  const direction=new THREE.Vector3(a.x>.17?1:-1,-.2,Math.sign(a.z)*.08);direction.addScaledVector(normal,-direction.dot(normal)).normalize();
  const side=new THREE.Vector3().crossVectors(normal,direction).normalize().multiplyScalar(.00038+hash(i)*.0003),length=(a.x>.17?.003:.006)+hash(i+11)*.005;
  a.addScaledVector(normal,.0004);
  const mid=a.clone().addScaledVector(direction,length*.5).addScaledVector(normal,.0016),tip=a.clone().addScaledVector(direction,length).addScaledVector(normal,.002);
  const points=[a.clone().sub(side),a.clone().add(side),mid.clone().sub(side),a.clone().add(side),mid.clone().add(side),mid.clone().sub(side),mid.clone().sub(side),mid.clone().add(side),tip];
  const belly=1-THREE.MathUtils.smoothstep(a.y,.12,.24),shade=.72+hash(i+71)*.28;
  for(let j=0;j<points.length;j++){const point=points[j-j%3+[0,2,1][j%3]];positions.push(...point.toArray());colors.push(shade*(1+.5*belly),shade*(1+.85*belly),shade*(1+1.1*belly));}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
});}
export function earGeometry(fox=false,inner=false){return shared(`ear-${fox}-${inner}`,()=>{
 const g=new THREE.SphereGeometry(1,20,24),p=g.attributes.position,height=fox?.135:.28;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),t=(y+1)/2,w=fox?(1-t)*.052:.042;
  p.setXYZ(i,x*(inner?.006:.014)-.04*t*t+(inner?.012:0),t*height,z*w*(inner?.7:1));
 }
 if(inner)g.scale(1,.86,.85);g.computeVertexNormals();return g;
});}
