import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/lessons.js';
import {lessonFlow,resolveLessonPart} from '../src/lesson-flow.js';
import {STORAGE_KEY,emptyProgress,loadProgress,saveProgress,beginLesson,answerStep,finishLesson} from '../src/lesson-progress.js';
import {activityMarkup} from '../src/lesson-activities.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};};

test('Every lesson has one ordered path through all explanations, models, activities and questions',()=>{
 for(const lesson of lessons){
  const flow=lessonFlow(lesson);assert.equal(flow.length,11);assert.equal(new Set(flow.map(p=>p.id)).size,11);
  assert.deepEqual([...new Set(flow.map(p=>p.step))],[0,1,2,3,4,5]);
  assert.deepEqual(flow.map(p=>p.kind),['read','checkpoint','inspect','experiment','read','label','build','practice','practice','checkpoint','recall']);
  assert.deepEqual(flow.filter(p=>p.kind==='practice').map(p=>p.question),[0,1]);
  for(const p of flow){assert.ok(lesson.steps[p.step]);if(['read','inspect','experiment'].includes(p.kind))assert.ok(lesson.steps[p.step].view.process);}
 }
});

test('Legacy step links keep their meanings while new part links identify precise activities',()=>{
 const lesson=lessons[0],flow=lessonFlow(lesson);
 for(let step=0;step<6;step++)assert.equal(flow[resolveLessonPart(lesson,{step})].step,step);
 assert.equal(flow[resolveLessonPart(lesson,{part:'build'})].id,'build');
 assert.equal(flow[resolveLessonPart(lesson,{step:3,part:'practice-2'})].id,'practice-2');
 assert.equal(flow[resolveLessonPart(lesson,{step:1,part:'build'})].id,'predict');
 assert.equal(flow[resolveLessonPart(lesson,{step:3,part:'unknown'})].id,'example');
 assert.equal(flow[resolveLessonPart(lesson,{step:999})].id,'recall');
});

test('Resume retains the exact part without reinterpreting answers or completed legacy lessons',()=>{
 const storage=memory(),lesson=lessons[0];let progress=beginLesson(emptyProgress(),lesson.id,3,'build');
 saveProgress(progress,storage);assert.equal(loadProgress(storage).lessons[lesson.id].part,'build');
 progress=beginLesson(progress,lesson.id,3,'practice-2');progress=answerStep(progress,lesson.id,'predict',{choice:lesson.steps[1].correct});
 assert.equal(progress.lessons[lesson.id].part,'practice-2');
 const before=structuredClone(progress.lessons[lesson.id].answers);
 progress=beginLesson(progress,lesson.id,4,'transfer');assert.deepEqual(progress.lessons[lesson.id].answers,before);
 progress=answerStep(progress,lesson.id,'transfer',{choice:lesson.steps[4].correct});
 progress=answerStep(progress,lesson.id,'recall',{text:'A channel permits passage down the concentration gradient without supplying ATP.',rating:'ready'});
 progress=finishLesson(progress,lesson.id,12345);
 delete progress.lessons[lesson.id].part;storage.setItem(STORAGE_KEY,JSON.stringify(progress));
 const loaded=loadProgress(storage);assert.equal(loaded.lessons[lesson.id].finishedAt,12345);
 assert.deepEqual(loaded.reviews,progress.reviews);assert.equal(loaded.lessons[lesson.id].part,'transfer');
 assert.deepEqual(loaded.lessons[lesson.id].answers.predict.history,progress.lessons[lesson.id].answers.predict.history);
});

test('Activity markup contains only the current task, without tab navigation or hidden alternative tasks',()=>{
 const saved={condition:'normal',prediction:'',runs:[]};
 for(const kind of ['diagram','experiment','label','build','check']){
  const html=activityMarkup('replication',saved,kind);assert.ok(!html.includes('role="tab'));assert.ok(!html.includes('data-activity-tab'));
  assert.equal(html.includes('id="experiment-pane"'),kind==='experiment');assert.equal(html.includes('id="check-pane"'),kind==='check');
  assert.equal(html.includes('id="visual-practice"'),kind==='label'||kind==='build');
 }
});
