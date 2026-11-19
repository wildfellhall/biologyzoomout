import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathways,buildPath,routeForModel,pathForMolecule,supportsMolecule,pathwayInfo} from '../src/pathways.js';
import {modelInfo,nodesAtStage} from '../src/content.js';
import {structureInfo,childrenOf} from '../src/structures.js';
import {featureNotes} from '../src/field-notes.js';
const data=JSON.parse(fs.readFileSync(new URL('../public/data/ontology.json',import.meta.url)));
const molecules=JSON.parse(fs.readFileSync(new URL('../public/data/molecules.json',import.meta.url)));
const ids=r=>r.steps.map(s=>s.id);

test('Visible detail notes link to original curriculum nodes and inspectable models',()=>{
 for(const [id,feature] of Object.entries(featureNotes)){
  assert.ok(data.nodes.some(node=>node.id===feature.node),`${id}: original node`);
  for(const organism of ['plant','animal'])assert.ok(ids(routeForModel(feature.target,organism)).includes(feature.target),`${id}: valid inspection route`);
  assert.equal(new URL(feature.source).hostname,'openstax.org');
 }
});

test('Every path has justified adjacent relationships, no cycles, and a coherent organism context',()=>{
 for(const [id,definition]of Object.entries(pathways))for(const organism of definition.organisms){
  const route=buildPath(id,organism),models=ids(route);
  assert.equal(new Set(models).size,models.length);assert.equal(models.at(-1),'biosphere');assert.equal(route.edges.length,models.length-1);
  route.steps.forEach(s=>assert.ok(s.id==='molecules'||modelInfo[s.id]||structureInfo[s.id]||pathwayInfo[s.id],s.id));
  route.edges.forEach((edge,i)=>{assert.equal(edge.from,models[i]);assert.equal(edge.to,models[i+1]);assert.ok(edge.reason&&edge.source.startsWith('https://'));});
  if(organism==='animal'){assert.ok(models.includes('rabbit')&&models.includes('rabbit-population'));assert.ok(!models.some(id=>['plant-cell','leaf','plant','population','chloroplast','vacuole'].includes(id)));}
  else{assert.ok(id==='woodland'?models.includes('tree')&&models.includes('tree-population'):models.includes('plant')&&models.includes('population'));assert.ok(!models.includes('animal-cell')&&!models.includes('rabbit'));}
 }
});
test('Nuclear DNA never zooms into a membrane; lipid components never zoom into DNA',()=>{
 const dna=ids(buildPath('dna'));assert.deepEqual(dna.slice(0,6),['molecules','dna','chromatin','chromosome','nucleus','plant-cell']);assert.ok(!dna.includes('membrane'));
 assert.deepEqual(ids(buildPath('membrane')).slice(0,4),['molecules','phospholipid','membrane','plant-cell']);
 assert.ok(!ids(buildPath('membrane')).includes('dna'));
});
test('Every selectable molecule gets a compatible molecular path',()=>{
 for(const molecule of molecules){const id=pathForMolecule(molecule);assert.ok(supportsMolecule(id,molecule));assert.equal(buildPath(id).steps[0].id,'molecules');}
 for(const molecule of molecules.filter(m=>m.family==='amino-acids'))assert.equal(pathForMolecule(molecule),'translation');
 assert.equal(pathForMolecule(molecules.find(m=>m.id==='ribose'),'dna'),'rna');
 assert.equal(supportsMolecule('dna',molecules.find(m=>m.id==='glucose')),false);
});
test('Organelle DNA and ATP synthase retain their containing organelle',()=>{
 for(const [model,parent,route]of [['mitochondrial-dna','mitochondrion','mitochondrial-dna'],['chloroplast-dna','chloroplast','chloroplast-dna'],['atp-synthase','mitochondrion','respiration'],['chloroplast-atp-synthase','thylakoid','chloroplast-atp']]){
  const next=routeForModel(model,'plant','dna'),models=ids(next);assert.equal(next.id,route);assert.equal(models[models.indexOf(model)+1],parent);
 }
 assert.equal(routeForModel('rrna','plant','dna','nucleolus').id,'nucleolar-rna');
 assert.equal(routeForModel('polypeptide','animal','dna','free-ribosome').id,'free-translation');
 assert.deepEqual(ids(routeForModel('free-ribosome','animal')).slice(2,5),['free-ribosome','cytosol','animal-cell']);
 assert.deepEqual(ids(routeForModel('tonoplast')).slice(2,5),['tonoplast','vacuole','plant-cell']);
});
test('Inspection targets all have routes back into valid containing structures',()=>{
 for(const model of ['animal-cell','plant-cell','nucleus','nucleolus','mitochondrion','chloroplast','thylakoid','leaf',...Object.keys(pathwayInfo)]){
  for(const child of pathwayInfo[model]?.children||childrenOf(model)){
   const route=routeForModel(child,model==='animal-cell'?'animal':'plant','dna',model);assert.ok(ids(route).includes(child),child);
  }
 }
 assert.equal(routeForModel('centrosome','plant').organism,'animal');assert.equal(routeForModel('vacuole','animal').organism,'plant');
});
test('All original ontology nodes remain reachable and the canonical data are unchanged',()=>{
 const reachable=new Set();for(const id of Object.keys(pathways))for(const step of buildPath(id).steps)for(const node of nodesAtStage(data,step.stage))reachable.add(node.id);
 assert.equal(reachable.size,234);
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../public/data/ontology.json',import.meta.url))).digest('hex'),'6be0903fc68997703c44afe401a8fe38f6cc42c5c7f10a354b6c15ad9fa2282a');
});
