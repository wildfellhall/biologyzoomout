import test from 'node:test';
import assert from 'node:assert/strict';
import {divisionState,divisionStages} from '../src/division-state.js';
import {divisionDiagram} from '../src/division-diagram.js';
import {sampleProcess,phaseAt} from '../src/processes.js';
import {courseLessons} from '../src/course/lessons.js';
const counts=s=>s.cells.map(c=>[c.chromosomes,c.dna,c.contentC]);

test('Mitosis copies DNA before division, separates sisters, and preserves both complete homologous sets',()=>{
 assert.deepEqual(counts(divisionState('mitosis',0)),[[4,4,2]]);
 assert.deepEqual(counts(divisionState('mitosis',.45)),[[4,8,4]]);
 assert.deepEqual(counts(divisionState('mitosis',.65)),[[8,8,4]]);
 const final=divisionState('mitosis',1);assert.deepEqual(counts(final),[[4,4,2],[4,4,2]]);
 for(const cell of final.cells)assert.deepEqual(cell.members.map(id=>final.chromatids[id].chromosome).sort(),[0,1,2,3]);
 const blocked=divisionState('mitosis',1,'blocked');assert.equal(blocked.stage,'Metaphase');assert.equal(blocked.arrested,true);
 assert.deepEqual(counts(blocked),[[4,8,4]]);assert.equal(blocked.membraneI,0);assert.equal(blocked.separateII,0);
});
test('Meiosis separates homologs first and sisters second, with no intervening DNA replication',()=>{
 assert.deepEqual(counts(divisionState('meiosis',0)),[[4,4,2]]);
 assert.deepEqual(counts(divisionState('meiosis',.35)),[[4,8,4]]);
 const first=divisionState('meiosis',.65);assert.deepEqual(counts(first),[[2,4,2],[2,4,2]]);
 for(const c of first.cells){const members=c.members.map(i=>first.chromatids[i]);assert.equal(new Set(members.map(x=>x.chromosome)).size,2);assert.deepEqual(members.map(x=>x.sister),[0,1,0,1]);}
 assert.deepEqual(counts(divisionState('meiosis',.87)),[[4,4,2],[4,4,2]]);
 const final=divisionState('meiosis',1);assert.deepEqual(counts(final),Array.from({length:4},()=>[2,2,1]));
 for(const c of final.cells)assert.deepEqual(c.members.map(i=>final.chromatids[i].pair),[0,1]);
 for(const t of [.65,.7,.8,.9,1])assert.equal(divisionState('meiosis',t).cells.reduce((n,c)=>n+c.dna,0),8);
});
test('Crossing over exchanges corresponding distal segments of exactly two nonsister chromatids',()=>{
 const before=divisionState('meiosis',.23),after=divisionState('meiosis',1);
 assert.equal(before.chromatids.filter(c=>c.distalOrigin!==c.homolog).length,0);
 const recombinants=after.chromatids.filter(c=>c.distalOrigin!==c.homolog);
 assert.deepEqual(recombinants.map(c=>c.id),[1,2]);assert.notEqual(recombinants[0].homolog,recombinants[1].homolog);
 assert.equal(after.chromatids.filter(c=>c.distalOrigin===0).length,4);
 assert.equal(divisionState('meiosis',1,'no-crossover').chromatids.filter(c=>c.distalOrigin!==c.homolog).length,0);
 const alternate=divisionState('meiosis',1,'alternate');assert.deepEqual(counts(alternate),counts(after));
 assert.notDeepEqual(alternate.cells.map(c=>c.members),after.cells.map(c=>c.members));
});
test('Meiosis-I nondisjunction retains both homologs together and yields n+1 / n−1 products',()=>{
 const first=divisionState('meiosis',.65,'nondisjunction');assert.deepEqual(first.cells.map(c=>c.chromosomes),[3,1]);
 assert.deepEqual(first.cells.map(c=>c.dna),[6,2]);
 const final=divisionState('meiosis',1,'nondisjunction');assert.deepEqual(final.cells.map(c=>c.chromosomes),[3,3,1,1]);
 assert.deepEqual(final.cells.map(c=>c.dna),[3,3,1,1]);assert.equal(new Set(final.cells.flatMap(c=>c.members)).size,8);
 assert.ok(final.cells.every(c=>c.contentC===null),'Do not infer aneuploid DNA mass from chromosome counts');
});
test('All stages scrub deterministically; diagrams, captions and lesson phase controls share the same state',()=>{
 for(const [kind,topic,options]of [['mitosis','4.5',['normal','blocked']],['meiosis','5.1',['normal','nondisjunction','no-crossover','alternate']]]){
  const l=courseLessons.find(l=>l.topic===topic);assert.deepEqual(l.steps[0].cues,divisionStages[kind]);
  for(const option of options)for(let i=0;i<=100;i++){
   const t=i/100,s=divisionState(kind,t,option);divisionState(kind,1,option);assert.deepEqual(divisionState(kind,t,option),s);
   assert.equal(new Set(s.cells.flatMap(c=>c.members)).size,s.chromatids.filter(c=>c.visible).length);
   assert.ok(s.chromatids.every(c=>c.position.every(Number.isFinite)));
   assert.ok(!/NaN|undefined|Infinity/.test(divisionDiagram(s)));
   const snapshot=sampleProcess(`topic-${topic}`,t,'favor-a',{condition:option});assert.equal(snapshot.caption,s.caption);assert.deepEqual(snapshot.cells,s.cells);
  }
  for(const [i,stage]of divisionStages[kind].entries())assert.equal(phaseAt(`topic-${topic}`,stage.at),i);
 }
});
