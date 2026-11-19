import * as THREE from 'three';
import {group,mesh,organic} from './surfaces.js';
import {naturalMaterial} from './natural-materials.js';
import {hash} from './organism-geometry.js';

const TAU=Math.PI*2;
const rim=a=>4.95+.045*Math.sin(a*13)+.035*Math.cos(a*23)+.07*Math.sin(a*5);
const height=(x,z,stream)=>stream&&Math.abs(x-Math.sin(z*.8)*.55)<.58?-.04:.065+.02*Math.sin(x*3+z)*Math.cos(z*4)+.018*Math.sin(x*7-z*5);
export function terrain(parent,{stream=false}={}){
 const root=group(parent),segments=160,rings=28,positions=[],uv=[],indices=[];
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*TAU,r=j/rings*rim(a),x=Math.cos(a)*r,z=Math.sin(a)*r;
  positions.push(x,height(x,z,stream),z);uv.push(x/10+.5,z/10+.5);
 }
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,b,a+1,b+1);}
 const top=new THREE.BufferGeometry();top.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));top.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));top.setIndex(indices);top.computeVertexNormals();
 mesh(root,top,naturalMaterial('ground',{repeat:[3,3],color:'#b0b7a0'}));
 const wall=[],wallUV=[],wallColors=[],wallIndices=[],depths=[0,-.15,-.45,-.85,-1.03];
 for(let j=0;j<depths.length;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*TAU,r=rim(a)-j*.035,x=Math.cos(a)*r,z=Math.sin(a)*r,y=j===0?height(x,z,stream):depths[j]+.028*Math.sin(a*8+j);
  wall.push(x,y,z);wallUV.push(i/segments*8,j*.25);
  const tint=new THREE.Color(['#777967','#8e8973','#a9a18d','#c2b69f','#b6ab96'][j]);wallColors.push(...tint.toArray());
 }
 for(let j=0;j<depths.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;wallIndices.push(a,a+1,b,b,a+1,b+1);}
 const side=new THREE.BufferGeometry();side.setAttribute('position',new THREE.Float32BufferAttribute(wall,3));side.setAttribute('uv',new THREE.Float32BufferAttribute(wallUV,2));side.setAttribute('color',new THREE.Float32BufferAttribute(wallColors,3));side.setIndex(wallIndices);side.computeVertexNormals();mesh(root,side,naturalMaterial('soil',{vertexColors:true}));
 // Close the soil volume so rotating below the diorama does not reveal a hollow shell.
 const base=[0,depths.at(-1),0],baseUV=[.5,.5],baseIndices=[];
 for(let i=0;i<=segments;i++){
  const at=((depths.length-1)*(segments+1)+i)*3;
  base.push(...wall.slice(at,at+3));baseUV.push(wall[at]/10+.5,wall[at+2]/10+.5);
  if(i<segments)baseIndices.push(0,i+1,i+2);
 }
 const bottom=new THREE.BufferGeometry();bottom.setAttribute('position',new THREE.Float32BufferAttribute(base,3));bottom.setAttribute('uv',new THREE.Float32BufferAttribute(baseUV,2));bottom.setIndex(baseIndices);bottom.computeVertexNormals();mesh(root,bottom,naturalMaterial('soil',{color:'#8e8973',repeat:[3,3]}));
 for(let i=0;i<35;i++){
  const a=hash(i+8)*TAU,r=Math.sqrt(hash(i+54))*4.7,x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(stream&&Math.abs(x-Math.sin(z*.8)*.55)<.55)continue;
  organic(root,[x,height(x,z,stream)-.015,z],[.03+hash(i)*.09,.03+hash(i+3)*.04,.04+hash(i+2)*.06],'#77786a',{kind:'soil',roughness:.18,detail:12});
 }
 return root;
}
