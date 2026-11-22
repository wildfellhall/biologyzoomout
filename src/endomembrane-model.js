import * as THREE from 'three';
import {ball,rod,path,organic,mesh,surface,group,tag} from './surfaces.js';
import {endomembraneState} from './endomembrane-state.js';

const mix=(a,b,t)=>a+(b-a)*t;
const point=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
function tubule(parent,points,r,color){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 return mesh(parent,new THREE.TubeGeometry(curve,96,r,20,false),surface(color,'membrane',{roughness:.48,bumpScale:.03}));
}
// A thick curved membrane with an exposed front edge. Parallel faces represent
// a compartment wall, not individual lipid leaflets at this scale.
function membrane(parent,y,width,depth,color,thickness=.065){
 const geo=new THREE.BoxGeometry(width*2,thickness,depth*2,48,1,14),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,p.getY(i)+.1*x*x+.035*Math.sin(x*3+z));}
 geo.computeVertexNormals();return mesh(parent,geo,surface(color),[0,y,0]);
}
function sac(parent,y,width,color,opening=.1){
 const g=group(parent,[0,y,0]);
 membrane(g,opening,width,.58,color);membrane(g,-opening,width,.58,color);
 // Rounded sealed ends, with the front cutaway left open to show luminal cargo.
 for(const side of [-1,1])organic(g,[side*width,.1*width*width,0],[.17,opening+.05,.59],color,{roughness:.025});
 path(g,[[-width,-.02,-.58],[0,0,-.58],[width,-.02,-.58]],opening+.01,color);
 return g;
}
function cargo(parent,color='#69bfc0'){
 const g=group(parent);
 for(let i=0;i<9;i++){const a=i*2.4;ball(g,[Math.cos(a)*.11,Math.sin(a)*.12,Math.sin(i*1.2)*.1],.075,color,'atom');}
 return g;
}
function carrier(parent,color='#c796a3'){
 const g=group(parent);const shell=organic(g,[0,0,0],[.33,.33,.33],color,{cut:true,roughness:.04});
 const edge=mesh(g,new THREE.TorusGeometry(.33,.025,8,40),surface(color));
 tag(shell,'vesicle','Transport vesicle');tag(edge,'vesicle','Transport vesicle');
 return g;
}
const up=new THREE.Vector3(0,1,0),aVec=new THREE.Vector3(),bVec=new THREE.Vector3();
function bondBetween(bond,a,b,r=.035){aVec.set(...a);bVec.set(...b).sub(aVec);bond.position.copy(aVec).addScaledVector(bVec,.5);bond.scale.set(r,bVec.length(),r);bond.quaternion.setFromUnitVectors(up,bVec.normalize());}
const bounds=(a,b)=>new THREE.Box3(new THREE.Vector3(...a),new THREE.Vector3(...b));

