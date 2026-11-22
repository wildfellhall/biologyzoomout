import {lessons,lessonById,checkpoints,lessonKey} from './lessons.js';
import {lessonFlow,resolveLessonPart} from './lesson-flow.js';

export const STORAGE_KEY='biology-zoomout-lessons-v1';
export const DAY=86400000;
// Editorial review intervals, not an experimentally optimized schedule.
export const REVIEW_DAYS=[1,3,7,21];
export const emptyProgress=()=>({version:1,lastLesson:null,lessons:{},reviews:{}});
const time=value=>Number.isFinite(value)&&value>=0?value:null;

export function loadProgress(storage){
 const clean=emptyProgress();
 try{
  const raw=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');if(raw?.version!==1)return clean;
  clean.lastLesson=lessonById(raw.lastLesson)?.id||null;
  for(const lesson of lessons){
   const saved=raw.lessons?.[lesson.id];if(!saved||typeof saved!=='object')continue;
   const entry={step:Math.max(0,Math.min(lesson.steps.length-1,Number.isInteger(saved.step)?saved.step:0)),answers:{},finishedAt:time(saved.finishedAt)};
   entry.part=lessonFlow(lesson)[resolveLessonPart(lesson,{step:entry.step,part:saved.part})].id;
   for(const step of checkpoints(lesson)){
    const answer=saved.answers?.[step.id];if(!answer||typeof answer!=='object')continue;
    if(step.type==='question'&&!step.options.some(o=>o.id===answer.choice))continue;
    entry.answers[step.id]={snapshot:answer.snapshot||null,history:Array.isArray(answer.history)?answer.history:[],choice:answer.choice,text:typeof answer.text==='string'?answer.text.slice(0,2000):'',rating:['ready','again'].includes(answer.rating)?answer.rating:null,firstCorrect:answer.firstCorrect===true,attempts:Math.max(0,Math.min(10000,Number.isInteger(answer.attempts)?answer.attempts:0))};
   }
   clean.lessons[lesson.id]=entry;
   for(const step of checkpoints(lesson)){
    const key=lessonKey(lesson,step),r=raw.reviews?.[key];
    if(r&&time(r.due)!==null&&entry.finishedAt!==null)clean.reviews[key]={due:r.due,interval:Math.max(0,Math.min(REVIEW_DAYS.length-1,Number.isInteger(r.interval)?r.interval:0)),lastReviewed:time(r.lastReviewed)};
   }
  }
 }catch{}
 return clean;
}
export function saveProgress(progress,storage){try{if(!storage)return false;storage.setItem(STORAGE_KEY,JSON.stringify(progress));return true;}catch{return false;}}
export function beginLesson(progress,id,step=0,part=undefined){
 const lesson=lessonById(id);if(!lesson)return progress;
 const next=structuredClone(progress);next.lastLesson=id;
 next.lessons[id]={answers:{},finishedAt:null,...next.lessons[id],step:Math.max(0,Math.min(lesson.steps.length-1,Number.isInteger(step)?step:0))};
 next.lessons[id].part=lessonFlow(lesson)[resolveLessonPart(lesson,{step:next.lessons[id].step,part:part===undefined?next.lessons[id].part:part})].id;return next;
}
export function answerStep(progress,id,stepId,response){
 const lesson=lessonById(id),step=lesson?.steps.find(s=>s.id===stepId);if(!step||!['question','recall'].includes(step.type))return progress;
 if(step.type==='question'&&!step.options.some(o=>o.id===response.choice))return progress;
 const next=beginLesson(progress,id,progress.lessons[id]?.step||0),previous=next.lessons[id].answers[stepId];
 const text=String(response.text||'').slice(0,2000);
 const answer=step.type==='question'?{choice:response.choice,correct:response.choice===step.correct}:{text,rating:text.trim().length>=12&&['ready','again'].includes(response.rating)?response.rating:null};
 const assessed=step.type==='question'||!!answer.rating,correct=step.type==='question'?answer.correct:answer.rating==='ready';
 next.lessons[id].answers[stepId]={...previous,...answer,snapshot:step.type==='question'?{version:step.version||1,prompt:step.prompt,options:structuredClone(step.options),correct:step.correct}:null,history:[...(previous?.history||[]),...(assessed?[{at:Date.now(),...answer,version:step.version||1,snapshot:step.type==='question'?{prompt:step.prompt,options:structuredClone(step.options),correct:step.correct}:null}]:[])],firstCorrect:previous?.attempts?previous.firstCorrect:correct,attempts:(previous?.attempts||0)+(assessed?1:0)};
 return next;
}
export function isAnswered(step,answer){return step.type==='question'?!!answer?.choice:step.type==='recall'?!!answer?.rating&&(answer.text?.trim().length||0)>=12:true;}
export function finishLesson(progress,id,now=Date.now()){
 const lesson=lessonById(id),entry=progress.lessons[id];if(!lesson||!entry||checkpoints(lesson).some(s=>!isAnswered(s,entry.answers[s.id])))return progress;
 const next=structuredClone(progress);next.lessons[id].finishedAt=entry.finishedAt??now;
 for(const step of checkpoints(lesson)){const key=lessonKey(lesson,step);next.reviews[key]??={due:now+DAY,interval:0,lastReviewed:null};}
 return next;
}
export function reviewItems(progress,now=Date.now(),includeFuture=false){
 return lessons.flatMap(lesson=>checkpoints(lesson).map(step=>({lesson,step,key:lessonKey(lesson,step)}))).filter(item=>progress.reviews[item.key]&&(includeFuture||progress.reviews[item.key].due<=now)).sort((a,b)=>progress.reviews[a.key].due-progress.reviews[b.key].due);
}
export function recordReview(progress,key,correct,now=Date.now()){
 const previous=progress.reviews[key];if(!previous)return progress;
 const next=structuredClone(progress);
 // Extra practice before a due date does not postpone the scheduled retrieval.
 if(previous.due>now)return next;
 const interval=correct?Math.min(REVIEW_DAYS.length-1,previous.interval+1):0;
 next.reviews[key]={due:now+REVIEW_DAYS[interval]*DAY,interval,lastReviewed:now};return next;
}
