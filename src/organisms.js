import * as THREE from 'three';
import {mesh,surface,group,tag} from './surfaces.js';
import {hash,shared,smoothSphere,tapered,merge,leafGeometry,animalSkin,coatFibers,earGeometry} from './organism-geometry.js';
import {naturalMaterial,foliageMaterial} from './natural-materials.js';

const TAU=Math.PI*2;
const blade=shared('botanical-leaf',()=>leafGeometry());
const canopyBlade=shared('canopy-leaf',()=>leafGeometry(false,6,2));
const petal=shared('botanical-petal',()=>leafGeometry(true));
const distantPetal=shared('distant-petal',()=>leafGeometry(true,6,3));
const pollenGrain=shared('pollen-grain',()=>new THREE.IcosahedronGeometry(1,1));
const fur=(color,vertexColors=false)=>surface(color,'fur',{roughness:1,bumpScale:.00015,clearcoat:0,vertexColors,sheen:.45,sheenRoughness:.9,sheenColor:new THREE.Color(color).multiplyScalar(.3)});
const part=(parent,p,s,color,kind='fur')=>mesh(parent,smoothSphere,kind==='fur'?fur(color):surface(color,kind,{bumpScale:.001,roughness:.65}),p,s);
const branch=(parent,points,radii,color,kind='bark')=>mesh(parent,tapered(points,radii),surface(color,kind,{roughness:.93,bumpScale:kind==='bark'?.025:.006,clearcoat:0}));

export function rabbit(parent,color='#94816a',detail=false){return animal(parent,'rabbit',color,detail);}
export function fox(parent,color='#ac6538',detail=false){return animal(parent,'fox',color,detail);}
function animal(parent,kind,color,detail){
 const g=group(parent),isFox=kind==='fox',body=mesh(g,animalSkin(kind,detail),fur(color,true)),ears=[],eyes=[];
 // The coat has a continuous contour; separate facial and limb surfaces add smaller anatomy.
 const cream=isFox?'#c9bca1':'#c5bda9';
 if(isFox){
  const tail=branch(g,[[-.41,.35,0],[-.59,.28,.035],[-.77,.19,.09],[-.9,.22,.11]],[.065,.10,.07,.003],color,'fur');
  branch(g,[[-.77,.19,.09],[-.85,.20,.11],[-.9,.22,.11]],[.071,.045,.002],cream,'fur');
  part(g,[.13,.35,0],[.07,.12,.083],cream);
 }else part(g,[-.315,.22,0],[.07,.075,.065],cream);
 for(const side of [-1,1]){
  const footColor=isFox?'#473d34':color;
  if(isFox){
   for(const x of [-.32,.07]){
    branch(g,[[x,.33,side*.075],[x-.025,.16,side*.08],[x+.015,.045,side*.09]],[.043,.026,.019],color,'fur');
    part(g,[x+.022,.045,side*.09],[.03,.065,.026],footColor);
    part(g,[x+.052,.022,side*.092],[.063,.025,.032],footColor);
   }
  }
  const e=group(g,isFox?[.215,.565,side*.055]:[.185,.433,side*.048]);e.rotation.x=side*.20;e.rotation.y=-side*.55;e.userData.rest=isFox?-.08:.1+side*.16;e.rotation.z=e.userData.rest;e.scale.y=side===1?1:.94;
  mesh(e,earGeometry(isFox),fur(color));mesh(e,earGeometry(isFox,true),surface(isFox?'#51453e':'#ae827a','fur',{roughness:1,bumpScale:.0006}));ears.push(e);
  const eyePosition=isFox?[.29,.535,side*.074]:[.272,.393,side*.074];
  const eye=mesh(g,smoothSphere,surface('#1a150e','atom',{roughness:.23,clearcoat:.65,clearcoatRoughness:.15}),[eyePosition[0]+.002,eyePosition[1],eyePosition[2]+side*.004],[isFox?.019:.016,isFox?.018:.012,.006]);eyes.push(eye);
  if(isFox)part(g,[.37,.46,side*.029],[.067,.026,.027],cream);
  else for(const upper of [true,false]){
   const lid=[];for(let j=0;j<15;j++){const a=j/14*Math.PI;lid.push([eyePosition[0]+Math.cos(a)*.019,eyePosition[1]+(upper?1:-1)*Math.sin(a)*.012,eyePosition[2]+side*.006]);}
   branch(g,lid,[.0025,.002,.0015],color,'fur');
  }
  if(detail||isFox){
   const hairs=[];
   for(let j=0;j<7;j++){
    const x=isFox?.403:.354,y=(isFox?.468:.326)+j*.002,z=side*.025;
    hairs.push(x,y,z,x+.045,y+.02*(j-3),z+side*.11,x+.045,y+.02*(j-3),z+side*.11,x+.07,y+.026*(j-3),z+side*.16);
   }
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(hairs,3));g.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#bcb5a5',transparent:true,opacity:.65})));
  }
 }
 const nose=part(g,isFox?[.46,.484,0]:[.394,.337,0],isFox?[.017,.014,.021]:[.007,.006,.010],isFox?'#26231f':'#785f56','atom');
 branch(g,isFox?[[.45,.472,0],[.42,.457,0],[.36,.456,0]]:[[.396,.328,0],[.382,.319,0],[.363,.313,0]],[.001,.001,.0005],'#665349','fur');
 let coat;
 if(detail){coat=mesh(g,coatFibers(kind),surface(color,'atom',{vertexColors:true,roughness:1,clearcoat:0,sheen:.35,sheenRoughness:1,sheenColor:new THREE.Color(color).multiplyScalar(.35)}));coat.castShadow=false;}
 g.userData.animate=t=>{
  body.scale.y=1+.006*Math.sin(t*2.1);if(coat)coat.scale.y=body.scale.y;nose.scale.y=(isFox?.014:.006)*(1+.06*Math.sin(t*5));
  ears.forEach((e,i)=>e.rotation.z=e.userData.rest+.025*Math.sin(t*.9+i*2));
  const blink=1-.92*Math.exp(-(((t%6-4.8)/.08)**2));eyes.forEach(eye=>eye.scale.y=(isFox?.018:.012)*blink);
 };
 return g;
}

