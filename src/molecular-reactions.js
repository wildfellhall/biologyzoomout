import * as THREE from 'three';
import {ball,rod,path,organic,group,mesh,surface} from './surfaces.js';
import {replicationState,replicationHelixPoint,translationState,peptideState} from './reaction-state.js';
const clamp=x=>Math.max(0,Math.min(1,x));
const blend=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function placeBond(bond,a,b,r=.045){
 const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.sub(from);
 bond.position.copy(from).addScaledVector(delta,.5);bond.scale.set(r,Math.max(.001,delta.length()),r);
 bond.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
}

export function makeReplication(){
 const n=28,parents=[group(this.root),group(this.root)],news=[group(this.root),group(this.root)];
 const positions=[[],[]],beads=[[],[]],rungs=[[],[]],backbones=[[],[]],newBeads=[[],[]],newRungs=[[],[]],newLinks=[[],[]];
 for(let side=0;side<2;side++)for(let i=0;i<n;i++){
  const p=replicationHelixPoint(i,side);positions[side].push(p);
  beads[side].push(ball(parents[side],p,.09,'#c5a16b','atom'));
  rungs[side].push(rod(parents[side],p,[0,p[1],0],.045,i%2?'#8caead':'#bd91aa','atom'));
  if(i)backbones[side].push(rod(parents[side],positions[side][i-1],p,.065,'#d7b276','atom'));
  newBeads[side].push(ball(news[side],p,.085,'#65b4ac','atom'));
  newRungs[side].push(rod(news[side],p,[0,p[1],0],.045,'#8bbdb7','atom'));
  if(i)newLinks[side].push(rod(news[side],p,positions[side][i-1],.06,'#65b4ac','atom'));
 }
 const machinery=group(this.root),helicase=mesh(machinery,new THREE.TorusGeometry(.36,.11,12,32),surface('#c291aa'),[0,0,.45]);
 const polymerases=[organic(machinery,[-1.2,0,.12],[.29,.21,.22],'#7b8fb7',{roughness:.12}),organic(machinery,[1.2,0,.12],[.29,.21,.22],'#7b8fb7',{roughness:.12})];
 const primers=Array.from({length:7},()=>ball(machinery,[0,0,0],.115,'#db8f9c','atom'));
 const ligase=organic(machinery,[1.2,-.2,.15],[.22,.3,.2],'#bba06f',{roughness:.1});
 const update=s=>{
  const state=s||replicationState(0),active=!!s;machinery.visible=active;
  const forkY=(state.unwound-13.5)*.22,lagging=new Set(state.lagging);
  const p=[[],[]],q=[[],[]];
  for(let side=0;side<2;side++)for(let i=0;i<n;i++){
   const original=positions[side][i],opened=active?clamp((state.unwound-i)/2):0,sign=side?1:-1;
   p[side][i]=blend(original,[sign*1.45,original[1],0],opened);
   q[side][i]=[sign*1.03,original[1],0];
   beads[side][i].position.set(...p[side][i]);
   const midpoint=blend(p[side][i],q[side][i],.5);
   placeBond(rungs[side][i],p[side][i],active&&opened>.5?midpoint:[0,original[1],0]);
   const copied=active&&(side?lagging.has(i):i<state.leading);
   rungs[side][i].visible=opened<.5||copied;
   newBeads[side][i].visible=newRungs[side][i].visible=copied;
   newBeads[side][i].position.set(...q[side][i]);placeBond(newRungs[side][i],q[side][i],midpoint);
   if(i){placeBond(backbones[side][i-1],p[side][i-1],p[side][i],.065);placeBond(newLinks[side][i-1],q[side][i-1],q[side][i],.06);
    newLinks[side][i-1].visible=copied&&(side?lagging.has(i-1)&&(i%5!==0||state.sealed):i<state.leading);
   }
  }
  helicase.position.set(0,Math.min(3.3,forkY),.25);helicase.rotation.z=(s?.t||0)*Math.PI*4;
  helicase.visible=active&&state.condition!=='helicase-off'&&state.unwound<n;
  polymerases[0].position.set(-1.05,(Math.max(0,state.leading-1)-13.5)*.22,.18);
  const growing=state.fragments.find(f=>f.count>0&&f.count<f.end-f.start+1)||state.fragments.find(f=>f.count===0)||state.fragments.at(-1);
  polymerases[1].position.set(1.04,(growing.end-Math.max(0,growing.count-1)-13.5)*.22,.18);
  polymerases.forEach(p=>p.visible=active&&!['polymerase-off','helicase-off'].includes(state.condition)&&(s.t<.9));
  primers[0].position.set(-1.03,-2.97,.04);primers[0].visible=active&&state.leading>0&&!state.primersReplaced;
  state.fragments.forEach((f,i)=>{primers[i+1].position.set(1.03,(f.end-13.5)*.22,.04);primers[i+1].visible=active&&f.count>0&&!state.primersReplaced;});
  ligase.visible=active&&s.t>.9&&state.leading===n&&state.lagging.length===n&&state.condition!=='ligase-off';ligase.position.y=-2.5+5*clamp(((s?.t||0)-.9)/.1);
 };
 this.processRig={update};update(null);
 this.annotation('Parental DNA · gold',[1,2.8,.3],'APBIO-6.2-01');
 this.annotation('Leading ↑',[-1.9,-1.6,.3],{processOnly:true,visibleWhen:s=>s?.leading>0});
 this.annotation('Lagging ↓',[1.9,-1.6,.3],{processOnly:true,visibleWhen:s=>s?.lagging?.length>0});
 this.annotation('Helicase',[0,3.45,.3],{processOnly:true,visibleWhen:s=>s?.unwound>0&&s?.unwound<28});
}

