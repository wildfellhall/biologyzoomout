import * as THREE from 'three';
import { mesh, ball, rod, path, organic, surface, group, tag, noise } from './surfaces.js';
import { interval } from './processes.js';
import {woodlandFloor,leafAnatomy} from './world-detail.js';
import {markFeature} from './field-notes.js';
import {plant,tree,rabbit,fox,shrub,groundCover,plantSoil} from './organisms.js';

import {terrain} from './habitat-terrain.js';
export {terrain} from './habitat-terrain.js';
export {tree,rabbit} from './organisms.js';
export const landscapeBuilders={
 makeEarth() {
  const map=new THREE.TextureLoader().load('/textures/earth-blue-marble.jpg');map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;map.userData.ownedByView=true;
  const earth=mesh(this.root,new THREE.SphereGeometry(2.7,96,64),new THREE.MeshStandardMaterial({map,roughness:.85,metalness:0}));
  earth.rotation.y=.85;earth.userData.node='APBIO-8.2-04';
  mesh(this.root,new THREE.SphereGeometry(2.74,64,40),new THREE.MeshBasicMaterial({color:'#8bb8de',transparent:true,opacity:.18,side:THREE.BackSide,depthWrite:false}));
  this.annotation('Carbon and climate',[1.7,1.7,1.1],'APBIO-8.2-05');
 },
 makePlantScene(){plant(this.root,0,0,1.5,'#b0799c',true);plantSoil(this.root);this.annotation('Leaf',[-.7,2.3,.2],{inspect:'leaf',label:'Leaf'});},
 makeLeaf() {
  const g=this.root;leafAnatomy(g);
  mesh(g,new THREE.BoxGeometry(4,.08,2),surface('#64834b','leaf'),[0,.9,0]);
  for(let i=0;i<12;i++){const x=(i%6-2.5)*.63,z=Math.floor(i/6)*.8-.4;const c=organic(g,[x,.35,z],[.26,.47,.3],'#92a769',{roughness:.035});tag(c,'plant-cell','Mesophyll cell','APBIO-2.1-09');for(let j=0;j<3;j++)tag(ball(g,[x+.21,.05+j*.22,z+.17],[.08,.12,.07],'#4f7b45'),'chloroplast','Chloroplast','APBIO-2.1-09');}
  for(let i=0;i<10;i++)tag(organic(g,[Math.sin(i*2.4)*1.65,-.42,Math.cos(i*2.4)*.7],[.25,.23,.24],'#9eae74',{roughness:.08}),'plant-cell','Spongy mesophyll cell','APBIO-2.1-09');
 },
 makeLandscape(kind) {
  const pop=kind==='population',eco=kind==='ecosystem';
  terrain(this.root,{stream:!pop});woodlandFloor(this.root,{stream:!pop,full:!pop});
  if(pop) {
   groundCover(this.root,4.6);
   const plants=[];const colors=['#a575ba','#d4a4b8','#e0c069'];
   // Each genotype has a fixed color. Replacement cohorts are revealed at generation boundaries.
   for(let genotype=0;genotype<3;genotype++)for(let i=0;i<24;i++) {
    const a=i*2.4,r=.7+Math.sqrt(i/24)*3.8,p=plant(this.root,Math.cos(a)*r,Math.sin(a)*r,.42,colors[genotype]);
    plants.push({object:p,genotype,index:i});
   }
   this.processRig={update(s){
    const fractions=s?.zygotes||[.35**2,2*.35*.65,.65**2];const countAA=Math.round(fractions[0]*24),countAa=Math.round(fractions[1]*24),counts=[countAA,countAa,24-countAA-countAa];
    for(const p of plants){const start=p.genotype===0?0:p.genotype===1?counts[0]:counts[0]+counts[1];p.object.visible=p.index>=start&&p.index<start+counts[p.genotype];
     let scale=.42;if(s&&s.generation<12){if(s.cycle>.33&&p.index-start>=Math.ceil(counts[p.genotype]*s.fitness[p.genotype]))scale=.42*(1-interval(s.cycle,.33,.65));else if(s.cycle<.2&&s.generation>0)scale=.42*(.3+.7*interval(s.cycle,0,.2));}
     p.object.scale.setScalar(Math.max(.001,scale));
    }
   }};
   this.annotation('Inherited variation',[-2,1.6,1],'APBIO-7.1-01');return;
  }
  const trees=[],grasses=[],shrubs=[];
  for(let i=0;i<5;i++){const x=-2+i*.7;if(Math.abs(x-Math.sin(2.3*.8)*.55)>.8)plant(this.root,x,2.3,.22,['#a575ba','#d4a4b8','#e0c069'][i%3]);}
  for(let i=0;i<14;i++){const a=i*2.4,r=2.3+Math.sqrt(i/14)*1.8,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x-Math.sin(z*.8)*.55)<.95||(z>1.1&&Math.abs(x)<2.9))continue;trees.push(tree(this.root,x,z,.65+(i%4)*.09));}
  for(let i=0;i<30;i++){const a=i*2.4,r=Math.sqrt(i/30)*4.5,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x-Math.sin(z*.8)*.55)<.8)continue;const grass=group(this.root,[x,.08,z]);for(let j=0;j<4;j++){const blade=mesh(grass,new THREE.ConeGeometry(.035,.35,3),surface('#899751','leaf'),[(j-1.5)*.05,.13,0]);blade.rotation.z=(j-1.5)*.15;}grasses.push(grass);}
  for(let i=0;i<9;i++){const a=i*2.4,x=Math.cos(a)*3,z=Math.sin(a)*3;if(Math.abs(x-Math.sin(z*.8)*.55)<1)continue;shrubs.push(shrub(this.root,x,z));}
  {
   const geometry=new THREE.PlaneGeometry(1.1,9.5,10,50);geometry.rotateX(-Math.PI/2);const p=geometry.attributes.position;
   for(let i=0;i<p.count;i++){const z=p.getZ(i),width=.97+.07*Math.sin(z*4)+.03*Math.cos(z*9);p.setX(i,p.getX(i)*width+Math.sin(z*.8)*.55);p.setY(i,.047);}geometry.computeVertexNormals();
   const water=mesh(this.root,geometry,surface('#46635e','water',{map:null,bumpScale:.012,roughness:.09,clearcoat:0,ior:1.333,envMapIntensity:1.5,transparent:true,opacity:.76}));markFeature(water,'stream');
   water.userData.animate=t=>{
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,.047+.002*Math.sin(z*5+x*3-t*1.4)+.001*Math.sin(z*11-x*7-t*2.1));}
    p.needsUpdate=true;geometry.computeVertexNormals();
   };
  }
  if(eco){
   this.processRig={update(s){for(const t of trees)t.scale.setScalar(s?Math.max(.005,s.trees)*(.75):.75);for(const g of grasses)g.scale.setScalar(s?Math.max(.005,s.grass):1);for(const shrub of shrubs)shrub.visible=!s||s.shrubs>.04;}};
  } else {
   const prey=[],predators=[];
   for(let i=0;i<36;i++){const a=i*2.4,r=.45+Math.sqrt(i/36)*3.6;const p=rabbit(this.root);const z=Math.sin(a)*r;let x=Math.cos(a)*r;if(Math.abs(x-Math.sin(z*.8)*.55)<.85)x+=x<0?-1.1:1.1;p.position.set(x,.1,z);p.rotation.y=a;tag(p,'rabbit','Rabbit','APBIO-8.3-01');p.userData.heading=a;prey.push(p);}
   for(let i=0;i<20;i++){const a=i*2.4+.4,r=1+Math.sqrt(i/20)*3.2;const p=fox(this.root);const z=Math.sin(a)*r;let x=Math.cos(a)*r;if(Math.abs(x-Math.sin(z*.8)*.55)<.85)x+=x<0?-1.1:1.1;p.position.set(x,.1,z);p.rotation.y=a;markFeature(p,'predator');p.userData.heading=a;predators.push(p);}
   this.processRig={update(s){prey.forEach((p,i)=>{p.visible=i<Math.round((s?.prey||30)/3);p.rotation.y=p.userData.heading+(s?.12*Math.sin(s.modelTime*.5+i):0);});predators.forEach((p,i)=>{p.visible=i<Math.round((s?.predator||9)/3);p.rotation.y=p.userData.heading+(s?.15*Math.sin(s.modelTime*.35+i):0);});}};
  }
  this.annotation('Producers',[-2.4,2.2,-1],'APBIO-8.2-02');this.annotation(eco?'Succession':'Predation',[2,.7,2],eco?'APBIO-8.7-05':'APBIO-8.5-02');
 },
};
