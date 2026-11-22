import * as THREE from 'three';
import {ball,rod,path,organic,mesh,surface,group,rim} from '../surfaces.js';
import {cellAnatomy,organelleAnatomy} from '../detailed-models.js';
import {sampleLab} from './labs.js';
import {clamp,ramp,point,transportPositions} from './visual-state.js';
const C={head:'#8daaa0',tail:'#c5ab77',cargo:'#60b8b9',active:'#d9b85d',inactive:'#8094a0',red:'#b96650'};
const box=(a,b)=>new THREE.Box3(new THREE.Vector3(...a),new THREE.Vector3(...b));
function carrier(parent){const g=group(parent);organic(g,[0,0,0],[.22,.22,.22],'#caa0af',{cut:true});rim(g,[.22,.22],'#e3bcc4',.015);return g;}
function protein(parent,p,c=C.cargo,r=.09){const g=group(parent,p);for(let i=0;i<6;i++)ball(g,[Math.cos(i*2.4)*r,Math.sin(i*2.4)*r,Math.sin(i)*r*.7],r*.6,c,'atom');return g;}
function membrane(parent,{pore=false}={}){
 const tails=[];
 for(let i=-6;i<=6;i++)for(let z=-2;z<=2;z++){
  const x=i*.38,depth=z*.34;if(pore&&Math.abs(x)<.65&&Math.abs(depth)<.65)continue;
  for(const side of [-1,1]){
   ball(parent,[x,side*.62,depth],.14,C.head,'membrane');
   for(const dx of [-.055,.055]){
    const pts=[[x+dx,side*.51,depth],[x+dx+.035,side*.29,depth],[x+dx-.025,side*.07,depth]];
    const tail=path(parent,pts,.031,C.tail);tails.push({tail,base:tail.geometry.attributes.position.array.slice(),side,x});
   }
  }
 }
 return tails;
}
export function makeCellularLesson(kind,visual){
 const supported=['organelles','cell-size','lipid','membrane-fluidity','permeability','active-transport','channel','osmosis','vesicles','compartments','endosymbiosis','enzyme','enzyme-environment','coupling','photosynthesis','respiration','communication','reception','cascade'];
 if(!supported.includes(kind))return false;
 const root=this.root,updates=[];
 let bounds=box([-3.6,-2.7,-2],[3.6,2.7,2]);
 const label=(text,p,visibleWhen)=>{this.annotation(text,p,{processOnly:true,visibleWhen});return this.annotations.at(-1).element;};
 const finish=()=>{this.processRig={bounds,cameraScale:.92,visualFamily:`cellular-${kind}`,update:s=>{const state=s||sampleLab(kind,0);updates.forEach(f=>f(state));}};this.processRig.update(null);return true;};
 if(['organelles','vesicles','cell-size','osmosis','endosymbiosis'].includes(kind)){
  const body=cellAnatomy(root,false);
  if(kind==='organelles'){
   bounds=box([-3.7,-2.7,-1.9],[4.1,2.7,2]);
   const packets=Array.from({length:12},(_,i)=>protein(root,[-1.5+(i%4)*.15,-.7+Math.floor(i/4)*.15,.95],C.cargo,.045));
   const vessels=Array.from({length:4},()=>carrier(root));
   label('Rough ER',[-1.45,-1.35,1]);label('Golgi',[1.15,-1.2,1.15]);
   const status=label('',[.1,2.5,.2]);
   updates.push(s=>{
    status.textContent=s.blocked?'Cargo retained in ER':`Cargo released: ${s.value} / 12`;
    const route=t=>t<.22?[-1.4,-.6,1]:t<.43?point([-1.4,-.6,1],[.9,-.5,1.1],ramp(t,.22,.43)):t<.58?point([.9,-.5,1.1],[1.2,-.8,1.1],ramp(t,.43,.58)):point([1.2,-.8,1.1],[2.9,.1,.6],ramp(t,.58,.65));
    vessels.forEach((v,i)=>{const t=s.blocked?.16:s.t;v.position.set(...route(t));v.position.y+=(i-1.5)*.12;v.visible=!s.blocked&&((t>.22&&t<.43)||(t>.58&&t<.65));v.scale.setScalar(.65);});
    packets.forEach((p,i)=>{const a=route(s.blocked?.16:s.t);const released=i<s.value;if(released){a[0]=3.2+(i%3)*.18;a[1]=.1+(Math.floor(i/3)-1.5)*.16;}else{a[0]+=(i%3-1)*.1;a[1]+=(Math.floor(i/3)-1.5)*.1;}p.position.set(...a);});
   });
  }else if(kind==='vesicles'){
   bounds=box([-3.7,-2.7,-1.9],[4.2,2.7,2]);
   const ves=carrier(root);ves.scale.setScalar(1.7);
   const cargo=Array.from({length:6},(_,i)=>protein(root,[0,0,0],C.cargo,.05));
   const status=label('',[.2,2.5,.2]);label('Cell interior',[1,.45,1.3]);label('Cell exterior',[3.6,1,.5]);
   updates.push(s=>{const u=s.inward?1-s.t:s.t,pos=point([1.8,-.3,1],[2.85,.15,.5],ramp(u,0,.55));ves.position.set(...pos);ves.visible=u<.55;ves.scale.set(1.7*(1+.3*ramp(u,.4,.55)),1.7,1.7);cargo.forEach((p,i)=>{const f=ramp(u,.55,1);p.position.set(pos[0]+f*.95+(i%2-.5)*.13,pos[1]+(i%3-1)*(.1+.2*f),pos[2]+.1*Math.sin(i));});status.textContent=`${s.inward?'Membrane encloses cargo':'Vesicle fuses with membrane'} · ${s.value} packets outside`;});
  }else if(kind==='cell-size'||kind==='osmosis'){
   bounds=box([-4.3,-3.5,-2.4],[4.3,3.5,2.4]);
   const skin=[];body.traverse(o=>{if(o.isMesh&&o.userData.inspect==='membrane')skin.push({o,scale:o.scale.clone()});});
   const waters=Array.from({length:24},()=>ball(root,[0,0,0],.055,'#7ac4db','atom'));
   const solute=Array.from({length:28},(_,i)=>protein(root,[Math.cos(i*2.4)*3.6,Math.sin(i*2.4)*2.8,.4],C.active,.055));
   const status=label('',[0,3.15,.3]);
   updates.push(s=>{
    if(kind==='cell-size'){body.scale.setScalar(s.radius/4);status.textContent=`Radius ${s.radius.toFixed(1)} μm · surface / volume ${s.value.toFixed(2)} μm⁻¹`;}
    else{skin.forEach(({o,scale})=>o.scale.copy(scale).multiplyScalar(s.radius));status.textContent=`Cell volume ${s.value.toFixed(2)} × initial · solute stays outside`;}
    solute.forEach((o,i)=>o.visible=kind==='osmosis'&&i<(s.condition==='hypotonic'?6:s.condition==='isotonic'?16:28));
    waters.forEach((w,i)=>{w.visible=kind==='osmosis';const inward=s.condition==='hypotonic'?i<18:s.condition==='isotonic'?i%2===0:i<6;const u=(s.t*2+i/24)%1,a=i*2.399,r=inward?3.8-1.4*u:2.4+1.4*u;w.position.set(Math.cos(a)*r,Math.sin(a)*r*.76,.8);});
   });
  }else{
   body.scale.setScalar(.65);body.position.x=.85;
   const mitochondrion=organelleAnatomy(root,false);mitochondrion.scale.setScalar(.45);mitochondrion.position.set(-2,.1,.9);
   const ring=path(root,Array.from({length:33},(_,i)=>[-2+.32*Math.cos(i/32*Math.PI*2),.12+.24*Math.sin(i/32*Math.PI*2),1.45]),.026,'#e6c784');
   label('Bacterial-like circular DNA',[-2,-.7,1.2]);label('Compartment within a cell',[1.1,2.1,.2]);
   const status=label('',[0,-2.3,.5]);updates.push(s=>{ring.visible=s.supported&&s.value>0;status.textContent=s.supported?'Sequence and ribosome evidence support ancestry':'Rounded shape alone does not establish ancestry';});
  }
  return finish();
 }
 if(['membrane','transport','gradient'].includes(visual)){
  const pore=kind==='channel'||kind==='active-transport',tails=membrane(root,{pore});
  let gate,pumpGates;
  if(pore){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;organic(root,[Math.cos(a)*.48,0,Math.sin(a)*.48],[.19,.91,.19],i%2?'#ab86a5':'#836a94',{roughness:.13});}gate=organic(root,[0,0,0],[.38,.18,.38],'#ad87a3');}
  if(kind==='active-transport')pumpGates=[-.53,.53].map(y=>organic(root,[0,y,0],[.36,.095,.36],'#b79ac2'));
  if(visual==='membrane'){
   label('Water-facing heads',[0,1.1,.6]);label('Nonpolar tails',[0,-1.2,.6]);
   updates.push(s=>tails.forEach(({tail,base,side,x},j)=>{const p=tail.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=base[i*3+1],bend=s.bent&&j%3===0?Math.max(0,.34-Math.abs(y))*.7:0;p.setXYZ(i,base[i*3]+bend, y,base[i*3+2]+.012*Math.sin(s.t*6+x));}p.needsUpdate=true;tail.geometry.computeVertexNormals();}));
  }else{
   const dots=transportPositions(kind,sampleLab(kind,0)).map(()=>ball(root,[0,0,0],.075,C.cargo,'atom'));
   const status=label('',[0,2.7,.5]);label(kind==='active-transport'?'Initially dilute':'Outside',[1.8,1.95,.2]);label(kind==='active-transport'?'Initially concentrated':'Inside',[1.8,-1.95,.2]);
   const atp=protein(root,[-1,-1,.8],C.active,.12);atp.visible=kind==='active-transport';
   updates.push(s=>{const ps=transportPositions(kind,s);dots.forEach((d,i)=>d.position.set(...ps[i]));if(gate)gate.visible=s.blocked;
    if(pumpGates){const phase=(12*ramp(s.t,.15,.85))%1;pumpGates[0].scale.set(s.blocked||phase<.6?1:.15,1,s.blocked||phase<.6?1:.15);pumpGates[1].scale.set(s.blocked||phase>.4?1:.15,1,s.blocked||phase>.4?1:.15);}
    atp.visible=kind==='active-transport'&&!s.blocked;atp.rotation.y=s.t*8;
    status.textContent=kind==='active-transport'?(s.blocked?'No ATP · pump stopped':'ATP → ADP + Pᵢ · uphill transport'):kind==='channel'?(s.blocked?'Closed channel':`${24-s.value} outside / ${s.value} inside`):kind==='compartments'?`${Math.round(s.value)}% of initial difference retained`:s.blocked?'Hydrated ions excluded':'Small nonpolar solute crosses the lipid core';
   });
  }
  return finish();
 }
 if(visual==='enzyme'){
  this.makeEnzyme();const reaction=this.processRig;
  bounds=box([-2,-2,-1],[3.6,2,1.5]);
  const status=label('',[.5,1.8,.5]);
  const extra=Array.from({length:7},(_,i)=>protein(root,[2.7+(i%2)*.35,-1.2+(Math.floor(i/2))*.65,-.3],C.active,.08));
  updates.push(s=>{const activity=kind==='enzyme'?1:s.value/100;reaction.update({t:s.t*activity});extra.forEach(p=>p.visible=kind==='enzyme'&&s.substrate>1);status.textContent=kind==='enzyme'?`Substrate ${s.substrate} · initial rate ${s.value.toFixed(2)}`:`pH ${s.ph} · relative activity ${s.value.toFixed(1)}%`;});return finish();
 }
 if(visual==='photosynthesis'||visual==='respiration'){
  const light=visual==='photosynthesis';this.makeOrganelle(light?'chloroplast':'mitochondrion');const reaction=this.processRig;
  bounds=box([-3.2,-3.3,-1.2],[3.3,2.2,2]);
  const carbon=Array.from({length:6},()=>protein(root,[0,0,0],C.red,.065));
  const product=Array.from({length:4},()=>protein(root,[0,0,0],C.cargo,.09));
  const loop=path(root,Array.from({length:41},(_,i)=>[Math.cos(i/40*Math.PI*2)*.6,1.25+Math.sin(i/40*Math.PI*2)*.3,.8]),.025,C.active);
  label(light?'Stromal carbon fixation':'Carbon oxidation / carrier reduction',[0,1.95,.5]);
  label(light?'CO₂':'CO₂ released',[light?-1.3:2.3,1.6,1],s=>light?!!s?.carbon:!!s?.oxygen);
  updates.push(s=>{
   const input=light?(s.light?1:0):(s.oxygen?1:0);reaction.update({...s,energyInput:input,coupling:input});
   loop.visible=light?s.light&&s.carbon:s.oxygen;
   carbon.forEach((c,i)=>{c.visible=light?s.carbon:s.oxygen;const u=clamp(s.t*1.5-i*.06);c.position.set(...(light?point([-2.8,1.3,.8],[-.6,1.3,.8],u):point([.6,1.3,.8],[2.9,1.5,.8],u)));});
   product.forEach((p,i)=>{p.visible=light?s.value>(i*3):s.recycled&&s.t>.2;p.position.set(1+i*.36,1.25,.8);});
  });return finish();
 }
 if(visual==='energy'){
  const enzyme=organic(root,[0,0,0],[.85,.7,.55],'#759cab',{roughness:.16});
  const adp=protein(root,[-1.6,1,0],C.cargo,.14),phosphate=ball(root,[-1.2,1,0],.13,C.active,'atom');
  const reactants=[protein(root,[-2,-.7,0],C.red,.16),protein(root,[-1.4,-.7,0],'#b5a0be',.16)];
  const bond=rod(root,[1.5,-.7,0],[2.1,-.7,0],.05,C.cargo);
  label('ATP → ADP + Pᵢ',[-1.6,1.7,.3]);label('Coupled reaction',[.2,1.4,.3]);const status=label('',[0,-1.65,.4]);
  updates.push(s=>{const a=ramp(s.t,.1,.4),b=s.blocked?0:ramp(s.t,.5,1);adp.position.x=-1.6+.9*a;phosphate.position.set(-1.2+1.3*a,-.1*a+1*(1-a),.2);reactants.forEach((r,i)=>r.position.set(-2+i*.6+3.5*b,-.7,.2));bond.visible=b>.95;enzyme.scale.y=s.blocked?1:1-.07*Math.sin(s.t*Math.PI);status.textContent=s.blocked?'Uncoupled: the +12 kJ/mol step remains unfavorable':'Coupled: ΔG = −30 + 12 = −18 kJ/mol';});return finish();
 }
 if(visual==='signal'){
  const border=group(root,[-1.4,0,0]);border.rotation.z=Math.PI/2;border.scale.setScalar(.75);membrane(border,{pore:true});
  const receptor=group(root,[-1.4,0,.15]);for(const y of [-.28,.28]){organic(receptor,[0,y,0],[.6,.16,.24],'#a18eb6',{roughness:.13});organic(receptor,[-.38,y*1.4,0],[.18,.23,.23],'#b9a3c7');}
  const ligand=protein(root,[-3,0,.2],C.active,.18);
  const relays=Array.from({length:4},(_,i)=>organic(root,[-.2,(i-1.5)*.7,.2],[.22,.2,.2],C.inactive,{roughness:.13}));
  const targets=Array.from({length:20},(_,i)=>organic(root,[.65+(i%5)*.43,(Math.floor(i/5)-1.5)*.7,.2],[.13,.13,.13],C.inactive,{roughness:.1}));
  // Each molecule keeps its own activation state after view-local material cloning.
  for(const [i,molecule] of [...relays,...targets].entries()){molecule.name=i<4?'signal-relay':'signal-target';molecule.material=molecule.material.clone();}
  const branches=relays.map((r,i)=>path(root,[[-.85,0,.1],[-.5,r.position.y*.5,.1],[-.2,r.position.y,.1]],.016,'#a3b8a2'));
  const block=group(root,[-.2,0,.6]);rod(block,[-.3,-.35,0],[.3,.35,0],.035,C.red);rod(block,[-.3,.35,0],[.3,-.35,0],.035,C.red);
  label('Signal',[-2.8,1.4,.2]);label('Receptor',[-1.4,2.5,.2]);label('Relays',[.0,1.7,.3]);label('Targets',[1.7,1.7,.3]);
  const status=label('',[0,-2.15,.5]);
  updates.push(s=>{
   const delivery=kind==='communication'&&s.blocked?.2:1;ligand.visible=!s.constitutive;ligand.position.x=-3+1.25*clamp(s.t/.18)*delivery;
   const input=!(kind==='communication'&&s.blocked)&&!(kind==='reception'&&s.blocked),relayActive=input&&s.t>.25&&!(kind==='cascade'&&(s.blocked||s.bypass));
   block.visible=(kind==='cascade'&&(s.blocked||s.bypass))||(kind==='reception'&&s.blocked);block.position.x=kind==='reception'?-1.4:-.2;
   relays.forEach((r,i)=>r.material.color.set(relayActive&&s.t>.25+i*.04?C.active:C.inactive));branches.forEach(b=>b.visible=relayActive);
   const count=kind==='cascade'?s.value:Math.round(s.value/5);targets.forEach((r,i)=>r.material.color.set(i<count?C.cargo:C.inactive));
   status.textContent=kind==='cascade'?(s.bypass?'Downstream activation bypasses blocked relays':s.blocked?'Relay block prevents downstream activation':`1 receptor → 4 relays → ${s.value} active targets`):kind==='reception'?(s.constitutive?'Constitutive receptor: response without ligand':s.blocked?'Ligand present · receptor cannot signal':'Reception → transduction → response'):s.blocked?'Short-range signal does not reach the distant target':'Signal reaches a receptive target';
  });return finish();
 }
 return false;
}
