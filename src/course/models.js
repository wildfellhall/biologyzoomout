import * as THREE from 'three';
import {ball,rod,path,organic,group,mesh,surface} from '../surfaces.js';
import {contentFor} from './content.js';
import {labs,sampleLab} from './labs.js';
import {makeDivisionModel} from '../division-model.js';
const colors=['#7fa69c','#cfad72','#af90ad','#7f9eb8'];
const clamp=x=>Math.max(0,Math.min(1,x));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function bond(parent,a,b,r=.045,c=colors[0]){return rod(parent,a,b,r,c,'atom');}
function moveBond(object,a,b,r=.045){const x=new THREE.Vector3(...a),d=new THREE.Vector3(...b).sub(x);object.position.copy(x).addScaledVector(d,.5);object.scale.set(r,Math.max(.001,d.length()),r);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());}
function cell(parent,p,r=1,color='#a8bda0'){return organic(parent,p,[r,r*.82,r*.7],color,{roughness:.06,opacity:.18,depthWrite:false});}
function glyph(parent,p,c=colors[0],size=.13){const g=group(parent,p);organic(g,[0,0,0],[size,size*.8,size*.65],c);ball(g,[size*.65,size*.55,0],size*.5,c,'atom');return g;}
function plant(parent,x=0,c=colors[0]){const g=group(parent,[x,-1.1,0]);bond(g,[0,0,0],[0,1.7,0],.055,'#73906a');for(let i=0;i<5;i++){const side=i%2?1:-1;const leaf=organic(g,[side*.23,.3+i*.25,0],[.35,.09,.17],c,{kind:'leaf'});leaf.rotation.z=side*.4;}ball(g,[0,1.75,0],.13,colors[1],'atom');return g;}
function chromosomes(parent,n){return Array.from({length:n},(_,i)=>{const g=group(parent);bond(g,[0,-.42,0],[.03,.42,0],.085,colors[Math.floor(i/2)%2]);ball(g,[0,0,0],.11,colors[Math.floor(i/2)%2],'atom');return g;});}
function water(parent){const g=group(parent);ball(g,[0,0,0],.13,'#c97f6e','atom');for(const sign of [-1,1]){ball(g,[sign*.1423,.1102,0],.075,'#ece8d6','atom');bond(g,[0,0,0],[sign*.1423,.1102,0],.035,'#d0b49c');}return g;}

