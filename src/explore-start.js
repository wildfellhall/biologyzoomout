import {pathways,buildPath,pathForMolecule} from './pathways.js';
import {formulaHTML} from './content.js';
import {esc} from './node-detail.js';
import './explore-start.css';

const families=[['water','Water'],['carbohydrates','Sugars'],['nucleotides','Nucleotides & bases'],['lipids','Lipid components'],['amino-acids','Amino acids']];
export function createExploreStart({molecules,onRoute,onStart}){
 const page=document.createElement('main');page.id='explore-start';page.hidden=true;page.setAttribute('aria-labelledby','explore-start-title');document.querySelector('#app').append(page);
 let view='molecules',context='plant',family='all';
 const $=s=>page.querySelector(s);
 function render(focus=false){
  const available=molecules.filter(m=>pathways[pathForMolecule(m)].organisms.includes(context));
  const sorted=families.flatMap(([id])=>available.filter(m=>m.family===id));
  const shown=family==='all'?sorted:sorted.filter(m=>m.family===family);
  const routes=Object.entries(pathways).filter(([,p])=>p.organisms.includes(context));
  page.innerHTML=`<div class="start-body"><a class="start-home" href="#home">← Home</a><h1 id="explore-start-title" tabindex="-1">Choose your starting point</h1>
   <div class="start-controls"><div class="start-views" role="group" aria-label="Starting point type"><button data-start-view="molecules" aria-pressed="${view==='molecules'}">Molecules</button><button data-start-view="paths" aria-pressed="${view==='paths'}">Pathways</button></div>
   <div class="start-filters">${view==='molecules'?`<label>Family<select id="start-family"><option value="all">All molecules</option>${families.map(([id,name])=>`<option value="${id}" ${id===family?'selected':''}>${name}</option>`).join('')}</select></label>`:''}<label>Context<select id="start-context"><option value="plant" ${context==='plant'?'selected':''}>Plant</option><option value="animal" ${context==='animal'?'selected':''}>Animal</option></select></label></div></div>
   <div class="start-grid" aria-label="${view==='molecules'?'Starting molecules':'Starting pathways'}">${view==='molecules'?shown.map(m=>`<button class="start-card molecule-start" data-start-molecule="${m.id}"><span class="start-formula">${formulaHTML(esc(m.formula))}</span><h2>${esc(m.id==='glycerophosphocholine'?'Glycero\u00adphospho\u00adcholine':m.name)}</h2><span class="start-card-bottom">${esc(families.find(([id])=>id===m.family)?.[1]||'')}<span aria-hidden="true">↗</span></span></button>`).join(''):routes.map(([id,p])=>{const route=buildPath(id,context),model=p.models.find(id=>id!=='molecules')||'molecules',name=model==='molecules'?molecules.find(m=>m.id===p.molecule)?.name:route.steps.find(s=>s.id===model)?.label;return `<button class="start-card pathway-start" data-start-path="${id}"><h2>${esc(p.name)}</h2><span class="start-card-bottom">Start with ${esc(name)}<span aria-hidden="true">↗</span></span></button>`;}).join('')}</div>${view==='molecules'&&!shown.length?'<p>No starting molecules in this family for the selected context.</p>':''}
  </div>`;
  if(focus){page.scrollTop=0;$('#explore-start-title').focus({preventScroll:true});}
 }
 function change(next,focus){context=next.context||context;view=next.view||view;family=next.family||family;onRoute({context,view,family});render();if(focus)$(focus)?.focus();}
 page.addEventListener('click',event=>{
  const tab=event.target.closest('[data-start-view]');if(tab){change({view:tab.dataset.startView},`[data-start-view="${tab.dataset.startView}"]`);return;}
  const molecule=event.target.closest('[data-start-molecule]');if(molecule){const m=molecules.find(m=>m.id===molecule.dataset.startMolecule);onStart({route:buildPath(pathForMolecule(m),context),model:'molecules',molecule:m.id});return;}
  const path=event.target.closest('[data-start-path]');if(path){const id=path.dataset.startPath,p=pathways[id];onStart({route:buildPath(id,context),model:p.models.find(id=>id!=='molecules')||'molecules',molecule:p.molecule});}
 });
 page.addEventListener('change',event=>{
  if(event.target.id==='start-context')change({context:event.target.value},'#start-context');
  if(event.target.id==='start-family')change({family:event.target.value},'#start-family');
 });
 return {show(params={},focus=true){view=params.view==='paths'?'paths':'molecules';context=params.context==='animal'?'animal':'plant';family=families.some(([id])=>id===params.family)?params.family:'all';page.hidden=false;render(focus);},hide(){page.hidden=true;}};
}