export function makeRoughER(){
 const root=this.root,background=group(root,[0,-.85,-.65]);
 for(let i=0;i<3;i++)sac(background,-i*.34,1.8-i*.14,['#ad8b7d','#bc9b86','#cfad96'][i]);
 // Enlarged connected cisterna: cut away the front half of the upper membrane.
 const chamber=group(root);membrane(chamber,-.6,2,.75,'#b98d76');
 const roof=membrane(chamber,.35,2,.55,'#cda68c');roof.position.z=-.2;
 for(const side of [-1,1])organic(chamber,[side*2,.1,0],[.16,.53,.74],'#cda68c',{roughness:.025});
 const rib=group(root,[-.6,.91,.16]);
 tag(organic(rib,[0,.18,0],[.46,.34,.36],'#a37794',{roughness:.16}),'ribosome','ER-bound ribosome');
 tag(organic(rib,[0,-.18,.02],[.38,.17,.3],'#c4a576',{roughness:.14}),'ribosome','ER-bound ribosome');
 const channel=mesh(root,new THREE.TorusGeometry(.13,.065,12,24),surface('#668d91'),[-.6,.39,.16]);channel.rotation.x=Math.PI/2;
 path(root,[[-1.8,.86,.5],[-.95,.83,.5],[-.6,.83,.5],[.1,.86,.46],[1.2,1.04,.38]],.035,'#879fae');
 for(let i=0;i<23;i++)ball(root,[-1.7+i*.125,.86+Math.max(0,i-14)*.016,.5],.045,i%3?'#92b2bd':'#d6ba80','atom');
 for(let i=0;i<5;i++){const x=.15+i*.32;tag(organic(root,[x,.52+.1*x*x,-.48],[.12,.1,.1],'#9a6d88',{roughness:.12,detail:16}),'ribosome','Bound ribosome');}
 const active=group(root),beads=Array.from({length:18},()=>ball(active,[0,0,0],.07,'#68babc','atom'));
 const bonds=Array.from({length:17},()=>rod(active,[0,0,0],[0,1,0],.035,'#7fc4c2','atom'));
 const ves=carrier(active,'#cda68c');
 this.annotation('Cytosol',[-1.9,1.55,.2],{processOnly:true});
 this.annotation('ER lumen',[.3,-.38,1],{processOnly:true});
 this.annotation('Toward Golgi',[2.7,.7,.4],{processOnly:true,after:.76});
 this.processRig={bounds:bounds([-2.3,-2.05,-1.4],[3.3,1.75,1.1]),cameraScale:.94,update(s){
  active.visible=!!s;if(!s)return;
  const v=endomembraneState('er-protein',s.t),positions=[];
  for(let i=0;i<18;i++){
   const fraction=i/17,unfolded=[-.6+Math.sin(i*.85)*.12,.36-fraction*.83,.22+Math.cos(i*.7)*.09];
   const folded=[.25+Math.cos(i*2.4)*.17,-.13+Math.sin(i*2.4)*.17,.26+Math.sin(i*1.3)*.15];
   let pos=point(unfolded,folded,v.fold);pos=point(pos,[folded[0]+2.65,folded[1]+.15,folded[2]],v.export);
   positions.push(pos);beads[i].visible=i<v.residues;beads[i].position.set(...pos);
   if(i){bonds[i-1].visible=i<v.residues;bondBetween(bonds[i-1],positions[i-1],pos);}
  }
  rib.position.y=.91+(1-v.dock)*.3;
  ves.visible=s.t>=.76;ves.position.set(.25+2.65*v.export,-.13+.15*v.export,.26);ves.scale.setScalar(Math.min(1,(s.t-.76)/.06));
 }};
}

