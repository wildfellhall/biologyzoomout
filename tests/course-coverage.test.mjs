import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {courseLessons,framework} from '../src/course/lessons.js';
import {courseContent} from '../src/course/content.js';
import {labs,sampleLab} from '../src/course/labs.js';
import {sampleProcess,processes} from '../src/processes.js';
import {activities,diagramSVG,experimentResult} from '../src/lesson-activities.js';
import {emptyProgress,beginLesson,answerStep,finishLesson,loadProgress,saveProgress,reviewItems,DAY} from '../src/lesson-progress.js';
const ontology=JSON.parse(fs.readFileSync('public/data/ontology.json'));

test('Every independently inventoried official topic has one complete authored lesson and a runnable model',()=>{
 assert.deepEqual(framework.topics.map(t=>t.id),ontology.topics.map(t=>t.id));
 assert.equal(courseLessons.length,60);
 assert.deepEqual([...new Set(courseLessons.map(l=>l.unitNumber))],[1,2,3,4,5,6,7,8]);
 assert.equal(new Set(courseLessons.map(l=>l.topic)).size,60);
 assert.equal(new Set(courseContent.map(l=>l.explanation)).size,60);
 for(const l of courseLessons){
  const topic=ontology.topics.find(t=>t.id===l.topic);assert.equal(l.title,topic.title);
  assert.ok(l.source.endsWith(`#page=${topic.pdf_page}`));assert.ok(l.nodes.length>0);
  assert.equal(l.steps.length,6);assert.equal(l.steps.filter(s=>s.type==='question').length,2);
  assert.ok(l.steps[0].body.length>200);assert.ok(l.steps[3].body.length>150);
  const a=activities[l.id];assert.ok(a.options.length>=2);assert.ok(a.note.length>70);
  for(const option of a.options)for(const t of [0,.17,.51,.83,1]){
   const s=sampleProcess(l.steps[0].view.process,t,'favor-a',{condition:option.id});
   assert.ok(Number.isFinite(s.value),`${l.topic}/${option.id}`);assert.ok(s.metrics.length);
   assert.ok(diagramSVG(l.id,s).includes('<svg'));assert.ok(!/NaN|undefined|Infinity/.test(diagramSVG(l.id,s)));
   assert.ok(experimentResult(l.id,s).length>3);assert.equal(s.id,`topic-${l.topic}`);
  }
 }
});
test('Size, osmosis, polymers, and enzyme rates obey their stated model relationships',()=>{
 const a=sampleLab('cell-size',1),b=sampleLab('cell-size',1,'large');
 assert.ok(Math.abs(b.area/a.area-4)<1e-9);assert.ok(Math.abs(b.volume/a.volume-8)<1e-9);assert.equal(b.value/a.value,.5);
 assert.equal(sampleLab('polymer',1,'two').water,2);assert.equal(sampleLab('polymer',1,'two').value,3);
 assert.ok(sampleLab('osmosis',1).value<1);assert.ok(sampleLab('osmosis',1,'hypotonic').value>1);assert.equal(sampleLab('osmosis',1,'isotonic').value,1);
 assert.ok(Math.abs(sampleLab('enzyme',1).value-10/3)<1e-9);assert.equal(sampleLab('enzyme',1,'high').value,8);
 assert.equal(sampleLab('coupling',1).deltaG,-18);assert.equal(sampleLab('coupling',1,'uncoupled').value,0);
});
test('Division, inheritance, transcription, and PCR produce the specified products',()=>{
 assert.equal(sampleLab('mitosis',0).value,0);assert.equal(sampleLab('mitosis',1).value,2);assert.equal(sampleLab('mitosis',1,'blocked').value,0);
 assert.equal(sampleLab('checkpoint',1).value,0);assert.equal(sampleLab('checkpoint',1,'failed').value,2);
 assert.deepEqual(sampleLab('meiosis',1).distribution,[2,2,2,2]);assert.deepEqual(sampleLab('meiosis',1,'nondisjunction').distribution,[3,3,1,1]);
 assert.deepEqual(sampleLab('mendel',1).distribution,[.25,.5,.25]);assert.deepEqual(sampleLab('mendel',1,'testcross').distribution,[0,.5,.5]);
 assert.equal(sampleLab('transcription',.5).spliced,false);assert.equal(sampleLab('transcription',.7).transcribed,9);assert.equal(sampleLab('transcription',.7).spliced,true);
 assert.equal(sampleLab('transcription',1).exons,3);assert.equal(sampleLab('transcription',1,'skip').exons,2);assert.equal(sampleLab('transcription',1,'blocked').value,0);
 assert.equal(sampleLab('pcr',1).value,256);assert.equal(sampleLab('pcr',1,'no-primer').value,1);
 assert.equal(sampleLab('mutation',1,'one').sequence.length,17);assert.equal(sampleLab('mutation',1,'three').sequence.length,15);
});
test('Population and ecological results distinguish assumptions, conservation, and topology',()=>{
 assert.equal(sampleLab('selection',1,'neutral').p,.35);assert.equal(sampleLab('resistance',1,'absent').p,0);
 for(const option of labs['hardy-weinberg'].options){const s=sampleLab('hardy-weinberg',1,option.id);assert.ok(Math.abs(s.distribution.reduce((a,b)=>a+b,0)-1)<1e-12);}
 assert.equal(sampleLab('hardy-weinberg',1).value,48);
 assert.equal(sampleLab('phylogeny',1).value,sampleLab('phylogeny',1,'rotated').value);
 assert.ok(sampleLab('speciation',1).value>sampleLab('speciation',1,'migration').value);
 assert.ok(Math.abs(sampleLab('energy-flow',1).value-100)<1e-9);assert.ok(Math.abs(sampleLab('energy-flow',1,'efficient').value-400)<1e-9);
 assert.ok(Math.abs(sampleLab('population-growth',1).value-100*Math.exp(2))<1e-9);
 assert.ok(sampleLab('logistic',1).value<500);assert.ok(sampleLab('logistic',1,'habitat-loss').value<200);
 assert.ok(sampleLab('biodiversity',.6).value>sampleLab('biodiversity',.6,'single').value);
 assert.ok(sampleLab('disturbance',1,'enriched').value<sampleLab('disturbance',1).value);
});
test('Every course experiment is deterministic when scrubbed backward and preserves input conditions',()=>{
 for(const c of courseContent)for(const option of labs[c.sim].options){const first=sampleLab(c.sim,.41,option.id);sampleLab(c.sim,.9,option.id);assert.deepEqual(sampleLab(c.sim,.41,option.id),first);}
});
test('Course checkpoints and legacy answers coexist and schedule reviews independently',()=>{
 let p=beginLesson(emptyProgress(),'membranes',1);p=answerStep(p,'membranes','predict',{choice:'down'});
 const lesson=courseLessons[0];p=beginLesson(p,lesson.id);
 for(const step of lesson.steps.filter(s=>['question','recall'].includes(s.type)))p=answerStep(p,lesson.id,step.id,step.type==='question'?{choice:step.correct}:{text:'Partial charges support intermolecular hydrogen bonds and thermal buffering.',rating:'ready'});
 p=finishLesson(p,lesson.id,100);let value;const storage={setItem:(k,v)=>value=v,getItem:()=>value};saveProgress(p,storage);const loaded=loadProgress(storage);
 assert.equal(loaded.lessons.membranes.answers.predict.choice,'down');assert.equal(reviewItems(loaded,100+DAY).length,3);
 assert.equal(loaded.lessons[lesson.id].answers.recall.rating,'ready');
});

test('Exported topic coverage stays synchronized with the authored lessons and sources',()=>{
 const coverage=JSON.parse(fs.readFileSync('public/data/lesson-coverage.json'));
 assert.equal(coverage.lessonCount,60);assert.equal(coverage.scope,framework.scope);
 for(const row of coverage.topics){const lesson=courseLessons.find(l=>l.topic===row.topic);assert.equal(row.lesson,lesson.id);assert.deepEqual(row.relatedNodes,lesson.nodes);assert.equal(row.source,lesson.source);assert.equal(row.experiment,lesson.labKind);}
});
