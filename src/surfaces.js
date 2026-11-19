import * as THREE from 'three';

// Procedural textures are visual aids, not microscopy data. No external assets.
const textures = new Map(), materials = new Map();
const colorTextures=new Map();
export const sharedGeometries = new Set();
export const sphere = new THREE.SphereGeometry(1, 40, 28);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 16);
sharedGeometries.add(sphere); sharedGeometries.add(cylinder);
export const noise = (x,y,z=0) => Math.sin(x*3.7+Math.sin(y*4.1))*Math.cos(y*3.3+Math.sin(z*4.7))*.5 + Math.sin(x*13.1+y*9.7+z*11.3)*.16;

// Three.js material cloning omits shader callbacks. View-local opacity must not
// discard the botanical transmission shader when a model enters the scene cache.
export function cloneForView(original){
  const clone=original.clone();
  clone.onBeforeCompile=original.onBeforeCompile;
  clone.customProgramCacheKey=original.customProgramCacheKey;
  Object.assign(clone.userData,{originalOpacity:original.opacity,originalTransparent:original.transparent,originalDepthWrite:original.depthWrite});
  return clone;
}

function texture(kind) {
  if (textures.has(kind)) return textures.get(kind);
  const canvas=document.createElement('canvas'); canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d'), data=ctx.createImageData(256,256);
  const field=(x,y,f)=>{
    const a=x/256*f,b=y/256*f,ix=Math.floor(a),iy=Math.floor(b),sx=a-ix,sy=b-iy;
    const u=sx*sx*(3-2*sx),v=sy*sy*(3-2*sy);
    const h=(i,j)=>{const n=Math.sin((i%f)*127.1+(j%f)*311.7)*43758.5453;return n-Math.floor(n);};
    return (1-v)*((1-u)*h(ix,iy)+u*h(ix+1,iy))+v*((1-u)*h(ix,iy+1)+u*h(ix+1,iy+1));
  };
  for(let y=0;y<256;y++) for(let x=0;x<256;x++) {
    const u=x/256*Math.PI*2,v=y/256*Math.PI*2;
    const grain=Math.sin(x*127.1+y*311.7)*43758.5453;
    let n=.15+.22*field(x,y,8)+.28*field(x,y,24)+.25*field(x,y,64)+.1*(grain-Math.floor(grain));
    if(kind==='bark') n=.5+.23*Math.sin(u*23+Math.sin(v*2))+.12*Math.sin(u*47+v*3);
    if(kind==='leaf') n=.6+.17*Math.cos(v*32+Math.abs(Math.sin(u))*8)+.08*Math.sin(u*4);
    if(kind==='soil') n=.1+.45*field(x,y,18)+.25*field(x,y,72)+.2*(grain-Math.floor(grain));
    if(kind==='water') n=.5+.16*Math.sin(u*9+2*field(x,y,8))+.08*Math.sin(v*17+u*3+3*field(x,y,16))+.05*field(x,y,32);
    if(kind==='fur') n=.42+.18*field(x,y,64)+.12*field(x,y,128)+.1*field(x*3,y*.2,64);
    if(kind==='petal') n=.65+.12*Math.sin(v*38+Math.sin(u*3))+.06*field(x,y,24);
    if(kind==='foliage'){
      const mid=Math.abs(y/256-.5),vein=Math.exp(-mid*180),sideVeins=Math.exp(-Math.abs(Math.sin((x/256-mid*.58)*Math.PI*13))*24);
      n=.52+.19*vein+.11*sideVeins+.07*field(x,y,24);
    }
    const c=Math.max(0,Math.min(255,Math.round(n*255))),i=(y*256+x)*4;
    data.data[i]=data.data[i+1]=data.data[i+2]=c;data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  const tex=new THREE.CanvasTexture(canvas);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.anisotropy=4; textures.set(kind,tex); return tex;
}

export function surface(color,kind='membrane',options={}) {
  const key=`${color}:${kind}:${JSON.stringify(options)}`;
  if(materials.has(key)) return materials.get(key);
  const textured=kind!=='atom'&&kind!=='glow';
  if(textured&&!colorTextures.has(kind)) {
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.drawImage(texture(kind).image,0,0);
    const data=ctx.getImageData(0,0,256,256);
    for(let i=0;i<data.data.length;i+=4){const shade=185+data.data[i]*.27;data.data[i]=data.data[i+1]=data.data[i+2]=shade;}
    ctx.putImageData(data,0,0);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;colorTextures.set(kind,map);
  }
  const mat=new THREE.MeshPhysicalMaterial({
    color, metalness:0, roughness:kind==='atom'?.27:kind==='water'?.22:.55,
    map:textured?colorTextures.get(kind):null,
    bumpMap:textured?texture(kind):null, bumpScale:kind==='soil'?.16:kind==='bark'?.11:kind==='leaf'?.045:.075,
    clearcoat:kind==='atom'?.32:kind==='water'?.7:.1, clearcoatRoughness:.45,
    side:THREE.DoubleSide, ...options,
  });
  if(mat.opacity<1) {mat.transparent=true;mat.depthWrite=false;}
  materials.set(key,mat); return mat;
}

export function mesh(group,geometry,mat,position=[0,0,0],scale=1) {
  const object=new THREE.Mesh(geometry,mat);object.position.set(...position);
  object.scale.set(...(Array.isArray(scale)?scale:[scale,scale,scale]));
  object.castShadow=!mat.transparent;object.receiveShadow=true;group.add(object);return object;
}
export function ball(group,p,s,color,kind='membrane',options={}) {return mesh(group,sphere,surface(color,kind,options),p,s);}
export function rod(group,a,b,r,color,kind='membrane') {
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
  const object=mesh(group,cylinder,surface(color,kind),start.add(end).multiplyScalar(.5).toArray(),[r,delta.length(),r]);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return object;
}
export function path(group,points,r,color,kind='membrane',closed=false) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed);
  return mesh(group,new THREE.TubeGeometry(curve,Math.max(32,points.length*3),r,8,closed),surface(color,kind));
}
export function organicGeometry(scale=[1,1,1],cut=false,detail=64,roughness=.035) {
  if(!Array.isArray(scale))scale=[scale,scale,scale];
  // A front hemisphere is removed for the cutaway; its rim is real geometry.
  const geometry=new THREE.SphereGeometry(1,detail,Math.round(detail*.65),cut?Math.PI:0,cut?Math.PI:Math.PI*2);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const wobble=1+roughness*noise(x*2,y*2,z*2)*(cut?Math.min(1,Math.abs(z)*5):1);
    positions.setXYZ(i,x*scale[0]*wobble,y*scale[1]*wobble,z*scale[2]*wobble);
  }
  geometry.computeVertexNormals();return geometry;
}
export function organic(group,p,s,color,{cut=false,roughness=.035,kind='membrane',detail=40,...options}={}) {
  return mesh(group,organicGeometry(s,cut,detail,roughness),surface(color,kind,options),p);
}
export function rim(group,scale,color,r=.035) {
  const points=Array.from({length:81},(_,i)=>{const a=i/80*Math.PI*2;return [Math.cos(a)*scale[0],Math.sin(a)*scale[1],0];});
  return path(group,points,r,color);
}
export function sheet(group,position,scale,color,phase=0) {
  const geometry=new THREE.PlaneGeometry(2,2,32,12),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++) {const x=p.getX(i),y=p.getY(i);p.setZ(i,.13*Math.cos(x*3+phase)+.08*Math.sin(y*5+x*2));}
  geometry.computeVertexNormals();const object=mesh(group,geometry,surface(color),position,scale);
  return object;
}
export function tag(group,id,label,node) {
  group.traverse(o=>{if(o.isMesh&&!o.userData.inspect)o.userData={...o.userData,inspect:id,label,node};});return group;
}
export function group(parent,position=[0,0,0],scale=1) {
  const g=new THREE.Group();g.position.set(...position);g.scale.setScalar(scale);parent.add(g);return g;
}
export function particles(parent,count,color,radius=.055) {
  const g=group(parent),items=[];
  for(let i=0;i<count;i++)items.push(ball(g,[0,0,0],radius,color,'glow',{emissive:color,emissiveIntensity:.35}));
  return {group:g,items};
}