export function makeGolgi(){
 const root=this.root,stack=group(root),plates=[];
 const colors=['#b897aa','#c39aa8','#cba5ac','#d0aa9c','#c2a17f'];
 for(let i=0;i<5;i++)plates.push(sac(stack,1.3-i*.65,1.55-Math.abs(i-2)*.1,colors[i],.25));
 for(let i=0;i<7;i++){
  const p=carrier(root,colors[i%5]);p.position.set((i%2?1:-1)*(1.7+(i%3)*.15),1.1-i*.33,-.5);p.scale.setScalar(.33);
 }
 const moving=group(root),incoming=carrier(moving),outA=carrier(moving,'#b9a179'),outB=carrier(moving,'#c59bb0');
 const proteinA=cargo(moving),proteinB=cargo(moving,'#d3ac62');
 proteinA.scale.setScalar(.48);proteinB.scale.setScalar(.48);
 const sugarA=group(proteinA),sugarB=group(proteinB),sugars=[];
 for(const parent of [sugarA,sugarB])for(let i=0;i<3;i++){const sub=group(parent,[.1+i*.08,.16+i*.07,0]);ball(sub,[0,0,0],.048,'#da8d76','atom');rod(sub,[-.08,-.07,0],[0,0,0],.016,'#da8d76','atom');sugars.push(sub);}
 this.annotation('cis · receiving',[-1.2,1.9,.3],{processOnly:true});
 this.annotation('trans · sorting',[-1.3,-1.8,.4],{processOnly:true});
 this.annotation('Cell surface',[2.7,.2,.5],{processOnly:true,after:.82});
 this.annotation('Endosome',[2.7,-1.8,.5],{processOnly:true,after:.82});
 this.processRig={bounds:bounds([-2.8,-2.2,-.9],[3.25,2.1,1.2]),cameraScale:.95,update(s){
  moving.visible=!!s;
  if(!s){plates.forEach((p,i)=>p.position.y=1.3-i*.65);return;}
  const v=endomembraneState('golgi-sorting',s.t),y=1.3-2.6*v.maturation;
  // Follow one cargo-bearing cisterna as it matures; the other cisternae
  // cycle in behind it. Cargo stays in its lumen, never crosses a membrane.
  plates.forEach((p,i)=>{p.position.y=i===0?y:1.3-((i+4*v.maturation)%5)*.65;});
  const arrival=point([-2.35,1.75,.3],[0,1.3,.3],v.arrival),center=s.t<.22?arrival:[0,y,.3];
  incoming.position.set(...arrival);incoming.visible=s.t<.22;
  const split=v.sort*.4;
  for(const [i,p]of [proteinA,proteinB].entries()){
   const start=[center[0]+(i?1:-1)*(.12+split),center[1],center[2]];
   // Leave through the cisternal rim before separating toward destinations;
   // an upward diagonal inside the stack would falsely cross other membranes.
   const exit=[1.95,y+.24,.3],progress=v.departure;
   let pos;
   if(progress<.6){pos=point(start,exit,progress/.6);pos[1]=y+.1*Math.min(1.55,Math.abs(pos[0]))**2;if(s.t<.22)pos=start;}
   else pos=point(exit,[2.8,i?-1.5:-.05,.4],(progress-.6)/.4);
   p.position.set(...pos);p.scale.setScalar(.48+.22*Math.max(0,(progress-.6)/.4));
   const ves=i?outB:outA;ves.visible=s.t>=.82&&pos[0]>1.35;ves.position.copy(p.position);ves.scale.setScalar(Math.min(1,Math.max(0,(pos[0]-1.35)/.5)));
  }
  sugars.forEach((p,i)=>p.visible=i%3<v.glycans);
 }};
}

