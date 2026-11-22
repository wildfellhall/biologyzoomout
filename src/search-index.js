import {modelInfo} from './content.js';
import {structureInfo} from './structures.js';
import {pathwayInfo,pathways,routeForModel,pathForMolecule,buildPath} from './pathways.js';
import {lessons} from './lessons.js';
import {processesFor} from './processes.js';

const aliases={golgi:'golgi body bodies apparatus sorting secretion','rough-er':'rough er rer endoplasmic reticulum protein synthesis folding secretion','smooth-er':'smooth er ser endoplasmic reticulum lipid synthesis calcium detoxification',dna:'deoxyribonucleic acid replication','mitotic-cell':'mitosis cell division','meiotic-cell':'meiosis gametes','ribosome':'translation protein synthesis','free-ribosome':'translation protein synthesis'};
export const normalizeSearch=value=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9.]+/g,' ').trim();
export function createSearchIndex(molecules,ontology){
 const entries=[];
 const add=(kind,id,title,detail,terms='')=>entries.push({kind,id,title,detail,titleText:normalizeSearch(`${title} ${aliases[id]||''}`),text:normalizeSearch(`${title} ${detail} ${terms} ${aliases[id]||''}`)});
 for(const m of molecules)add('models',m.id,m.name,'Molecule',`${m.formula} ${m.description} ${m.family}`);
 for(const [id,m] of Object.entries({...modelInfo,...structureInfo,...pathwayInfo}))if(id!=='molecules')add('models',id,m.name,'3D model',`${m.summary} ${processesFor(id).map(p=>`${p.name} ${p.steps.join(' ')}`).join(' ')}`);
 for(const l of lessons)add('lessons',l.id,l.title,l.topic?`Topic ${l.topic} · ${l.unit}`:l.unit,`${l.objective} ${l.steps.map(s=>s.body||s.prompt||'').join(' ')}`);
 for(const [id,p] of Object.entries(pathways))add('paths',id,p.name,'Zoom pathway',p.models.join(' '));
 for(const n of ontology.nodes)add('nodes',n.id,n.label,n.id,`${n.outcome} ${n.official_codes.join(' ')}`);
 return entries;
}
export function searchEntries(entries,query,kind='all'){
 const q=normalizeSearch(query),tokens=q.split(/\s+/).filter(Boolean);
 const abbreviation={ser:'smooth-er',rer:'rough-er',dna:'dna'}[q];
 return entries.filter(e=>(kind==='all'||e.kind===kind)&&tokens.every(t=>e.text.includes(t)))
  .map(e=>({entry:e,score:(e.kind==='models'&&e.id===abbreviation?200:0)+(q&&e.titleText===q?100:0)+(q&&e.titleText.startsWith(q)?40:0)+tokens.filter(t=>e.titleText.includes(t)).length*10}))
  .sort((a,b)=>b.score-a.score||a.entry.title.localeCompare(b.entry.title)).map(x=>x.entry);
}
export function searchHref(entry,molecules,context='plant'){
 if(entry.kind==='lessons')return `#lesson=${encodeURIComponent(entry.id)}`;
 if(entry.kind==='nodes')return `#focus=dna&organism=${context}&node=${encodeURIComponent(entry.id)}`;
 let route,model,molecule;
 if(entry.kind==='paths'){route=buildPath(entry.id,context);model=pathways[entry.id].models.find(id=>id!=='molecules')||'molecules';molecule=route.molecule;}
 else {molecule=molecules.find(m=>m.id===entry.id);model=molecule?'molecules':entry.id;route=molecule?buildPath(pathForMolecule(molecule),context):routeForModel(model,context);molecule=molecule?.id;}
 const params=new URLSearchParams({path:route.id,organism:route.organism,at:model});if(molecule)params.set('molecule',molecule);
 return `#${params}`;
}