// These are spatial teaching models. Counts and rates are supplied by labs.js;
// renderer geometry is not used as a source of biological measurements.
export function makeCourseModel(data){
 const content=contentFor(data.topic),kind=content.sim,config=labs[kind],visual=config.visual,root=this.root;
 if(kind==='mitosis'||kind==='meiosis'){makeDivisionModel.call(this,kind);return;}
 if(visual==='replication'){this.makeDNA();return;}
 if(visual==='translation'){this.makeStructure('ribosome');return;}
 const updates=[];
 const label=(text,p)=>{this.annotation(text,p,{processOnly:true});return this.annotations.at(-1).element;};
 const atom=(p,r=.13,c=colors[0])=>ball(root,p,r,c,'atom');
 const frame=new THREE.Box3(new THREE.Vector3(-3,-2.1,-1.4),new THREE.Vector3(3,2.3,1.4));
 if(visual==='water'){
  const waters=Array.from({length:12},(_,i)=>water(root)),links=Array.from({length:20},()=>bond(root,[0,0,0],[1,0,0],.018,'#a7b8b1'));
  updates.push(s=>{const ps=waters.map((g,i)=>{const a=i*2.399+s.t*s.motion*.9,r=.7+Math.sqrt(i/12)*1.4,p=[Math.cos(a)*r,Math.sin(a)*1.15,.4*Math.sin(i+s.t*4)];g.position.set(...p);g.rotation.z=Math.sin(i+s.t*5)*s.motion;return p;});links.forEach((b,i)=>{b.visible=i<s.contacts;const a=i<12?i:i-12,j=i<12?(i+1)%12:(i-9)%12;moveBond(b,ps[a],ps[j],.018);});});label('Intermolecular contacts',[0,1.95,0]);
 }else if(visual==='assembly'){
  const pieces=Array.from({length:10},(_,i)=>{const g=group(root);ball(g,[0,0,0],.22,colors[0],'atom');ball(g,[.27,.08,0],.12,'#829cbe','atom');bond(g,[0,0,0],[.27,.08,0]);return g;});
  updates.push(s=>pieces.forEach((g,i)=>{const f=clamp(s.value/10-i);g.position.set(-2.5+i*.55,(1-f)*Math.sin(i*2)*1.4,0);g.scale.setScalar(.5+.5*f);g.visible=i<s.limit/10;}));label('Each assembled group represents 10 units',[0,1.7,0]);
 }else if(visual==='polymer'){
  const beads=Array.from({length:6},(_,i)=>atom([i*.7-1.75,0,0],.22,colors[i%3])),links=Array.from({length:5},(_,i)=>bond(root,[i*.7-1.75,0,0],[(i+1)*.7-1.75,0,0],.065));const waters=[water(root),water(root)];
  updates.push(s=>{beads.forEach((b,i)=>{const separated=s.broken>0&&i>1?Math.min(s.broken,Math.floor((i+1)/2))*.23:0;b.position.set(i*.7-1.75,separated,Math.sin(i)*.15);});links.forEach((b,i)=>{b.visible=!(s.broken>0&&(kind==='carbohydrate'?i<s.broken:[1,3].slice(0,s.broken).includes(i)));moveBond(b,beads[i].position.toArray(),beads[i+1].position.toArray(),.065);});waters.forEach((g,i)=>{g.visible=kind==='polymer'&&i<(s.condition==='two'?2:1);g.position.set(i? .7:-.7,.9-.6*s.t,.3);});});label('Residues remain; connections change',[0,1.7,0]);
 }else if(visual==='membrane'){
  const tails=[];for(let side=0;side<2;side++)for(let i=0;i<12;i++){const x=i*.43-2.36,y=side?.85:-.85;atom([x,y,0],.14,colors[1]);for(const dx of [-.06,.06]){const a=[x+dx,y,0],b=[x+dx,side?.08:-.08,0];const midpoint=[x+dx,y*.5,0];bond(root,a,midpoint,.035,'#a98d68');tails.push({mesh:bond(root,midpoint,b,.035,'#a98d68'),a:midpoint,b,i,side});}}
  updates.push(s=>tails.forEach(t=>{const b=[t.b[0]+(s.bent&&t.i%2?.18:0),t.b[1],Math.sin(s.t*6+t.i)*.04];moveBond(t.mesh,t.a,b,.035);}));label('Water-facing heads',[0,1.35,0]);label('Tail packing',[0,0,.4]);
 }else if(visual==='helix'){
  const beads=[],links=[];
  for(let i=0;i<12;i++){
   const a=Math.floor(i/2)*.6+(i%2)*Math.PI,p=[Math.cos(a)*1.2,(Math.floor(i/2)-2.5)*.4,-Math.sin(a)*1.2];
   beads.push(atom(p,.13,i%2?colors[1]:colors[0]));
   if(i%2){const pair=group(root);for(let j=0;j<3;j++){const a=beads[i-1].position.toArray(),b=[...p];a[1]+=(j-1)*.075;b[1]+=(j-1)*.075;bond(pair,a,b,.018,colors[2]);}links.push(pair);}
   if(i>=2)bond(root,beads[i-2].position.toArray(),p,.045,i%2?colors[1]:colors[0]);
  }
  const sequence=label('',[0,-1.95,0]);
  updates.push(s=>{let formed=0;links.forEach((g,i)=>g.children.forEach((b,j)=>{const available=kind==='dna-structure'?(s.gc||i<2?3:2):1;b.visible=j<available&&(kind==='dna-structure'?formed++<s.value:i<s.value);}));sequence.textContent=kind==='dna-structure'?'A–T: 2 · G–C: 3 hydrogen bonds':`3′–AGTCAT–5′ → 5′–${s.sequence}–3′`;});
  label('5′',[1,1.65,0]);label('3′',[-1,-1.65,0]);label('Antiparallel strands',[-1.8,.25,0]);
 }else if(visual==='folding'){
  const beads=Array.from({length:18},(_,i)=>atom([0,0,0],.13,colors[i%4])),links=Array.from({length:17},()=>bond(root,[0,0,0],[1,0,0]));
  updates.push(s=>{beads.forEach((b,i)=>{const a=i*.9,folded=[Math.cos(a)*(.7+i*.018),Math.sin(a)*.9,Math.sin(i*.4)*.8],open=[(i/17-.5)*5,Math.sin(i*.8)*.25,0];const p=mix(open,folded,s.fold);p[1]+=.04*Math.sin(s.t*8+i);b.position.set(...p);});links.forEach((b,i)=>moveBond(b,beads[i].position.toArray(),beads[i+1].position.toArray()));});label('One continuous peptide backbone',[0,1.7,0]);
 }else if(visual==='cargo'){
  for(let i=0;i<3;i++){const g=group(root,[i*2.2-2.2,0,0]);for(let j=0;j<4;j++)organic(g,[0,(j-1.5)*.28,0],[.65,.1,.4],colors[i],{roughness:.06});label(['ER','Golgi','Cell surface'][i],[i*2.2-2.2,1,0]);}
  const cargo=Array.from({length:12},()=>atom([0,0,0],.075,colors[1]));updates.push(s=>cargo.forEach((b,i)=>{const a=s.blocked?0:clamp(s.t*1.3-i*.025);b.position.set(-2.2+4.4*a,.2*Math.sin(i*2+a*6),.6);}));
 }else if(visual==='size'||visual==='osmosis'){
  const body=cell(root,[0,0,0],1.2),nucleus=organic(root,[0,0,0],[.4,.32,.32],colors[2]);const waters=Array.from({length:16},()=>atom([0,0,0],.055,'#7fa6bf'));
  updates.push(s=>{const r=visual==='size'?s.radius*.52:s.radius*1.2;body.scale.setScalar(r);nucleus.scale.setScalar(visual==='size'?r:.9);waters.forEach((b,i)=>{const a=i*2.399,radius=visual==='size'?r*1.5:(s.condition==='hypotonic'?2-.9*s.t:s.condition==='isotonic'?1.65:1+1*s.t);b.position.set(Math.cos(a)*radius,Math.sin(a)*radius*.8,.35*Math.sin(i));});});label(visual==='size'?'Surface encloses growing volume':'Water crosses; the chosen solute stays',[0,2.05,0]);
 }else if(visual==='transport'||visual==='gradient'||visual==='vesicle'){
  const membraneParts=[];for(let i=0;i<18;i++)for(const y of [-.18,.18]){const g=group(root,[(i-8.5)*.32,0,0]);ball(g,[0,y,0],.1,colors[1],'atom');bond(g,[0,y,0],[0,-y,0],.03,'#ae9469');membraneParts.push({g,x:(i-8.5)*.32});}
  const pore=organic(root,[0,0,.12],[.32,.46,.24],colors[3],{opacity:.65});pore.visible=visual==='transport'&&kind!=='permeability';
  if(visual==='vesicle'){
   const ves=group(root),shell=cell(ves,[0,0,0],.5),cargo=Array.from({length:6},(_,i)=>atom([Math.cos(i)*.22,Math.sin(i)*.18,.4],.055,colors[2]));
   updates.push(s=>{
    const u=s.inward?1-s.t:s.t,release=clamp((u-.45)/.25),approach=clamp(u/.45);
    ves.position.set(0,-1.2+.95*approach,.35);shell.visible=u<.64;shell.scale.set(1+.5*release,1-.7*release,1);
    cargo.forEach((b,i)=>b.position.set(Math.cos(i)*.22,Math.sin(i)*.18-1.2+.95*approach+1.4*release,.5));
    membraneParts.forEach(({g,x})=>{g.visible=!(Math.abs(x)<.55&&u>.4&&u<.72);});
   });label('Vesicle fusion / enclosure',[0,2,0]);
  }else{
   const count=kind==='channel'?24:visual==='gradient'?24:kind==='active-transport'?36:20,particles=Array.from({length:count},()=>atom([0,0,0],.067,colors[0]));
   updates.push(s=>{
    const initial=kind==='channel'?4:visual==='gradient'?3:kind==='active-transport'?24:0;
    const transferred=visual==='gradient'?9*(1-s.value/100):s.blocked?0:(kind==='channel'?8:kind==='active-transport'?12:16)*clamp((s.t-.15)/.7);
    particles.forEach((b,i)=>{
     const x=(i%10-4.5)*.46,y=.7+(i%3)*.21;
     // A fractional transfer traces a crossing; integer totals count arrivals.
     const u=i<initial?1:clamp(transferred-(i-initial));
     const viaPore=visual==='transport'&&kind!=='permeability';
     b.position.set(viaPore?x*Math.abs(1-2*u):x,y*(1-2*u),.2*Math.sin(i)+.04*Math.sin(s.t*8+i));
    });pore.scale.x=s.blocked?.5:1;
   });label(kind==='active-transport'?'ATP-coupled uphill transfer':'Two compartments',[0,1.85,0]);
  }
 }else if(visual==='symbiosis'||visual==='origin'){
  cell(root,[.6,0,0],1.7);const micro=group(root),shell=organic(micro,[0,0,0],[.68,.4,.4],colors[0],{opacity:.55});const rna=path(micro,Array.from({length:30},(_,i)=>[Math.sin(i*.7)*.4,Math.cos(i*.7)*.2,Math.sin(i*.3)*.15]),.035,colors[1]);
  const products=Array.from({length:12},(_,i)=>atom([1+Math.cos(i*2.4)*.75,Math.sin(i*2.4)*.8,.5],.07,colors[2]));
  updates.push(s=>{micro.position.x=visual==='symbiosis'?-2.2+2.7*s.t:-.2;rna.visible=visual==='origin'?s.catalyst:s.supported;products.forEach((b,i)=>b.visible=visual==='origin'?i<s.value:s.supported&&i<6);shell.rotation.z=.12*Math.sin(s.t*3);});label(visual==='origin'?'Hypothetical compartment':'Ancestry hypothesis',[0,2.05,0]);
 }else if(visual==='enzyme'){
  for(let i=0;i<12;i++){const a=.65+i/11*5;organic(root,[Math.cos(a)*.9,Math.sin(a)*.8,0],[.32,.3,.4],colors[i%2?0:3],{roughness:.14});}
  const substrate=group(root);ball(substrate,[0,0,0],.16,colors[1],'atom');ball(substrate,[.24,0,0],.14,colors[2],'atom');bond(substrate,[0,0,0],[.24,0,0]);
  const product=atom([0,0,0],.15,colors[1]);updates.push(s=>{const u=(s.t*(s.value/3+1))%1;substrate.position.set(2.2-2*clamp(u/.5),.05,.45);substrate.visible=u<.7;product.visible=u>=.7;product.position.set(.2+(u-.7)*6,-.4,.4);});label('Active-site interactions',[0,1.6,0]);
 }else if(['energy','photosynthesis','respiration'].includes(visual)){
  const chambers=[group(root,[-2,0,0]),group(root,[0,0,0]),group(root,[2,0,0])];
  if(visual==='photosynthesis'){for(let i=0;i<5;i++)organic(chambers[0],[0,(i-2)*.18,0],[.65,.09,.42],'#85a475');mesh(chambers[1],new THREE.TorusGeometry(.55,.06,8,32),surface(colors[0]));label('Thylakoid',[-2,1.1,0]);label('Carbon fixation',[0,1.1,0]);}
  else{chambers.forEach((g,i)=>organic(g,[0,0,0],[.65,.5,.4],colors[i],{roughness:.08}));label(visual==='energy'?'Favorable reaction':'Glycolysis',[-2,1.1,0]);label(visual==='energy'?'Coupling':'Carrier pathways',[0,1.1,0]);}
  label(visual==='photosynthesis'?'Organic product':visual==='energy'?'Cellular work':'ATP output',[2,1.1,0]);
  for(let i=0;i<2;i++)bond(root,[-1.35+i*2,0,0],[-.65+i*2,0,0],.035,'#a8b99e');
  const stream=Array.from({length:12},()=>atom([0,0,0],.08,colors[1])),products=Array.from({length:10},(_,i)=>ball(chambers[2],[(i%3-1)*.25,Math.floor(i/3)*.2-.25,.5],.07,colors[2],'atom'));
  updates.push(s=>{stream.forEach((b,i)=>{b.visible=visual==='photosynthesis'?s.light:!s.blocked;const u=(s.t*2+i/12)%1;b.position.set(-2+4*u,.2*Math.sin(u*6+i),.5);});const output=visual==='photosynthesis'?s.value/12:visual==='energy'?s.value/10:s.value/100;products.forEach((b,i)=>b.visible=i<10*output);chambers[1].rotation.z=s.t*Math.PI;});
 }else if(visual==='signal'){
  const nodes=[[-2,0,0],[-.8,0,0],[.45,0,0],[1.7,0,0]].map((p,i)=>organic(root,p,[.3,.4,.3],colors[i],{roughness:.14}));
  for(let i=0;i<3;i++)bond(root,[-1.7+i*1.25,0,0],[-1.1+i*1.25,0,0],.035,'#9dac9c');const pulse=atom([-2,0,.5],.1,colors[1]);
  const targets=Array.from({length:20},(_,i)=>atom([1.5+(i%5)*.15,-.7-Math.floor(i/5)*.15,.2],.045,colors[0]));
  updates.push(s=>{nodes.forEach((n,i)=>{n.visible=!(s.constitutive&&i===0);n.scale.setScalar(.8+.25*(s.t>i*.18&&(!s.blocked||i<2)&&!(s.bypass&&i===2)?1:0));});pulse.visible=!s.constitutive;pulse.position.x=-2+3.7*(s.blocked?Math.min(s.t,.35):s.bypass&&s.t>.35?Math.max(.82,s.t):s.t);pulse.position.y=.3*Math.sin(s.t*7);targets.forEach((b,i)=>b.visible=i<(kind==='cascade'?s.value:s.value/5));});['Signal','Receptor','Relay','Response'].forEach((x,i)=>label(x,[-2+i*1.23,.8,0]));
 }else if(visual==='feedback'){
  const level=organic(root,[0,0,0],[.6,.6,.6],colors[0]);mesh(root,new THREE.TorusGeometry(1.4,.035,8,48),surface(colors[3]));const pulse=atom([0,0,0],.1,colors[1]);
  updates.push(s=>{level.scale.setScalar(Math.cbrt(s.value));pulse.position.set(Math.cos(s.t*Math.PI*2)*1.4,Math.sin(s.t*Math.PI*2)*1.4,0);});label('Response returns to its initiating variable',[0,2.1,0]);
 }else if(visual==='division'||visual==='meiosis'){
  const chrom=chromosomes(root,8),envelopes=Array.from({length:visual==='meiosis'?4:2},()=>cell(root,[0,0,0],1.05));
  updates.push(s=>{
   const meiosis=visual==='meiosis',first=clamp((s.t-.3)/.28),second=clamp((s.t-.65)/.3),split=clamp((s.t-.45)/.4),divides=meiosis||s.divides;
   const bins=s.nondisjunction?[0,1,0,1,0,1,2,3]:[0,1,2,3,0,1,2,3];
   envelopes.forEach((g,i)=>{if(meiosis){g.visible=i===0||i===2&&first>0||(i===1||i===3)&&second>0;g.position.set((i<2?-1.65:1.65)*first,(i%2?-.9:.9)*second,0);g.scale.setScalar(1-.2*second);}else{g.visible=i===0||divides&&split>0;g.position.set(divides?(i?1.65:-1.65)*split:0,0,0);}});
   chrom.forEach((g,i)=>{g.visible=kind==='checkpoint'||i%2===0||s.t>.2;const initial=[(Math.floor(i/2)-1.5)*.55+(i%2?.12:-.12),.1,0];let target;
    if(meiosis){const b=bins[i],members=bins.filter(x=>x===b).length,rank=bins.slice(0,i).filter(x=>x===b).length;target=[(b<2?-1.65:1.65)+(rank-(members-1)/2)*.35,(b%2?-.9:.9)*second,0];g.position.set(...mix(initial,target,first));}
    else{target=[(i%2?1.65:-1.65)+(Math.floor(i/2)-1.5)*.3,0,0];g.position.set(...mix(initial,target,divides?split:0));}if(meiosis)g.position.x+=(i%2?.07:-.07)*(1-second)*first;g.scale.set(.65,i<4?.75:.5,.65);
   });
  });label(visual==='meiosis'?'One replication · two divisions':'Replicate before segregating',[0,2.1,0]);
 }else if(visual==='chromosomes'){
  const strands=Array.from({length:4},(_,i)=>{const g=group(root,[(i-1.5)*.65,0,0]);bond(g,[0,1.1,0],[0,0,0],.095,i<2?colors[0]:colors[1]);const bottom=bond(g,[0,0,0],[0,-1.1,0],.095,i<2?colors[0]:colors[1]);bottom.material=bottom.material.clone();return {g,bottom};});
  updates.push(s=>strands.forEach(({g,bottom},i)=>{g.position.x=(i-1.5)*.65+(i===1?.2:i===2?-.2:0)*Math.sin(s.t*Math.PI);g.rotation.z=s.recombined&&(i===1||i===2)?(i===1?.12:-.12):0;bottom.material.color.set(colors[s.recombined&&i===1?1:s.recombined&&i===2?0:i<2?0:1]);}));label('Exchange between nonsister chromatids',[0,1.9,0]);
 }else if(visual==='inheritance'||visual==='distribution'){
  const beads=Array.from({length:100},(_,i)=>atom([0,0,0],.065,colors[i%3]));beads.forEach(b=>b.material=b.material.clone());
  const gametes=visual==='inheritance'?[atom([-1.3,1.1,0],.13,colors[0]),atom([1.3,1.1,0],.13,colors[1])]:[];
  updates.push(s=>{
   gametes.forEach((g,i)=>{const u=clamp(s.t/.28);g.position.set((i?1:-1)*1.3*(1-u),1.1-.45*u,0);g.visible=s.t<.3;});
   const d=s.distribution||[.25,.5,.25],sum=d.reduce((a,b)=>a+b,0),total=kind==='variation'?Math.round(sum):100,fractions=d.map(x=>x/sum);let n=0;
   for(let category=0;category<d.length;category++){
    const count=category===d.length-1?total-n:Math.round(total*fractions[category]);
    for(let j=0;j<count&&n<100;j++,n++){
     const b=beads[n],u=visual==='inheritance'?clamp((s.t-.25-n*.003)/.35):1;
     b.visible=visual!=='inheritance'||u>0;b.material.color.set(kind==='nonmendel'?['#b66268','#d5a1af','#ede6d2'][category]:colors[category]);
     const target=[(category-(d.length-1)/2)*1.8+(j%6-2.5)*.14,-.8+Math.floor(j/6)*.15,.15*Math.sin(j)];
     b.position.set(...mix([0,.65,0],target,u));
    }
   }for(;n<100;n++)beads[n].visible=false;
  });
  const names=visual==='inheritance'?(kind==='nonmendel'?['Red','Pink','White']:['AA','Aa','aa']):kind==='variation'?['Sensitive','Intermediate','Tolerant']:['Low trait','Middle trait','High trait'];names.forEach((x,i)=>label(x,[(i-1)*1.8,1.65,0]));
  if(visual==='inheritance')label('Expected proportions · not a sampled family',[0,-1.45,0]);
 }else if(visual==='reaction-norm'||visual==='plant'){
  const plants=[plant(root,visual==='plant'?0:-1.2),...(visual==='plant'?[]:[plant(root,1.2,colors[2])])];const sun=atom([2,1.7,-.2],.23,'#d6b66e');
  updates.push(s=>{plants.forEach((g,i)=>{if(visual==='plant')g.rotation.z=-s.bend;else g.scale.y=(i?s.b:s.a)/5;});sun.visible=visual==='plant'?s.condition!=='uniform':true;});label(visual==='plant'?'Growth response to a directional cue':'Two genotypes · same treatments',[0,2.25,0]);
 }else if(visual==='transcription'||visual==='regulation'){
  for(let i=0;i<15;i++){const x=(i-7)*.32;atom([x,.55,0],.07,colors[1]);atom([x,.2,0],.07,colors[0]);bond(root,[x,.2,0],[x,.55,0],.026,colors[i%3]);}
  const polymerase=organic(root,[-2,.4,.2],[.3,.37,.3],colors[3],{roughness:.15}),repressor=organic(root,[-1.2,.45,.3],[.25,.32,.25],colors[2]);
  const rna=Array.from({length:12},(_,i)=>atom([(i-5.5)*.28,-.6,0],.1,colors[Math.floor(i/3)%3]));
  const introns=visual==='transcription'?[path(root,[[-.98,-.6,0],[-.85,-1,0],[-.7,-.6,0]],.045,colors[3]),path(root,[[-.14,-.6,0],[0,-1,0],[.14,-.6,0]],.045,colors[3])]:[];
  const cap=visual==='transcription'?atom([-1.84,-.6,0],.11,colors[1]):null;
  const tail=visual==='transcription'?Array.from({length:6},(_,i)=>atom([1.0+i*.12,-.6,0],.045,colors[1])):[];
  updates.push(s=>{introns.forEach((g,i)=>{g.visible=!s.spliced&&s.transcribed>(i+1)*3;});if(cap)cap.visible=s.transcribed>0;tail.forEach((b,i)=>{b.visible=s.spliced;b.position.x=.82+i*.12-(s.condition==='skip'?.84:0);});repressor.visible=visual==='regulation'&&s.blocked;polymerase.position.x=s.blocked?-2+.1*Math.sin(s.t*8):-2+4*s.t;rna.forEach((b,i)=>{b.visible=visual==='transcription'?i<s.transcribed&&!(s.spliced&&s.condition==='skip'&&i>=3&&i<6):kind==='specialization'?i<12:s.value>i;b.position.y=-.6;b.position.x=(i-5.5)*.28-(s.spliced&&s.condition==='skip'&&i>=6?.84:0);if(kind==='specialization'){b.visible=i<Math.ceil(12*s.t);b.scale.setScalar(i<6?s.distribution[0]:s.distribution[1]);}});});label('DNA stays in the model',[0,1.2,0]);label(visual==='transcription'?'RNA → processed message':'Regulated output',[0,-1.4,0]);
 }else if(visual==='sequence'){
  const beads=Array.from({length:18},(_,i)=>atom([(i-8.5)*.28,0,0],.09,colors[Math.floor(i/3)%3]));beads.forEach(b=>b.material=b.material.clone());const text=label('AUG · GCU · UUU · GAA · GGA · UAA',[0,-.8,0]);const reader=organic(root,[0,0,-.2],[.44,.35,.12],colors[1],{opacity:.25});
  updates.push(s=>{text.textContent=s.codons.join(' · ');reader.position.x=(Math.min(s.codons.length-1,Math.floor(s.t*s.codons.length))*3+1-(s.sequence.length-1)/2)*.28;beads.forEach((b,i)=>{b.visible=i<s.sequence.length;b.material.color.set(colors[Math.floor(i/3)%3]);b.position.y=Math.floor(i/3)%2*.25;b.position.x=(i-(s.sequence.length-1)/2)*.28;});});label('Triplets define the reading frame',[0,1.2,0]);
 }else if(visual==='pcr'){
  const copies=Array.from({length:64},(_,i)=>{const g=group(root,[(i%8-3.5)*.46,(Math.floor(i/8)-3.5)*.32,0]);bond(g,[-.05,-.1,0],[-.05,.1,0],.025,colors[0]);bond(g,[.05,-.1,0],[.05,.1,0],.025,colors[1]);return g;});updates.push(s=>copies.forEach((g,i)=>{g.visible=i<Math.min(64,s.value);g.rotation.y=s.t*Math.PI;}));label('Up to 64 representative duplexes',[0,1.9,0]);
 }else if(visual==='population'||visual==='population-pair'||visual==='growth'){
  const n=visual==='population-pair'?80:100,organisms=Array.from({length:n},(_,i)=>glyph(root,[0,0,0],colors[0],.08));organisms.forEach(g=>g.traverse(o=>{if(o.material)o.material=o.material.clone();}));
  updates.push(s=>organisms.forEach((g,i)=>{const paired=visual==='population-pair',side=i<40?-1:1,index=paired?i%40:i,a=index*2.399,r=Math.sqrt(index/(paired?40:100))*1.3;g.position.set(Math.cos(a)*r+(paired?side*1.6:0),Math.sin(a)*r*.8,.25*Math.sin(index));g.visible=visual!=='growth'||i<Math.min(100,s.value/8);const fraction=paired?(side<0?s.a:s.b):(s.p??.5),color=colors[index/(paired?40:100)<fraction?0:1];g.traverse(o=>{if(o.material)o.material.color.set(color);});}));label(visual==='growth'?'Representative individuals · exact N in graph':'Colors identify inherited variants',[0,1.8,0]);
 }else if(visual==='tree'){
  const rootP=[0,-1.4,0],inner=[-1,.1,0],c=[1.8,1.5,0];bond(root,rootP,inner,.06);bond(root,rootP,c,.06);const a=atom([-2,1.5,0],.16,colors[0]),b=atom([-.1,1.5,0],.16,colors[1]),tipC=atom(c,.16,colors[2]),ab=[bond(root,inner,a.position.toArray(),.06),bond(root,inner,b.position.toArray(),.06)];const markers=[atom([-1.5,.8,0],.08,colors[3]),atom([-.5,.8,0],.08,colors[3])];const la=label('A',[-2,1.9,0]),lb=label('B',[-.1,1.9,0]);label('C',[1.8,1.9,0]);
  const trace=[atom(rootP,.11,colors[1]),atom(rootP,.11,colors[1])];
  updates.push(s=>{const flip=s.rotated?Math.sin(s.t*Math.PI/2)**2:0;a.position.x=-2+1.9*flip;b.position.x=-.1-1.9*flip;moveBond(ab[0],inner,a.position.toArray(),.06);moveBond(ab[1],inner,b.position.toArray(),.06);this.annotations.find(x=>x.element===la).position.x=a.position.x;this.annotations.find(x=>x.element===lb).position.x=b.position.x;markers.forEach(m=>m.visible=kind==='phylogeny'?false:s.supported&&s.t>.4);trace.forEach((m,i)=>{const p=s.t<.5?mix(rootP,inner,s.t*2):mix(inner,(i?a:b).position.toArray(),(s.t-.5)*2);m.position.set(...p);});});label('Rooted relationship · no time scale',[0,-1.9,0]);
 }else if(visual==='food-web'){
  const plants=[plant(root,-2),plant(root,-1.6)],herb=glyph(root,[0,0,0],colors[1],.38),pred=glyph(root,[2,0,0],colors[2],.48);bond(root,[-1.2,0,0],[-.5,0,0],.03);bond(root,[.5,0,0],[1.4,0,0],.03);const energy=Array.from({length:12},()=>atom([0,0,0],.055,'#d6b66e'));
  updates.push(s=>{plants.forEach(g=>g.scale.setScalar(kind==='community'?s.plant/100:1));herb.scale.setScalar(kind==='community'?.6+s.herbivore/60:.65+s.efficiency);pred.visible=kind!=='community'||s.predator>0;energy.forEach((b,i)=>{const u=(s.t+i/12)%1;b.position.set(-1.5+3.5*u,.4*Math.sin(u*5),.4);});});['Producer','Herbivore','Predator'].forEach((x,i)=>label(x,[-2+i*2,1.8,0]));
 }else if(visual==='habitat'){
  const plants=[plant(root,-1.7),plant(root,0,colors[1]),plant(root,1.7,colors[2])];const waterPlane=organic(root,[0,-1.35,-.2],[2.7,.09,1], '#8bafb6',{kind:'water',opacity:.65});const oxygen=Array.from({length:18},(_,i)=>atom([(i%9-4)*.5,-.7+Math.floor(i/9)*.45,.45],.055,colors[3]));
  updates.push(s=>{plants.forEach((g,i)=>{g.visible=kind!=='biodiversity'||s.diverse||i===1;g.scale.y=kind==='disturbance'?.4+s.algae/100:.3+(s.diverse?s.contributors[i]:s.contributors[0])*.7;});oxygen.forEach((b,i)=>{b.visible=kind==='disturbance'&&i<18*s.value/100;b.position.y=-.8+((s.t+i*.13)%1)*.8;});waterPlane.visible=kind==='disturbance';});label(kind==='disturbance'?'Production → decomposition → oxygen demand':'Response traits affect retained function',[0,1.8,0]);
 }else throw new Error(`No course model for ${visual}`);
 this.processRig={bounds:frame,update:s=>{const state=s||sampleLab(kind,0);for(const update of updates)update(state);}};
 this.processRig.update(null);
}