function botanicalLeaf(parent,p,length,azimuth,pitch=.25){
 const leaf=mesh(parent,blade,foliageMaterial('#4f7435'),p,[length,length,length]);
 leaf.rotation.set(-Math.PI/2,pitch,azimuth,'ZXY');
 return tag(leaf,'leaf','Leaf','APBIO-2.2-02');
}
function bloom(parent,p,size,color,seed=0,detail=false){
 const head=group(parent,p,size);head.rotation.set(.25+hash(seed)*.25,seed*.7,.18);
 const count=detail?22:16,grainCount=detail?90:28,petals=new THREE.InstancedMesh(detail?petal:distantPetal,surface(color,'petal',{roughness:.62,bumpScale:.0007,clearcoat:.08}),count),dummy=new THREE.Object3D();
 for(let i=0;i<count;i++){
  const a=i/count*TAU,r=.12;dummy.position.set(Math.cos(a)*r,.01+hash(i)*.035,Math.sin(a)*r);
  // A petal grows along local +x; rotate the horizontal surface around the stem.
  dummy.quaternion.setFromEuler(new THREE.Euler(-Math.PI/2,-a,0,'YXZ'));dummy.scale.set(.43+hash(i+seed)*.16,.32,.55);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);
 }
 // Subpixel overlapping petals produce shadow-map acne; surface normals still light each curved petal.
 petals.castShadow=false;petals.receiveShadow=false;head.add(petals);
 part(head,[0,.025,0],[.19,.09,.19],'#a18b38','petal');
 const pollen=new THREE.InstancedMesh(pollenGrain,surface('#c8a84a','atom',{roughness:.9}),grainCount);
 for(let i=0;i<grainCount;i++){const a=i*2.4,r=Math.sqrt(i/grainCount)*.17;dummy.position.set(Math.cos(a)*r,.03+Math.sqrt(1-r*r/.04)*.075,Math.sin(a)*r);dummy.rotation.set(0,a,0);dummy.scale.set(.012,.018,.012);dummy.updateMatrix();pollen.setMatrixAt(i,dummy.matrix);}
 pollen.castShadow=true;head.add(pollen);
 return head;
}
export function plant(parent,x,z,scale,color='#b0799c',roots=false){
 const g=group(parent,[x,.04,z],scale),stem=group(g),seed=x*3.1+z*7.3;
 branch(stem,[[0,0,0],[.025,.7,.015],[-.04,1.5,.03],[.045,2.35,0]],[.04,.03,.021,.009],'#627847','foliage');
 for(let i=0;i<9;i++){
  const a=i*2.4+.3,y=.23+i*.20,l=.78-i*.045,start=[.02*Math.sin(i),y,.02];
  const end=[Math.cos(a)*.16,y+.09,Math.sin(a)*.16];
  branch(stem,[start,end],[.012,.005],'#758646','foliage');
  const leaf=botanicalLeaf(stem,end,l,a,.25);leaf.quaternion.setFromEuler(new THREE.Euler(-Math.PI/2,-a,-.22+hash(i)*.25,'YXZ'));
 }
 bloom(stem,[.045,2.35,0],.7,color,seed,roots);
 for(let i=0;i<2;i++){
  const a=i*3.6+seed*.2,end=[Math.cos(a)*.45,1.75+i*.3,Math.sin(a)*.45];
  branch(stem,[[0,1.05+i*.3,0],[end[0]*.6,1.5+i*.2,end[2]*.6],end],[.017,.01,.004],'#657b46','foliage');
  if(i===0)bloom(stem,end,.45,color,seed+4,roots);
  else part(stem,end,[.065,.11,.065],'#708044','foliage');
 }
 if(roots){
  branch(g,[[0,0,0],[.04,-.5,0],[-.02,-1.1,.03]],[.04,.023,.002],'#a28b62','bark');
  for(let i=0;i<9;i++){
   const a=i*2.4,start=[0,-.12-i*.055,0],end=[Math.cos(a)*(.35+hash(i)*.45),-.65-hash(i+7)*.4,Math.sin(a)*.7];
   branch(g,[start,[end[0]*.5,start[1]-.15,end[2]*.4],end],[.018,.009,.001],'#b29b74','bark');
   for(let j=0;j<3;j++){const f=(j+1)/4;branch(g,[[end[0]*f,start[1]+(end[1]-start[1])*f,end[2]*f],[end[0]*f+.13*Math.sin(a+j),start[1]+(end[1]-start[1])*f-.18,end[2]*f+.13*Math.cos(a+j)]],[.004,.0005],'#c1ac87','bark');}
  }
 }
 g.userData.animate=t=>{stem.rotation.z=.012*Math.sin(t*.7+seed);stem.rotation.x=.009*Math.sin(t*.53+seed);};
 return tag(g,'plant','Flowering plant','APBIO-5.5-01');
}

