import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSearchIndex,searchEntries,searchHref} from '../src/search-index.js';
import {buildPath} from '../src/pathways.js';
import {endomembraneState} from '../src/endomembrane-state.js';
import {processesFor,sampleProcess} from '../src/processes.js';
const molecules=JSON.parse(fs.readFileSync(new URL('../public/data/molecules.json',import.meta.url)));
const ontology=JSON.parse(fs.readFileSync(new URL('../public/data/ontology.json',import.meta.url)));
const entries=createSearchIndex(molecules,ontology);

test('Search resolves aliases, multiword queries, categories, formulas and topic codes',()=>{
 for(const [query,id]of [['Golgi bodies','golgi'],['RER','rough-er'],['SER','smooth-er'],['smooth endoplasmic reticulum','smooth-er'],['H2O','water'],['L-alanine','alanine']])assert.equal(searchEntries(entries,query,'models')[0]?.id,id,query);
 assert.ok(searchEntries(entries,'2.1','lessons').some(e=>e.id==='topic-2-1'));
 assert.equal(searchEntries(entries,'zznonexistent').length,0);
 assert.ok(searchEntries(entries,'DNA','lessons').every(e=>e.kind==='lessons'));
 assert.equal(entries.filter(e=>e.kind==='lessons').length,67);
 assert.equal(entries.filter(e=>e.kind==='nodes').length,234);
});
test('Every model and pathway result links to its real model in a compatible plant/animal route',()=>{
 for(const entry of entries.filter(e=>e.kind==='models'||e.kind==='paths'))for(const context of ['plant','animal']){
  const params=new URLSearchParams(searchHref(entry,molecules,context).slice(1));
  const route=buildPath(params.get('path'),params.get('organism'));
  assert.ok(route.steps.some(s=>s.id===params.get('at')),entry.id);
  assert.ok(route.organisms.includes(params.get('organism')),entry.id);
  if(params.has('molecule'))assert.ok(molecules.some(m=>m.id===params.get('molecule')));
 }
});
test('ER protein export follows synthesis and folding; Golgi sorting follows processing',()=>{
 for(let i=0;i<=100;i++){
  const t=i/100,er=endomembraneState('er-protein',t),golgi=endomembraneState('golgi-sorting',t);
  if(er.export>0){assert.equal(er.residues,18);assert.equal(er.fold,1);}
  if(golgi.departure>0){assert.equal(golgi.sort,1);assert.equal(golgi.maturation,1);assert.equal(golgi.glycans,3);}
 }
 for(const [model,id]of [['rough-er','er-protein'],['golgi','golgi-sorting'],['smooth-er','er-lipids']])assert.equal(processesFor(model)[0].id,id);
});
test('Calcium cycling conserves tracers and lipid redistribution follows assembly and insertion',()=>{
 for(let i=0;i<=200;i++){
  const t=i/200,ca=endomembraneState('er-calcium',t),lipid=endomembraneState('er-lipids',t);
  assert.equal(ca.stored+ca.cytosolic,12);assert.ok(ca.stored>=0&&ca.cytosolic>=0);
  if(lipid.redistribute>0){assert.equal(lipid.assembly,1);assert.equal(lipid.insert,1);}
  const original=sampleProcess('er-calcium',t);sampleProcess('er-calcium',1-t);assert.deepEqual(sampleProcess('er-calcium',t),original);
 }
 assert.equal(endomembraneState('er-calcium',.48).stored,12);
 assert.equal(endomembraneState('er-calcium',.72).stored,4);
 assert.equal(endomembraneState('er-calcium',1).stored,12);
 for(const [time,phase]of [[.1,0],[.3,1],[.6,2],[.9,3]])assert.equal(sampleProcess('er-calcium',time).phase,phase);
});
