import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/lessons.js';
import {activities,loadExperiments,saveExperiments,experimentResult} from '../src/lesson-activities.js';
import {sampleProcess} from '../src/processes.js';

test('Every lesson explanation has an animated model, linked diagram, question and runnable experiment',()=>{
 assert.equal(lessons.length,7);
 for(const lesson of lessons){
  assert.ok(activities[lesson.id]);assert.ok(activities[lesson.id].options.length>=2);
  for(const step of lesson.steps.filter(s=>['explain','observe','experiment'].includes(s.type))){assert.ok(step.view.process);assert.ok(step.cues.length>=3);}
 }
});
test('Replication inhibition distinguishes template exposure, synthesis and nick sealing',()=>{
 const run=c=>sampleProcess('replication',1,'favor-a',{condition:c});
 const normal=run('normal'),helicase=run('helicase-off'),polymerase=run('polymerase-off'),ligase=run('ligase-off');
 assert.equal(normal.leading+normal.lagging.length,56);assert.equal(normal.nicks,0);
 assert.equal(helicase.unwound,0);assert.equal(helicase.leading+helicase.lagging.length,0);
 assert.equal(polymerase.unwound,28);assert.equal(polymerase.leading+polymerase.lagging.length,0);
 assert.equal(ligase.leading+ligase.lagging.length,56);assert.equal(ligase.nicks,5);
});
test('The genetic code determines product identity, synonymous changes and premature release',()=>{
 const run=c=>sampleProcess('translation',1,'favor-a',{condition:c});
 assert.deepEqual(run('normal').chain,['Met','Ala','Phe','Glu','Gly']);
 assert.deepEqual(run('silent').chain,run('normal').chain);
 assert.deepEqual(run('missense').chain,['Met','Ala','Lys','Glu','Gly']);
 assert.deepEqual(run('stop').chain,['Met','Ala']);
 for(const condition of ['normal','silent','missense','stop']){
  const end=run(condition);assert.equal(end.released,true);assert.equal(end.codons[end.current],'UAA');
  let previous=0;for(let i=0;i<=100;i++){const s=sampleProcess('translation',i/100,'favor-a',{condition});assert.ok(s.length>=previous);assert.ok(!s.chain.includes('Stop'));previous=s.length;}
 }
});
test('Peptide extension needs a charged tRNA and catalysis; a linear chain has n−1 bonds',()=>{
 for(const condition of ['normal','uncharged','blocked'])for(let i=0;i<=100;i++){
  const s=sampleProcess('peptide',i/100,'favor-a',{condition});
  assert.equal(s.bondCount,s.residues-1);
  if(condition!=='normal')assert.equal(s.formed,false);
 }
 assert.equal(sampleProcess('peptide',1).residues,4);
});
test('Experimental controls change transport and energy outcomes without changing initial conditions',()=>{
 const closed=sampleProcess('diffusion',1,'favor-a',{condition:'closed'});assert.equal(closed.top,20);assert.equal(closed.bottom,4);
 assert.equal(sampleProcess('diffusion',1).top,12);
 assert.equal(sampleProcess('chemiosmosis',1).atpYield,100);
 assert.equal(sampleProcess('chemiosmosis',1,'favor-a',{condition:'leaky'}).atpYield,20);
 assert.equal(sampleProcess('light',1,'favor-a',{condition:'dark'}).atpYield,0);
});
test('Predictions and bounded run comparisons survive storage; stale or corrupt records are discarded',()=>{
 let value;const storage={setItem:(key,data)=>{value=data;},getItem:()=>value};
 const data={translation:{condition:'stop',prediction:'I expect a shorter chain.',runs:[{condition:'stop',prediction:'Two residues',result:experimentResult('translation',sampleProcess('translation',1,'favor-a',{condition:'stop'}))}]}};
 saveExperiments(storage,data);assert.deepEqual(loadExperiments(storage),data);
 value='{bad';assert.deepEqual(loadExperiments(storage),{});
 value=JSON.stringify({unknown:{},translation:{condition:'invalid',prediction:123,runs:[{condition:'invalid',result:'x'}]}});
 assert.deepEqual(loadExperiments(storage),{translation:{condition:'normal',prediction:'',runs:[]}});
});