function lipid(parent,color='#e1bc73'){
 const g=group(parent);ball(g,[0,0,0],.095,'#81a6a1','atom');
 for(const side of [-1,1])path(g,[[side*.04,-.06,0],[side*.055,-.2,0],[side*.07+(side>0?.06:0),-.36,.015]],.028,color,'atom');
 return g;
}
export function makeSmoothER(){
 const root=this.root,network=group(root,[0,-.45,-.5]);
 for(let i=0;i<6;i++){
  const x=(i-2.5)*.63;
  tubule(network,[[x,-.65,-.2],[x+.25,-.2,.18],[x-.17,.4,-.1],[x+.18,.9,.1]],.13,i%2?'#b4a675':'#a99868');
 }
 for(let j=0;j<4;j++)tubule(network,[[-1.65,j*.39-.55,-.1],[-.7,j*.39-.35,.1],[.45,j*.39-.55,-.05],[1.75,j*.39-.25,.1]],.115,'#b6a777');
 // Magnified membrane patch, with a front cutaway through both leaflets.
 const patch=group(root,[0,.35,.65]);
 for(let i=0;i<17;i++)for(const side of [-1,1]){
  const l=lipid(patch,'#b7a16a');l.position.set((i-8)*.21,side*.4,-.15);if(side<0)l.rotation.z=Math.PI;
 }
 const enzyme=organic(patch,[-1.45,.65,0],[.27,.25,.22],'#829a93',{roughness:.1});
 const scramblase=organic(patch,[1.35,0,-.05],[.19,.56,.23],'#9a809b',{roughness:.13});
 const lipidGroup=group(root),newLipids=Array.from({length:4},()=>lipid(lipidGroup));
 const precursors=Array.from({length:8},(_,i)=>ball(lipidGroup,[0,0,0],.065,i%2?'#81a6a1':'#d4b275','atom'));
 const calcium=group(root),ions=Array.from({length:12},()=>ball(calcium,[0,0,0],.065,'#83c7da','atom'));
 this.annotation('Cytosol',[-1.65,1.75,.6],{processOnly:true});
 this.annotation('ER lumen',[-1.55,-.5,1],{processOnly:true});
 this.annotation('Lipid synthesis',[-1.4,1.35,.7],{processOnly:true,visibleWhen:s=>s?.id==='er-lipids'&&s.t<.74});
 this.annotation('Scramblase',[1.4,1.15,.7],{processOnly:true,after:.74,visibleWhen:s=>s?.id==='er-lipids'});
 this.annotation('ATP-powered pump',[-1.25,1.2,.8],{processOnly:true,visibleWhen:s=>s?.id==='er-calcium'&&(s.t<.48||s.t>=.72)});
 this.annotation('Ca²⁺ release channel',[1.25,1.2,.8],{processOnly:true,visibleWhen:s=>s?.id==='er-calcium'&&s.t>=.48&&s.t<.72});
 this.processRig={bounds:bounds([-2.1,-1.4,-1],[2.1,1.9,1.3]),cameraScale:.95,update(s){
  lipidGroup.visible=s?.id==='er-lipids';calcium.visible=s?.id==='er-calcium';
  enzyme.visible=true;scramblase.visible=true;
  enzyme.position.y=s?.id==='er-calcium'?0:.65;enzyme.scale.y=s?.id==='er-calcium'?2.2:1;
  if(!s)return;const v=endomembraneState(s.id,s.t);if(!v)return;
  if(s.id==='er-lipids'){
   newLipids.forEach((l,i)=>{
    l.visible=v.assembly>.65;const x=-.9+i*.43;
    const base=point([-1.45+i*.16,1.28,.72],[x,.75,.65],v.insert);
    // Two new lipids flip through a protein-mediated path, distributing
    // membrane growth between leaflets; tails remain within the bilayer.
    const progress=i<2?v.redistribute:0;
    const flip=Math.max(0,Math.min(1,(progress-.2)/.6));l.rotation.z=flip*Math.PI;
    if(progress<.2)l.position.set(mix(base[0],1.35,progress/.2),base[1],base[2]);
    else if(progress<=.8)l.position.set(1.35+.05*Math.sin(flip*Math.PI),.35+.4*Math.cos(flip*Math.PI),base[2]);
    else l.position.set(mix(1.35,base[0],(progress-.8)/.2),-.05,base[2]);
   });
   precursors.forEach((p,i)=>{p.visible=v.assembly<.85;p.position.set(...point([-1.9+(i%4)*.24,1.75+Math.floor(i/4)*.12,.65],[-1.45,1,.65],v.assembly));});
  }else{
   ions.forEach((p,i)=>{
    const outside=[-1.6+(i%6)*.59,1.3+Math.floor(i/6)*.24,.8],inside=[-1.4+(i%6)*.55,-.55-Math.floor(i/6)*.22,.8];
    let f;
    if(s.t<.48)f=Math.max(0,Math.min(1,v.pump*12-i));
    else if(s.t<.72)f=i<4?1:1-Math.max(0,Math.min(1,v.release*8-(i-4)));
    else f=i<4?1:Math.max(0,Math.min(1,v.pump*8-(i-4)));
    // Every crossing takes the protein route, never the bare lipid core.
    const x=s.t>=.48&&s.t<.72?1.35:-1.45;
    const pos=f<.25?point(outside,[x,1.15,.8],f*4):f<.75?point([x,1.15,.8],[x,-.45,.8],(f-.25)*2):point([x,-.45,.8],inside,(f-.75)*4);
    p.position.set(...pos);
   });
  }
 }};
}
