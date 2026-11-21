import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {lessons,checkpoints,lessonKey} from '../src/lessons.js';
import {buildPath} from '../src/pathways.js';
import {processes} from '../src/processes.js';
import {emptyProgress,loadProgress,beginLesson,answerStep,isAnswered,finishLesson,reviewItems,recordReview,DAY,STORAGE_KEY} from '../src/lesson-progress.js';

test('Every lesson uses existing ontology nodes, coherent routes and compatible reaction models',()=>{
 const nodes=new Set(JSON.parse(fs.readFileSync('public/data/ontology.json')).nodes.map(n=>n.id));
 const ids=new Set();
 for(const lesson of lessons){
  assert.ok(!ids.has(lesson.id));ids.add(lesson.id);assert.ok(lesson.nodes.every(id=>nodes.has(id)));
  assert.equal(checkpoints(lesson).length,3);
  for(const step of lesson.steps){
   const path=buildPath(step.view.path,step.view.organism);assert.ok(path.steps.some(s=>s.id===step.view.model),`${lesson.id}/${step.id}`);
   if(step.view.process)assert.ok(processes[step.view.process].models.includes(step.view.lab?'lesson-lab':step.view.model));
   if(step.type==='question'){assert.equal(step.options.filter(o=>o.id===step.correct).length,1);assert.ok(step.options.every(o=>o.feedback.length>30));}
   if(step.cues){assert.equal(step.cues[0].at,0);assert.ok(step.cues.every((c,i)=>c.at<=1&&(!i||c.at>step.cues[i-1].at)));}
  }
 }
});
test('Corrected answers retain the first attempt; drafting recall does not complete it',()=>{
 let p=beginLesson(emptyProgress(),'membranes',1);
 p=answerStep(p,'membranes','predict',{choice:'up'});p=answerStep(p,'membranes','predict',{choice:'down'});
 assert.equal(p.lessons.membranes.answers.predict.firstCorrect,false);assert.equal(p.lessons.membranes.answers.predict.attempts,2);
 p=answerStep(p,'membranes','recall',{text:'The protein provides a path.'});
 const recall=lessons[0].steps.at(-1);assert.equal(isAnswered(recall,p.lessons.membranes.answers.recall),false);
 const blank=answerStep(p,'membranes','recall',{text:'',rating:'ready'});assert.equal(isAnswered(recall,blank.lessons.membranes.answers.recall),false);
 assert.equal(finishLesson(p,'membranes',100).lessons.membranes.finishedAt,null);
 p=answerStep(p,'membranes','recall',{text:'The protein provides a path down the concentration gradient.',rating:'ready'});
 assert.equal(isAnswered(recall,p.lessons.membranes.answers.recall),true);
});
function completed(){let p=beginLesson(emptyProgress(),'membranes');for(const s of checkpoints(lessons[0]))p=answerStep(p,'membranes',s.id,s.type==='question'?{choice:s.correct}:{text:'A written explanation.',rating:'ready'});return finishLesson(p,'membranes',100);}
test('Reviews become due after a delay, advance after success, and return sooner after errors',()=>{
 const p=completed(),key=lessonKey(lessons[0],checkpoints(lessons[0])[0]);
 assert.equal(reviewItems(p,100).length,0);assert.equal(reviewItems(p,100+DAY).length,3);
 assert.deepEqual(recordReview(p,key,true,100),p,'early extra practice cannot postpone a due review');
 const next=recordReview(p,key,true,100+DAY);assert.equal(next.reviews[key].due,100+4*DAY);
 const retry=recordReview(next,key,false,100+4*DAY);assert.equal(retry.reviews[key].due,100+5*DAY);assert.equal(retry.reviews[key].interval,0);
 assert.deepEqual(finishLesson(p,'membranes',100+DAY).reviews,p.reviews,'revisiting a lesson cannot reset review dates');
});
test('Corrupt or stale local data cannot break lesson loading or inject unknown checkpoints',()=>{
 const storage={getItem:()=>'{bad'};assert.deepEqual(loadProgress(storage),emptyProgress());
 storage.getItem=()=>JSON.stringify({version:1,lastLesson:'unknown',lessons:{membranes:{step:999,answers:{predict:{choice:'invalid'}},finishedAt:null}},reviews:{bogus:{due:0}}});
 const clean=loadProgress(storage);assert.equal(clean.lastLesson,null);assert.equal(clean.lessons.membranes.step,5);assert.deepEqual(clean.lessons.membranes.answers,{});assert.deepEqual(clean.reviews,{});
 storage.getItem=key=>{assert.equal(key,STORAGE_KEY);return JSON.stringify(completed());};assert.equal(reviewItems(loadProgress(storage),100+DAY).length,3);
});
