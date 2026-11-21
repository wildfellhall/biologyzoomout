import {courseContent} from './content.js';
import {labs,sampleLab} from './labs.js';
import {esc} from '../node-detail.js';
const curves=new Map();
function curve(kind,condition){const key=`${kind}:${condition}`;if(!curves.has(key))curves.set(key,Array.from({length:41},(_,i)=>sampleLab(kind,i/40,condition)));return curves.get(key);}
const idFor=topic=>`topic-${topic.replace('.','-')}`;
export const courseActivity=Object.fromEntries(courseContent.map((c,i)=>{const lab=labs[c.sim];const choices=[lab.measure,'The chosen experimental condition','The starting setup held fixed between comparable runs'];const offset=i%3,answers=[...choices.slice(offset),...choices.slice(0,offset)];return [idFor(c.topic),{...lab,check:{prompt:'Which quantity is the response variable in this model comparison?',answers,correct:answers.indexOf(lab.measure),feedback:`Compare ${lab.measure.toLowerCase()} across the specified conditions. The chosen treatment is the independent variable; fixed starting conditions are controls.`}}];}));
export function courseResult(id,s){return s.metrics.map(([name,value])=>`${name}: ${value}`).join('; ');}
const text=(x,y,value,anchor='start')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(value)}</text>`;
export function courseDiagram(topic,s){
 const c=courseContent.find(c=>c.topic===topic),lab=labs[c.sim];if(!s)return '';
 let shape='';
 if(['inheritance','distribution'].includes(lab.visual)&&s.distribution){
  const total=s.distribution.reduce((a,b)=>a+b,0),names=lab.visual==='inheritance'?(c.sim==='nonmendel'?['Red','Pink','White']:['AA','Aa','aa']):['Class 1','Class 2','Class 3'];
  s.distribution.forEach((v,i)=>{const x=55+i*175,f=total?v/total:0;shape+=`<rect x="${x}" y="${91-65*f}" width="85" height="${65*f}" rx="3" fill="${['#638776','#c3a06b','#a68aab'][i]}"/>`+text(x+42,17,`${(f*100).toFixed(1)}%`,'middle')+text(x+42,112,names[i],'middle');});
 }else if(['sequence','transcription','translation'].includes(lab.visual)){
  const parts=c.sim==='transcription'?(s.spliced?(s.exons?(s.condition==='skip'?['Exon A','Exon C']:['Exon A','Exon B','Exon C']):['No mature RNA']):['Pre-mRNA','Processing pending']):s.codons||[];
  const width=Math.min(110,510/Math.max(1,parts.length));parts.forEach((v,i)=>{const x=35+i*width;shape+=`<rect x="${x}" y="28" width="${width-8}" height="32" rx="4" fill="${i===s.current?'#dce6d6':'#e8e9df'}" stroke="#a0b09c"/>`+text(x+(width-8)/2,49,v,'middle');});shape+=text(35,93,c.sim==='translation'?(s.chain.join('–')||'No residues yet'):s.frameshift?'Downstream reading frame shifted':c.sim==='transcription'?'DNA sequence retained':'Reading frame preserved');
 }else if(lab.visual==='meiosis'||lab.visual==='division'){
  const meiosis=lab.visual==='meiosis',divided=meiosis?s.t>=.5:s.divides&&s.t>=.85;
  const counts=meiosis?(s.t>=.9?s.distribution:s.t>=.5?(s.nondisjunction?[3,1]:[2,2]):[4]):divided?[4,4]:[4];
  const replicated=meiosis?s.t>.2&&s.t<.9:!divided&&s.dna>=8;
  const width=510/counts.length;
  counts.forEach((n,i)=>{const x=40+i*width;shape+=`<rect x="${x+4}" y="27" width="${width-12}" height="53" rx="18" fill="#e4e9df" stroke="#a0b09c"/>`+text(x+width/2,49,`${n} chromosomes`,'middle')+text(x+width/2,70,`${replicated?n*2:n} DNA molecules`,'middle');});
  shape+=text(295,112,meiosis?(s.t<.5?'Starting cell':s.t<.9?'After meiosis I':'After meiosis II'):divided?'Daughter cells':s.divides?'Replication precedes separation':'Cell-cycle arrest','middle');
 }else if(lab.visual==='tree'){
  const ax=s.rotated?255:110,bx=s.rotated?110:255;
  shape+=`<path d="M295 103L180 62L${ax} 24M180 62L${bx} 24M295 103L465 24" stroke="#547c65" stroke-width="3" fill="none"/>`;
  for(const [x,name]of [[ax,'A'],[bx,'B'],[465,'C']])shape+=`<circle cx="${x}" cy="24" r="5" fill="#c3a06b"/>`+text(x,15,name,'middle');
  shape+=`<circle cx="180" cy="62" r="6" fill="#b95c43"/>`+text(34,89,'Shared A/B ancestor')+text(310,117,'Root');
 }else if(lab.visual==='reaction-norm'){
  const points=curve(c.sim,s.condition).filter(p=>p.t<=s.t+1e-6),x=t=>48+475*t,y=v=>96-v*8;
  shape+=`<path d="M48 24V96H535" fill="none" stroke="#adb8a6"/>`;
  for(const [field,color]of [['a','#547c65'],['b','#a5765c']]){
   shape+=`<path d="${points.map((p,i)=>`${i?'L':'M'}${x(p.t)} ${y(p[field])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
   shape+=`<circle cx="${x(s.t)}" cy="${y(s[field])}" r="4" fill="${color}"/>`;
  }
  shape+=text(48,15,`Genotype A: ${s.a.toFixed(1)}`)+text(330,15,`Genotype B: ${s.b.toFixed(1)}`)+text(40,33,'8','end')+text(40,100,'0','end')+text(48,113,'0')+text(535,113,'1','end')+text(295,125,'Environment (relative scale)','middle');
 }else if(c.sim==='energy-flow'){
  s.distribution.forEach((v,i)=>{const x=24+i*190;shape+=`<rect x="${x}" y="20" width="160" height="57" rx="5" fill="#e5e8dc" stroke="#a0b09c"/>`+text(x+80,41,['Producer','Primary consumer','Secondary consumer'][i],'middle')+text(x+80,64,`${v.toFixed(0)} energy units`,'middle');if(i<2)shape+=text(x+173,54,'→','middle');});
  shape+=text(295,112,`${(s.efficiency*100).toFixed(0)}% transferred at each step; remainder not passed to that consumer`,'middle');
 }else{
  const points=curve(c.sim,s.condition),values=points.map(p=>p.value),min=Math.min(0,...values),max=Math.max(1,...values),range=max-min||1;
  const x=t=>48+t*475,y=v=>94-(v-min)/range*64;
  shape+=`<path d="M48 22V94H535" fill="none" stroke="#adb8a6"/>`;
  const displayed=points.filter(p=>p.t<=s.t+1e-6);if(displayed.length)shape+=`<path d="${displayed.map((p,i)=>`${i?'L':'M'}${x(p.t)},${y(p.value)}`).join(' ')}" fill="none" stroke="#547c65" stroke-width="3"/>`;
  shape+=`<circle cx="${x(s.t)}" cy="${y(s.value)}" r="4" fill="#b95c43"/>`;
  shape+=text(48,14,lab.measure)+text(42,32,max.toFixed(max<2?2:0),'end')+text(42,97,min.toFixed(0),'end') +text(285,125,s.axis==='Model progress'?'Model progress (%)':s.axis,'middle');
  const end=s.axis==='Generation'?12:s.axis==='PCR cycle'?8:s.axis==='Time (model units)'?10:100;
  for(const u of [0,.5,1])shape+=text(x(u),110,String(u*end),'middle');
 }
 return `<svg class="lesson-diagram" viewBox="0 0 590 130" role="img" aria-label="${esc(lab.measure)}; ${esc(s.metrics.map(m=>m.join(': ')).join('; '))}">${shape}</svg>`;
}