function makeTRNA(parent,color){
 const t=group(parent);
 path(t,[[0,0,0],[0,.43,0],[-.22,.67,0],[0,.9,0],[.23,.67,0],[0,.43,0],[.28,.25,0]],.047,color);
 return t;
}
export function makeTranslation(body){
 const rig=group(this.root,[0,0,.85]),rna=group(rig),codons=[];
 for(let i=0;i<6;i++){
  const c=group(rna,[i*.65-.3,-.2,0]);codons.push(c);
  for(let j=0;j<3;j++){ball(c,[(j-1)*.19,0,0],.067,['#94bfc0','#cfb281','#ba93ab'][(i+j)%3],'atom');if(j)rod(c,[(j-2)*.19,0,0],[(j-1)*.19,0,0],.025,'#7ca2a5');}

 }
 rod(rig,[-1.6,-.2,0],[1.6,-.2,0],.025,'#7ca2a5');
 const staticRNA=body?.children.at(-1);
 const p=makeTRNA(rig,'#c7b77d'),a=makeTRNA(rig,'#82b4ad'),aa=ball(a,[0,1,0],.13,'#d2a18e','atom');
 const chain=group(rig),residues=Array.from({length:5},(_,i)=>ball(chain,[Math.sin(i*2)*.11,i*.23,0],.12,['#91b7ac','#d1b478','#bd91aa','#81a6c0','#b6bc7e'][i],'atom'));
  const links=Array.from({length:4},()=>rod(chain,[0,0,0],[0,.2,0],.045,'#d3c5ad'));
 const release=organic(rig,[.35,.2,0],[.23,.42,.2],'#bda06b',{roughness:.12});
 // Keep a moving window of codons in the 3D view; the diagram shows the whole message.
 this.processRig={bounds:new THREE.Box3(new THREE.Vector3(-1.8,-.75,-.7),new THREE.Vector3(1.8,2.8,1.1)),update(s){
  rig.visible=!!s;if(staticRNA)staticRNA.visible=!s;if(!s)return;
  const state=s.length===undefined?translationState(s.t):s,u=state.local,shift=clamp((u-.72)/.28);
  const done=state.stage==='termination',initiating=state.stage==='initiation';
  rna.position.x=-(done?state.stop-1:state.cycle+shift)*.65;
  codons.forEach((c,i)=>{const x=c.position.x+rna.position.x;c.visible=x>=-1.4&&x<=1.4;const factor=i===state.current?1.2:1;c.scale.setScalar(factor);});
  p.position.set(-.3-(initiating?0:shift*.65),0,0);p.visible=!state.released;
  a.position.set(1.5-1.15*clamp(u/.22)-shift*.65,0,0);a.visible=!initiating&&!done;
  aa.visible=u<.48;
  const atA=u>=.48&&!initiating&&!done;
  const releaseAt=.12+(state.stop-1)/4*.75+.08;
  chain.position.set(state.released?-.3+clamp((s.t-releaseAt)/.05)*.9:atA?.35-shift*.65:-.3,1+(state.released?.7:0),.04);
  const colors={Met:'#91b7ac',Ala:'#d1b478',Phe:'#bd91aa',Glu:'#81a6c0',Gly:'#b6bc7e',Lys:'#a48fca'};
  residues.forEach((b,i)=>{b.visible=i<state.length;b.position.y=(state.length-1-i)*.23;if(colors[state.chain[i]])b.material.color.set(colors[state.chain[i]]);});
  if(colors[state.aminoAcids[state.current]])aa.material.color.set(colors[state.aminoAcids[state.current]]);
  links.forEach((b,i)=>{b.visible=i<state.length-1;placeBond(b,residues[i].position.toArray(),residues[i+1].position.toArray());});
  release.visible=done&&!state.released;
 }};
 this.processRig.update(null);
 this.annotation('E · exit',[-.95,-.55,1],{processOnly:true});
 this.annotation('P · chain',[-.3,-.55,1],{processOnly:true});
 this.annotation('A · incoming',[.35,-.55,1],{processOnly:true});
 this.annotation('mRNA read 5′ → 3′',[.3,-.95,.9],{processOnly:true});
 this.annotation('Polypeptide grows N → C',[-.4,2.4,1],{processOnly:true});
}

