import {glyph,glyphSVG} from './glyphs.js';
import {loadVisual,saveVisual,visualRecord,placePart,checkVisual,revealVisual,scorePlacement} from './progress.js';
import {esc} from '../node-detail.js';
import './styles.css';

function connections(a){
 let out='';
 if(a.sequence){for(let i=0;i<(a.layout==='cycle'?4:3);i++){const p=a.parts[i].point,q=a.parts[(i+1)%4].point;const dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;out+=`<path d="M${p[0]+ux*61} ${p[1]+uy*61}L${q[0]-ux*61} ${q[1]-uy*61}" stroke="#a4afa0" stroke-width="2" marker-end="url(#visual-arrow)"/>`;}}
 if(a.layout==='punnett'){const upper=a.topic==='5.4'?'R':a.topic==='7.5'?'A (p)':'A',lower=a.topic==='5.4'?'r':a.topic==='7.5'?'a (q)':'a';out+=`<path d="M135 30H550M135 30V325M340 30V325M135 180H550" fill="none" stroke="#b1bcaa"/>${[[235,23,upper],[445,23,lower],[95,105,upper],[95,255,lower]].map(([x,y,t])=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#40594b" font-size="17">${t}</text>`).join('')}`;}
 if(a.layout==='tree')out+='<path d="M320 285L190 120L80 45M190 120L300 45M320 285L525 70" fill="none" stroke="#9daa96" stroke-width="3"/><text x="75" y="22" font-size="18">A</text><text x="295" y="22" font-size="18">B</text><text x="525" y="22" font-size="18">C</text>';
 if(['energy','web'].includes(a.layout))out+='<path d="M155 100H245M355 100H445M120 145L260 240M300 150V225M495 145L345 240" stroke="#a4afa0" stroke-width="2" fill="none" marker-end="url(#visual-arrow)"/>';
 if(a.layout==='population')out+='<ellipse cx="320" cy="170" rx="67" ry="78" fill="#dce3d3"/><text x="320" y="175" text-anchor="middle" font-size="17">Population</text><path d="M170 85L260 140M170 255L260 200M380 140L475 85M380 200L475 255" stroke="#a4afa0" stroke-width="2" fill="none" marker-end="url(#visual-arrow)"/>';
 if(a.layout==='logistic')out+='<path d="M45 25V315H605M50 300C140 300 175 270 265 215S370 130 520 130" fill="none" stroke="#a4afa0" stroke-width="2"/><path d="M50 130H595" stroke="#a4afa0" stroke-dasharray="5 5"/><text x="45" y="20" font-size="16">N</text><text x="570" y="339" font-size="16">Time</text>';
 return out;
}
export function activityDiagram(a,r,mode){
 const labels=mode==='label',top=Math.max(0,Math.min(...a.parts.map(p=>p.point[1]))-65),bottom=Math.max(...a.parts.map(p=>p.point[1]))+85;
 const viewBox=['tree','population','logistic','punnett','energy','web'].includes(a.layout)?'0 0 640 360':`0 ${top} 640 ${bottom-top}`;
 return `<svg viewBox="${viewBox}" role="group" aria-label="${esc(a.title)}. Four numbered positions; text descriptions follow the diagram."><defs><marker id="visual-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="#a4afa0"/></marker></defs>${connections(a)}${a.parts.map((part,i)=>{const p=labels?part:a.parts.find(p=>p.id===r.placements[a.slots[i].id]);return `<g class="visual-diagram-position" data-visual-slot="${a.slots[i].id}" role="button" tabindex="0" aria-label="Position ${i+1}: ${esc(a.slots[i].role)}${r.placements[a.slots[i].id]?`. Placed: ${esc(a.parts.find(part=>part.id===r.placements[a.slots[i].id]).label)}`:''}"><rect x="${part.point[0]-55}" y="${part.point[1]-45}" width="110" height="118" rx="15" fill="transparent"/><g transform="translate(${part.point[0]-48} ${part.point[1]-40}) scale(.8)">${p?glyph(p.shape):'<rect x="12" y="8" width="96" height="84" rx="16" fill="none" stroke="#a4afa0" stroke-width="2" stroke-dasharray="5 5"/>'}</g><text x="${part.point[0]}" y="${part.point[1]+64}" text-anchor="middle" font-size="17" fill="#273d32">${i+1}</text></g>`;}).join('')}</svg>`;
}

