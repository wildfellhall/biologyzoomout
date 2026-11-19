import test from 'node:test';
import assert from 'node:assert/strict';
import {animalSkin,coatFibers,leafGeometry,tapered} from '../src/organism-geometry.js';
import {sharedGeometries} from '../src/surfaces.js';

test('Animal contours have finite, outward-facing surfaces at both rendering resolutions',()=>{
 for(const kind of ['rabbit','fox'])for(const detail of [false,true]){
  const geometry=animalSkin(kind,detail),p=geometry.attributes.position,n=geometry.attributes.normal;
  assert.ok(p.count>3000&&p.count<100000);assert.equal(p.count%3,0);
  assert.ok([...p.array,...n.array].every(Number.isFinite));
  let volume=0;
  for(let i=0;i<p.count;i+=3){
   const ax=p.getX(i),ay=p.getY(i),az=p.getZ(i),bx=p.getX(i+1),by=p.getY(i+1),bz=p.getZ(i+1),cx=p.getX(i+2),cy=p.getY(i+2),cz=p.getZ(i+2);
   volume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
  }
  assert.ok(volume>0.01&&volume<.1,`${kind} encloses an outward-facing body`);
  assert.ok(Math.abs(geometry.boundingBox.max.z+geometry.boundingBox.min.z)<.002,'bilateral body contour');
  assert.ok(sharedGeometries.has(geometry),'revisited scenes retain their shared geometry');
 }
 assert.ok(animalSkin('rabbit',false).attributes.position.count<animalSkin('rabbit',true).attributes.position.count*.6);
});
test('Fine fur stays close to the animal surface instead of inflating the model bounds',()=>{
 for(const kind of ['rabbit','fox']){
  const bounds=animalSkin(kind,true).boundingBox.clone().expandByScalar(.02),p=coatFibers(kind).attributes.position;
  for(let i=0;i<p.count;i++)assert.ok(p.getX(i)>=bounds.min.x&&p.getX(i)<=bounds.max.x&&p.getY(i)>=bounds.min.y&&p.getY(i)<=bounds.max.y&&p.getZ(i)>=bounds.min.z&&p.getZ(i)<=bounds.max.z);
 }
});

test('Leaf and petal ends close to a point without raised edge fins',()=>{
 for(const petal of [false,true])for(const [length,width] of [[18,8],[6,2]]){
  const g=leafGeometry(petal,length,width),p=g.attributes.position;
  for(const tip of [0,1]){
   const end=[];
   for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)-tip)<1e-6)end.push([p.getX(i),p.getY(i),p.getZ(i)]);
   assert.equal(end.length,width+1);
   for(const vertex of end)for(let axis=0;axis<3;axis++)assert.ok(Math.abs(vertex[axis]-end[0][axis])<1e-6);
  }
  g.dispose();
 }
});

test('Tapered stems and branches face outward for correct lighting and shadows',()=>{
 const g=tapered([[0,0,0],[0,1,0]],[.2,.1]),p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++)assert.ok(p.getX(i)*n.getX(i)+p.getZ(i)*n.getZ(i)>.08);
 g.dispose();
});

test('Rabbit forelegs and paws connect to the body at both rendering resolutions',()=>{
 for(const detail of [false,true]){
  const p=animalSkin('rabbit',detail).attributes.position,parents=[],ids=new Map();
  const find=i=>parents[i]===i?i:(parents[i]=find(parents[i]));
  for(let i=0;i<p.count;i+=3){
   const triangle=[];
   for(let j=0;j<3;j++){
    const key=[p.getX(i+j),p.getY(i+j),p.getZ(i+j)].map(v=>Math.round(v*1e5)).join(',');
    if(!ids.has(key)){ids.set(key,parents.length);parents.push(parents.length);}
    triangle.push(ids.get(key));
   }
   for(let j=1;j<3;j++)parents[find(triangle[j])]=find(triangle[0]);
  }
  assert.equal(new Set(parents.map((_,i)=>find(i))).size,1,'no detached surface components');
 }
});