export function makePeptide(){
 const staticChain=group(this.root),points=Array.from({length:20},(_,i)=>[(i/19-.5)*4,Math.sin(i*.7)*.55,Math.cos(i*.7)*.45]);
 path(staticChain,points,.075,'#b4c8c0');points.forEach((p,i)=>ball(staticChain,p,.14,['#88b4ac','#d1b478','#bd91aa'][i%3],'atom'));
 const rig=group(this.root),donor=group(rig),incoming=group(rig),chemistry=group(incoming);
 const carbon=[-.4,.45,0],oxygen=[-.4,1.05,0],nitrogen=[.55,.45,0];
 ball(donor,carbon,.16,'#9ca9a7','atom');ball(donor,oxygen,.14,'#cb7162','atom');
 for(const dx of [-.045,.045])rod(donor,[carbon[0]+dx,carbon[1],0],[oxygen[0]+dx,oxygen[1],0],.035,'#b5bcb6');
 for(let i=0;i<3;i++){const x=-1.05-i*.48;ball(donor,[x,.45+Math.sin(i)*.2,0],.19,['#91b7ac','#d1b478','#bd91aa'][i],'atom');if(i)rod(donor,[x+.48,.45+Math.sin(i-1)*.2,0],[x,.45+Math.sin(i)*.2,0],.06,'#c2b89d');}
 rod(donor,[-1.05,.45,0],carbon,.06,'#b4b8ac');
 ball(chemistry,nitrogen,.15,'#779bbf','atom');ball(chemistry,[1.2,.45,0],.18,'#9ca9a7','atom');rod(chemistry,nitrogen,[1.2,.45,0],.055,'#a1b0b5');
 ball(chemistry,[1.2,1.12,.12],.21,'#bd91aa','atom');rod(chemistry,[1.2,.45,0],[1.2,1.12,.12],.055,'#baa4ad');
 ball(chemistry,[1.85,.05,0],.16,'#9ca9a7','atom');rod(chemistry,[1.2,.45,0],[1.85,.05,0],.055,'#a1b0b5');
 ball(chemistry,[2.25,.53,0],.14,'#cb7162','atom');
 for(const dx of [-.04,.04])rod(chemistry,[1.85+dx,.05,0],[2.25+dx,.53,0],.03,'#b5bcb6');
 ball(rig,[-.4,-.42,0],.13,'#cb7162','atom');ball(incoming,[1.85,-.65,0],.13,'#cb7162','atom');
 const ester=rod(rig,carbon,[-.4,-.42,0],.06,'#d3b86f'),newBond=rod(rig,carbon,nitrogen,.065,'#83b99e');
 rod(chemistry,[1.85,.05,0],[1.85,-.65,0],.055,'#d3b86f');
 path(rig,[[-.4,-.42,0],[-.4,-1.2,0],[-.8,-1.5,0],[-.4,-1.9,0],[0,-1.5,0],[-.4,-1.2,0]],.07,'#b8a1bf');
 path(incoming,[[1.85,-.65,0],[1.85,-1.2,0],[1.45,-1.5,0],[1.85,-1.9,0],[2.25,-1.5,0],[1.85,-1.2,0]],.07,'#82b4ad');
 this.processRig={update(s){
  rig.visible=!!s;staticChain.visible=!s;if(!s)return;const state=s.formed===undefined?peptideState(s.t):s;
  incoming.position.x=state.charged?1.6*(1-state.approach):1.6;chemistry.visible=state.charged;
  donor.position.y=state.transfer*.12;
  ester.visible=!state.formed;newBond.visible=state.formed;
  placeBond(newBond,[carbon[0],carbon[1]+donor.position.y,0],[nitrogen[0]+incoming.position.x,nitrogen[1],0],.065);
 }};this.processRig.update(null);
 this.annotation('P-site tRNA',[-.6,-2.1,0],{processOnly:true});this.annotation('A-site tRNA',[1.9,-2.1,0],{processOnly:true});
 this.annotation('New C–N peptide bond',[.1,.95,0],{processOnly:true,after:.55,visibleWhen:s=>s?.formed});
 this.annotation('N terminus',[-2.1,.9,0],{processOnly:true});
}
