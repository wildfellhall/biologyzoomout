import {makeDivisionModel} from './division-model.js';
import {makeNucleosome,makeChromatin} from './chromatin-model.js';
import {makePeptide} from './molecular-reactions.js';
import * as THREE from 'three';
import {ball,rod,path,organic,rim,mesh,surface,group,tag} from './surfaces.js';
import {terrain} from './landscapes.js';
import {rabbit,tree,groundCover} from './organisms.js';
import {interval} from './processes.js';
import {woodlandFloor,epithelialMatrix} from './world-detail.js';

function chlorophyll(parent,scale=1){
 const g=group(parent,[0,0,0],scale),ring=[];
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2,p=[Math.cos(a),Math.sin(a),.025*Math.sin(i)];ring.push(p);ball(g,p,i%4===0?.11:.085,i%4===0?'#83a7ca':'#7b9d88','atom');}
 for(let i=0;i<16;i++)rod(g,ring[i],ring[(i+1)%16],.045,'#8ea393','atom');
 ball(g,[0,0,0],.18,'#9aba83','atom');for(let i=0;i<4;i++)rod(g,[0,0,0],ring[i*4],.035,'#a6b99b','atom');
 path(g,[[.7,-.7,0],[1,-1.25,.2],[.7,-1.65,.1],[1.1,-2.1,.3],[.85,-2.6,.15]],.055,'#c8b078','atom');
 return tag(g,'chlorophyll','Chlorophyll','APBIO-3.4-02');
}
function photosystem(parent,scale=1){
 const g=group(parent,[0,0,0],scale);
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2;organic(g,[Math.cos(a)*.9,.1*Math.sin(i),Math.sin(a)*.55],[.34,.72,.32],i%2?'#8b9871':'#5e8175',{roughness:.11});const pigment=chlorophyll(g,.18);pigment.position.set(Math.cos(a)*.9,.58,Math.sin(a)*.55);pigment.rotation.x=-Math.PI/3;}
 return tag(g,'photosystem','Photosystem II','APBIO-3.4-02');
}
export const pathwayBuilders={
 'free-ribosome'(){this.makeStructure('ribosome');this.root.traverse(o=>{if(o.userData.inspect==='ribosome'){o.userData.inspect='free-ribosome';o.userData.label='Free ribosome';}});},
 tonoplast(){this.makeMembrane();},
 tree(){tree(this.root,0,0,1.5);terrain(this.root).scale.set(.35,.6,.35);groundCover(this.root,1.6);},
 'tree-population'(){
  terrain(this.root);woodlandFloor(this.root);for(let i=0;i<16;i++){const a=i*2.4,r=.4+Math.sqrt(i/16)*3.9;tree(this.root,Math.cos(a)*r,Math.sin(a)*r,.5+(i%4)*.08);}
 },
 'chloroplast-atp-synthase'(){this.makeChloroplastATP();},
 'mitochondrial-dna'(){this.makeCircularDNA();},
 'chloroplast-dna'(){this.makeCircularDNA();},
 nucleosome:makeNucleosome,
 chromatin:makeChromatin,
 'mitotic-cell'(){makeDivisionModel.call(this,'mitosis');},
 'meiotic-cell'(){makeDivisionModel.call(this,'meiosis');},
 chromosome(){
  for(let k=0;k<12;k++){
   const points=Array.from({length:65},(_,i)=>{const a=i*.22+k*2.4;return [Math.cos(a)*(.55+k*.075),Math.sin(a*.73)*1.8,Math.sin(a)*(.55+k*.065)];});
   tag(path(this.root,points,.035,k%2?'#b294bc':'#d1b4c1'),'chromatin','Chromatin','APBIO-6.1-01');
  }
 },
 phospholipid(){
  ball(this.root,[0,1.2,0],.38,'#94b7ad');rod(this.root,[0,.88,0],[0,.42,0],.09,'#c6a975');
  for(const side of [-1,1]){const points=Array.from({length:12},(_,i)=>[side*.19+(i%2)*.08+(side===1&&i>5?(i-5)*.09:0),.42-i*.25,.05*Math.sin(i)]);path(this.root,points,.075,'#c5ab78');for(const p of points)ball(this.root,p,.075,'#d0b784','atom');}
  this.annotation('Polar head',[0,1.6,0],'APBIO-1.5-03');this.annotation('Nonpolar tails',[.7,-1.8,0],'APBIO-1.5-03');
 },
 'starch-granule'(){
  organic(this.root,[0,0,0],[2,1.6,1.3],'#c8b799',{cut:true,kind:'soil',roughness:.04});
  for(let r=.3;r<1.9;r+=.2)rim(this.root,[r,r*.8],'#bca58b',.035);
  const pts=Array.from({length:70},(_,i)=>[Math.cos(i*.6)*.22+(i/69-.5)*2.4,Math.sin(i*.6)*.22,.25]);tag(path(this.root,pts,.045,'#9cae80'),'amylose','Amylose chain','APBIO-1.4-01');
 },
 polypeptide:makePeptide,
 rrna(){
  for(let k=0;k<4;k++){
   const points=Array.from({length:50},(_,i)=>{const a=i/49*Math.PI*2;return [(k-1.5)*.8+Math.cos(a)*.38,Math.sin(a)*1.3,Math.sin(a*3+k)*.3];});path(this.root,points,.065,k%2?'#9da9c1':'#b197b6');
   for(let i=0;i<8;i++)rod(this.root,[(k-1.5)*.8-.25,(i-3.5)*.21,0],[(k-1.5)*.8+.25,(i-3.5)*.21,0],.035,'#bcbba5');
  }
 },
 chlorophyll(){chlorophyll(this.root);},
 photosystem(){photosystem(this.root);},
 cytosol(){
  for(let i=0;i<85;i++){const a=i*2.4,r=Math.sqrt(i/85)*2.1;ball(this.root,[Math.cos(a)*r,Math.sin(a)*r,Math.sin(i*1.3)*1.4],.035,'#88bfc5','atom');}
  for(let i=0;i<8;i++){const a=i*2.4;tag(organic(this.root,[Math.cos(a)*1.5,Math.sin(a)*1.5,Math.sin(i)*.8],[.35,.28,.3],i%2?'#8799b2':'#b5a482',{roughness:.16}),'enzyme','Cytosolic enzyme','APBIO-3.1-01');}
 },
 epithelium(){
  epithelialMatrix(this.root);
  mesh(this.root,new THREE.BoxGeometry(5,.18,3),surface('#a28b9b'),[0,-.65,0]);
  for(let x=0;x<6;x++)for(let z=0;z<4;z++){
   const cell=group(this.root,[(x-2.5)*.79,0,(z-1.5)*.72]);organic(cell,[0,0,0],[.39,.58,.35],'#b99c9e',{roughness:.02});organic(cell,[0,.15,.25],[.17,.2,.12],'#887195',{roughness:.05});tag(cell,'animal-cell','Epithelial cell','APBIO-2.1-04');
  }
 },
 rabbit(){
  const g=rabbit(this.root,'#94816a',true);g.scale.setScalar(5);tag(g,'epithelium','Epithelial tissue','APBIO-2.1-04');
  const ground=terrain(this.root);ground.scale.set(.44,.3,.31);ground.position.y=-.04;groundCover(this.root,1.9);
 },
 'rabbit-population'(){
  terrain(this.root);woodlandFloor(this.root,{full:false});groundCover(this.root,4.7);const animals=[],colors=['#706982','#ad93a3','#c5b798'];
  for(let genotype=0;genotype<3;genotype++)for(let i=0;i<24;i++){
   const a=i*2.4,r=.7+Math.sqrt(i/24)*3.7,object=rabbit(this.root,colors[genotype]);object.position.set(Math.cos(a)*r,.1,Math.sin(a)*r);object.rotation.y=a;tag(object,'rabbit','Rabbit','APBIO-8.3-01');animals.push({object,genotype,index:i});
  }
  this.processRig={update(s){const f=s?.zygotes||[.1225,.455,.4225],aa=Math.round(f[0]*24),ab=Math.round(f[1]*24),counts=[aa,ab,24-aa-ab];
   for(const p of animals){const start=p.genotype===0?0:p.genotype===1?aa:aa+ab;p.object.visible=p.index>=start&&p.index<start+counts[p.genotype];let scale=1;if(s&&s.generation<12){if(s.cycle>.33&&p.index-start>=Math.ceil(counts[p.genotype]*s.fitness[p.genotype]))scale=1-interval(s.cycle,.33,.65);else if(s.cycle<.2&&s.generation>0)scale=.3+.7*interval(s.cycle,0,.2);}p.object.scale.setScalar(Math.max(.001,scale));}
  }};
 },
 seed(){
  organic(this.root,[0,0,0],[1.8,2.25,1.2],'#84664a',{cut:true,roughness:.07,kind:'bark'});rim(this.root,[1.8,2.25],'#ba9f76',.07);
  organic(this.root,[-.65,.1,.05],[.8,1.7,.48],'#d0bc84',{roughness:.04});organic(this.root,[.65,.1,.05],[.8,1.7,.48],'#c6b57e',{roughness:.04});
  path(this.root,[[0,.6,.4],[.2,.1,.4],[0,-.7,.3],[-.25,-1.65,.1]],.14,'#a0ae77');
 },
};

export function makeCircularDNA(){
 const strands=[[],[]];
 for(let i=0;i<=120;i++){const a=i/120*Math.PI*2;for(let s=0;s<2;s++){const twist=a*12+s*Math.PI,r=1.8+.12*Math.cos(twist);strands[s].push([Math.cos(a)*r,Math.sin(a)*r,.12*Math.sin(twist)]);}if(i%2===0)rod(this.root,strands[0].at(-1),strands[1].at(-1),.025,'#b2a5b6','atom');}
 strands.forEach((p,i)=>path(this.root,p,.035,i?'#87b5ae':'#d1b17a','atom'));
}

export function makeThylakoid(){
 organic(this.root,[0,0,0],[2.3,.45,1.2],'#658b43',{cut:true,roughness:.035});
 organic(this.root,[0,0,.015],[2.18,.34,1.07],'#b1c078',{cut:true,roughness:.02});rim(this.root,[2.3,.45],'#8fa863',.04);
 for(let i=0;i<3;i++){const ps=photosystem(this.root,.32);ps.position.set((i-1)*1.3,.35,-.1);}
 this.processRig=this.makeEnergyRig(true);this.energyAnnotations(true);
}