export function createVisualPractice({container,activity:a,storage,has3D,onScene,onRestore,mode='label',onChange=()=>{}}){
 let selected=null,visible=true,data=loadVisual(storage),persistent=!!storage;
 const records={label:visualRecord(data,a,'label'),build:visualRecord(data,a,'build')};
 const r=()=>records[mode];
 function save(){const latest=loadVisual(storage);for(const m of ['label','build'])latest.records[`${a.id}@${a.version}/${m}`]=records[m];persistent=saveVisual(storage,latest);}
 function notify(){if(mode==='build'&&visible&&has3D)onScene(a,r().placements,selected,r().checked?scorePlacement(a,r().placements):null);else onRestore();}
 function render(focus){
  container.innerHTML=`${taskMarkup()}<p class="practice-save-status" role="status" ${persistent?'hidden':''}>Progress could not be saved on this device.</p>`;
  container.dataset.mode=mode;notify();onChange();if(focus)container.querySelector(focus)?.focus({preventScroll:true});
 }
 function taskMarkup(){
  const record=r(),correct=record.checked?scorePlacement(a,record.placements):[],placed=Object.keys(record.placements).length;
  // A fixed scramble prevents the bank order from supplying the placement key.
  const bank=[2,0,3,1].map(i=>a.parts[i]);
  return `<div class="visual-task-heading"><span>${placed} / ${a.slots.length} placed</span></div><p class="visual-instruction">${mode==='label'?'Match each name to its numbered diagram feature.':'Choose a piece, then a numbered position to build the representation.'}</p><div class="visual-board" ${mode==='build'&&has3D?'hidden':''}>${activityDiagram(a,record,mode)}</div><div class="visual-bank" role="group" aria-label="${mode==='label'?'Diagram labels':'Model pieces'}">${bank.map(p=>`<button data-visual-piece="${p.id}" aria-pressed="${selected===p.id}" ${Object.values(record.placements).includes(p.id)?'class="piece-placed"':''}>${mode==='build'?glyphSVG(p.shape):''}<span>${esc(p.label)}</span>${Object.values(record.placements).includes(p.id)?'<small>placed</small>':''}</button>`).join('')}</div><p id="visual-selection" role="status">${selected?`Selected: ${esc(a.parts.find(p=>p.id===selected).label)}. Choose a position.`:'Select a label or piece to place it.'}</p><ol class="visual-positions">${a.slots.map((s,i)=>{const p=a.parts.find(p=>p.id===record.placements[s.id]);return `<li ${record.checked?`data-result="${correct.includes(s.id)?'correct':'retry'}"`:''}><button data-visual-slot="${s.id}" aria-label="Position ${i+1}: ${esc(s.role)}${p?`. Placed: ${esc(p.label)}`:''}"><span class="position-number">${i+1}</span><span><small>${esc(s.role)}</small><b>${p?esc(p.label):'Place here'}</b></span>${record.checked?`<span class="position-verdict">${correct.includes(s.id)?'✓':'Revise'}</span>`:''}</button>${p?`<button class="visual-remove" data-visual-remove="${s.id}" aria-label="Remove ${esc(p.label)} from position ${i+1}">×</button>`:''}</li>`;}).join('')}</ol><div class="visual-actions"><button data-visual-reset>Start again</button>${record.attempts.length&&!record.checked?'<button data-visual-reveal>Show a worked model</button>':''}</div><div id="visual-feedback" role="status" tabindex="-1" ${record.checked?'':'hidden'}>${record.checked?`<b>${correct.length} of ${a.slots.length} relationships correct${record.assisted?' · with a worked model':''}.</b><p>${correct.length===a.slots.length?'Explain how the parts work together, then continue.':'Revise the marked positions, then check the whole model again.'}</p><details><summary>Why these relationships matter</summary><ol>${a.slots.map((s,i)=>`<li><b>${i+1}. ${esc(a.parts[i].label)}</b> ${esc(a.parts[i].explanation)}</li>`).join('')}</ol></details>`:''}</div>${record.attempts.length?`<p class="visual-history">${record.attempts.length} checked attempt${record.attempts.length===1?'':'s'} · first: ${record.attempts[0].correctSlots.length}/${a.slots.length}${record.attempts[0].assisted?' with help':''}</p>`:''}<details class="visual-note"><summary>About this representation</summary><p>${esc(a.note)} ${a.layout==='punnett'?'The two heterozygote pieces can be exchanged without changing the outcome.':''}</p></details>`;
 }
 function choosePart(id){if(mode==='inspect'||!a.parts.some(p=>p.id===id))return;selected=selected===id?null:id;render(`[data-visual-piece="${id}"]`);}
 function chooseSlot(id){
  if(mode==='inspect')return;const slot=a.slots.find(s=>s.id===id);if(!slot)return;
  if(!selected){if(r().placements[id])selected=r().placements[id];render(`[data-visual-slot="${id}"]`);container.querySelector('#visual-selection').textContent=selected?`Selected: ${a.parts.find(p=>p.id===selected).label}. Choose a new position.`:slot.role;return;}
  placePart(a,r(),selected,id);selected=null;save();render(`[data-visual-slot="${id}"]`);
 }
 container.addEventListener('click',event=>{
  const button=event.target.closest('button,[data-visual-slot]');if(!button)return;
  if(button.dataset.visualPiece){choosePart(button.dataset.visualPiece);return;}
  if(button.dataset.visualSlot){chooseSlot(button.dataset.visualSlot);return;}
  if(button.dataset.visualRemove){delete r().placements[button.dataset.visualRemove];r().checked=false;selected=null;save();render(`[data-visual-slot="${button.dataset.visualRemove}"]`);return;}
  if(button.hasAttribute('data-visual-reveal')){if(!revealVisual(a,r()))return;save();render('#visual-feedback');return;}
  if(button.hasAttribute('data-visual-reset')){r().placements={};r().checked=false;r().assisted=false;selected=null;save();render('[data-visual-piece]');}
 });
 container.addEventListener('keydown',event=>{
  if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key))event.stopPropagation();
  if(['Enter',' '].includes(event.key)&&event.target.matches('g[data-visual-slot]')){event.preventDefault();event.stopPropagation();chooseSlot(event.target.dataset.visualSlot);}
 });
 render();return {get state(){return {checked:r().checked,complete:a.slots.every(s=>r().placements[s.id])};},check(){if(!checkVisual(a,r()))return false;save();render('#visual-feedback');container.querySelector('#visual-feedback').scrollIntoView({block:'nearest'});return true;},get mode(){return mode;},setVisible(value){visible=value;notify();},destroy(){visible=false;onRestore();},pick(selection){if(!visible||mode!=='build')return false;if(selection.lessonPiece)choosePart(selection.lessonPiece);else if(selection.lessonSlot)chooseSlot(selection.lessonSlot);return true;}};
}
