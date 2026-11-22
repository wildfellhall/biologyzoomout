import {conceptByTopic} from '../practice/concepts.js';
import {extraByLesson,focusedTopics} from './questions.js';
import {loadPractice,savePractice,practiceRecord,submitPractice} from '../practice/progress.js';
import {esc} from '../node-detail.js';

export function createLessonQuestions(container,id,storage,{index=0,onChange=()=>{}}={}){
 const extra=extraByLesson[id],questions=[conceptByTopic[focusedTopics[id]||extra.topic],extra];
 let persistent=!!storage,data=loadPractice(storage);
 function render(focus=false){
  const q=questions[index],r=practiceRecord(data,q),chosen=q.options.find(o=>o.id===r.choice);
  container.innerHTML=`<p class="lesson-practice-prompt" id="inline-question" tabindex="-1">${esc(q.prompt)}</p><div class="quick-choices" role="group" aria-labelledby="inline-question">${q.options.map((o,i)=>`<button data-quick-choice="${i}" aria-pressed="${r.choice===o.id}" ${r.reviewing?'disabled':''}><span class="choice-letter">${String.fromCharCode(65+i)}</span>${esc(o.text)}</button>`).join('')}</div><div id="quick-feedback" role="status" tabindex="-1" ${r.reviewing?'':'hidden'}>${r.reviewing?`<b>${r.choice===q.correct?'Correct.':'Review the concept.'}</b><p>${esc(chosen?.feedback||'')}</p><details><summary>Compare all explanations</summary>${q.options.map(o=>`<p><b>${o.id===q.correct?'Best answer: ':''}${esc(o.text)}</b><br>${esc(o.feedback)}</p>`).join('')}</details><button data-question-retry>Try again</button><small>First attempt: ${r.submissions[0]?.correct?'correct':'needs review'} · ${r.submissions.length} attempt${r.submissions.length===1?'':'s'}</small>`:''}</div><p class="practice-save-status" role="status" ${persistent?'hidden':''}>Progress could not be saved on this device.</p>`;
  container.dataset.question=q.id;onChange();if(focus)container.querySelector('#inline-question').focus({preventScroll:true});
 }
 container.addEventListener('click',event=>{
  const choice=event.target.closest('[data-quick-choice]'),retry=event.target.closest('[data-question-retry]');if(!choice&&!retry)return;
  event.stopPropagation();if(persistent)data=loadPractice(storage);const q=questions[index],r=practiceRecord(data,q);
  if(retry){r.reviewing=false;r.choice=null;}else{if(r.reviewing)return;r.choice=q.options[Number(choice.dataset.quickChoice)]?.id;if(!submitPractice(data,q))return;}
  persistent=savePractice(storage,data);render();container.querySelector(retry?'[data-quick-choice]':'#quick-feedback').focus({preventScroll:true});
 });
 render();return {get answered(){return practiceRecord(data,questions[index]).reviewing;},refresh:render};
}