export function tree(parent,x,z,scale=1){
 const g=group(parent,[x,.04,z],scale),crown=group(g),seed=Math.floor(hash(x*11+z*7+1)*5),wood=[],leaves=[];
 const trunk=[[0,0,0],[.035,.8,-.02],[-.045,1.6,.03],[.06,2.4,-.01],[0,3.1,.02]];
 wood.push(tapered(trunk,[.17,.11,.075,.038,.004],12));
 for(let i=0;i<12;i++){
  const a=i*2.4+seed*.8,y=.8+i*.15,r=.93-Math.abs(y-1.6)*.35,end=[Math.cos(a)*r,y+.45+hash(i+seed)*.3,Math.sin(a)*r];
  wood.push(tapered([[0,y,0],[end[0]*.45,y+.16,end[2]*.45],end],[.048,.026,.003]));
  for(let j=0;j<5;j++){
   const b=a+(j-2)*.48,origin=[end[0]*(.48+j*.08),y+.17+j*.055,end[2]*(.48+j*.08)],tip=[end[0]+Math.cos(b)*.5,y+.45+hash(j+i*7+seed)*.55,end[2]+Math.sin(b)*.5];
   wood.push(tapered([origin,[(origin[0]+tip[0])*.5,tip[1]-.12,(origin[2]+tip[2])*.5],tip],[.013,.007,.0015],6));
   for(let k=0;k<36;k++){
    const t=(k+hash(k+j)*.3)/36,side=k%2?1:-1,offset=side*(.08+hash(k+i)*.15),p=origin.map((v,n)=>v+(tip[n]-v)*t);
    p[0]+=Math.cos(b+Math.PI/2)*offset;p[2]+=Math.sin(b+Math.PI/2)*offset;p[1]+=.04*Math.sin(k);
    leaves.push({p,a:b+side*(.6+hash(k)*.5),pitch:-.45+hash(k+j*31)*1.0,size:.18+hash(k*3+i)*.10});
   }
  }
 }
 for(let i=0;i<6;i++){const a=i/6*TAU;wood.push(tapered([[0,.23,0],[Math.cos(a)*.24,.07,Math.sin(a)*.24],[Math.cos(a)*.5,.005,Math.sin(a)*.5]],[.055,.035,.001]));}
 mesh(crown,merge(wood),naturalMaterial('bark'));
 const canopy=new THREE.InstancedMesh(canopyBlade,foliageMaterial('#e1e6ca'),leaves.length),dummy=new THREE.Object3D();
 leaves.forEach(({p,a,pitch,size},i)=>{dummy.position.set(...p);dummy.rotation.set(-Math.PI/2+pitch,-a,hash(i)*.3,'YXZ');dummy.scale.setScalar(size);dummy.updateMatrix();canopy.setMatrixAt(i,dummy.matrix);canopy.setColorAt(i,new THREE.Color(['#577332','#718b40','#4e6933','#86984c','#637d3e'][i%5]));});
 canopy.castShadow=true;canopy.receiveShadow=true;crown.add(canopy);
 g.userData.animate=t=>{crown.rotation.z=.004*Math.sin(t*.5+seed);};
 return tag(g,'tree','Woodland tree','APBIO-8.3-01');
}

export function shrub(parent,x,z){
 const g=group(parent,[x,.09,z]),wood=[],leaves=[],seed=x*11+z*7;
 for(let i=0;i<7;i++){
  const a=i*2.4+seed,end=[Math.cos(a)*.42,.4+hash(i+seed)*.4,Math.sin(a)*.42];
  wood.push(tapered([[0,0,0],[end[0]*.4,end[1]*.6,end[2]*.4],end],[.016,.009,.001],5));
  for(let j=0;j<4;j++){
   const t=.35+j*.16,origin=end.map(v=>v*t),b=a+(j%2?1:-1)*1.1,tip=[origin[0]+Math.cos(b)*.22,origin[1]+.14,origin[2]+Math.sin(b)*.22];
   wood.push(tapered([origin,tip],[.006,.0007],4));
   for(let k=0;k<8;k++){
    const f=k/8,side=k%2?1:-1;
    leaves.push({p:origin.map((v,n)=>v+(tip[n]-v)*f),a:b+side*.8,pitch:hash(k+j*9+i*31)*1.0-.35,size:.15+hash(k+i)*.06});
   }
  }
 }
 mesh(g,merge(wood),naturalMaterial('bark'));
 const canopy=new THREE.InstancedMesh(canopyBlade,foliageMaterial('#b7c18d'),leaves.length),dummy=new THREE.Object3D();
 leaves.forEach(({p,a,pitch,size},i)=>{dummy.position.set(...p);dummy.rotation.set(-Math.PI/2+pitch,-a,0,'YXZ');dummy.scale.setScalar(size);dummy.updateMatrix();canopy.setMatrixAt(i,dummy.matrix);canopy.setColorAt(i,new THREE.Color(['#56723c','#6c833f','#85984e'][i%3]));});
 canopy.castShadow=canopy.receiveShadow=true;g.add(canopy);
 g.userData.animate=t=>g.rotation.z=.008*Math.sin(t*.65+seed);
 return g;
}

export function groundCover(parent,radius=1,seed=0,backOnly=false){
 const points=[];
 for(let i=0;i<95;i++){
  const a=i*2.4,r=Math.sqrt(hash(i+seed+1))*radius,x=Math.cos(a)*r,z=Math.sin(a)*r;
  if(backOnly&&z>0)continue;
  for(let j=0;j<4;j++){
   const h=.05+hash(i*5+j)*.11,b=a+j;
   points.push(x-.008,.01,z,x+.008,.01,z,x+Math.cos(b)*.04,h,z+Math.sin(b)*.04);
  }
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.computeVertexNormals();return mesh(parent,geo,surface('#76834c','foliage',{roughness:.95,bumpScale:.003,clearcoat:0}));
}

export function plantSoil(parent){
 const g=group(parent);
 for(const [radius,height,y,color]of [[1.25,1,-.5,'#c8baa3'],[1.25,.75,-1.375,'#ab9c82']]){
  mesh(g,new THREE.CylinderGeometry(radius,radius,height,64,1,false,Math.PI/2,Math.PI),naturalMaterial('soil',{color,repeat:[2,2]}),[0,y,0]);
  mesh(g,new THREE.BoxGeometry(radius*2,height,.025),naturalMaterial('soil',{color,repeat:[2,2]}),[0,y,-.015]);
 }
 groundCover(g,1.2,0,true);return g;
}
