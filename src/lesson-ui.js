import {activities,activityMarkup,diagramSVG,loadExperiments,saveExperiments,experimentResult} from './lesson-activities.js';
import {lessons,lessonById,checkpoints,lessonKey,learningSource} from './lessons.js';
import {loadProgress,saveProgress,beginLesson,answerStep,isAnswered,finishLesson,reviewItems,recordReview} from './lesson-progress.js';
import {esc} from './node-detail.js';

export function createLessonUI(api){
 const $=s=>document.querySelector(s);let storage;try{storage=localStorage;}catch{}
 let labData=loadExperiments(storage),running=null,lastDiagram='';
 let progress=loadProgress(storage),active=null,stepIndex=0,reviewQueue=[],reviewIndex=0,reviewAnswers={},revealed=new Set(),lastCue='',persistent=!!storage;
 const player=$('#process-panel'),viewer=$('#viewer');
 $('#app').insertAdjacentHTML('beforeend',`
  <dialog id="lesson-dialog" aria-labelledby="lesson-catalog-title">
   <div class="dialog-toolbar"><h2 id="lesson-catalog-title">Learn with the models</h2><button id="lesson-catalog-close" class="icon-button" aria-label="Close lessons">×</button></div>
   <div class="lesson-catalog-body"><p class="lesson-catalog-intro">${lessons.length} guided lessons with animated models. Predict, run an experiment, and explain the result.</p><div id="lesson-review-status"></div><div id="lesson-list"></div>
    <details class="learning-method"><summary>How these lessons work</summary><p>Worked explanations lead into prediction, practice with feedback, and written recall. Review questions return after a delay. These choices follow <a href="${learningSource}" target="_blank" rel="noopener">IES learning guidance</a>; this app has not been tested for learning gains. Review intervals of 1, 3, 7, and 21 days are an authored schedule.</p><p>Completion records participation. Written explanations use your own self-check, not automated grading.</p></details><small id="lesson-storage-note"></small>
   </div>
  </dialog>
  <section id="lesson-panel" aria-labelledby="lesson-heading" hidden>
   <div class="lesson-topline"><button id="lesson-catalog-button"></button><span id="lesson-counter"></span><button id="lesson-exit" class="icon-button" aria-label="Exit lesson and explore this model">×</button></div>
   <div class="lesson-scroll"><div class="lesson-kind" id="lesson-kind"></div><h2 id="lesson-heading" tabindex="-1"></h2><div id="lesson-content"></div><div id="lesson-live" hidden><div id="lesson-cues"></div><p id="lesson-cue-text" aria-live="polite" aria-atomic="true"></p><output id="lesson-live-metrics"></output></div><div id="lesson-feedback" role="status" tabindex="-1" hidden></div></div>
   <div id="lesson-player-slot"></div>
  <div class="lesson-footer"><button id="lesson-back">← Back</button><div class="lesson-references"><select id="lesson-skill" aria-label="Open a related AP Biology skill"></select><a id="lesson-source" target="_blank" rel="noopener">Reference ↗</a></div><button id="lesson-next">Continue →</button></div>
  </section>`);
 const dialog=$('#lesson-dialog'),panel=$('#lesson-panel');
 const persist=()=>{persistent=saveProgress(progress,storage);};
 const lesson=()=>active==='review'?reviewQueue[reviewIndex]?.lesson:lessonById(active);
 const step=()=>active==='review'?reviewQueue[reviewIndex]?.step:lesson()?.steps[stepIndex];
 const key=()=>lesson()&&step()?lessonKey(lesson(),step()):'';
 const answer=()=>active==='review'?reviewAnswers[key()]:progress.lessons[active]?.answers[step()?.id];
 const canPlay=()=>active!=='review'&&['explain','observe','experiment'].includes(step()?.type)&&!!step()?.view.process;
 const changed=()=>api.onChange?.();
 const resize=new ResizeObserver(()=>{if(active)document.body.style.setProperty('--lesson-height',`${panel.offsetHeight+28}px`);});resize.observe(panel);
 const savePosition=()=>{if(active&&active!=='review'){progress=beginLesson(progress,active,stepIndex);persist();}};

 function openCatalog(){
  savePosition();const due=reviewItems(progress),all=reviewItems(progress,Date.now(),true),next=all.length?Math.min(...all.map(q=>progress.reviews[q.key].due)):null;
  $('#lesson-review-status').innerHTML=all.length?`<div class="review-banner"><span>${due.length?`${due.length} review${due.length===1?'':'s'} ready`:`Next review · ${new Date(next).toLocaleDateString(undefined,{month:'short',day:'numeric'})}`}</span><button id="start-review">${due.length?'Review now':'Practice again'} →</button></div>`:'';
  $('#lesson-list').innerHTML=lessons.map((l,i)=>{
   const saved=progress.lessons[l.id],label=saved?.finishedAt!==null&&saved?.finishedAt!==undefined?'Revisit':saved?'Resume':'Begin';
   return `<button class="lesson-card" data-lesson="${l.id}"><span class="lesson-number">${String(i+1).padStart(2,'0')}</span><div><small>${esc(l.unit)} · about ${l.minutes} min</small><h3>${esc(l.title)}</h3><p>${esc(l.objective)}</p></div><span class="lesson-card-action">${label} ↗</span></button>`;
  }).join('');
  $('#lesson-storage-note').textContent=persistent?'Progress is stored on this device. Reviews appear here when you return.':'Storage is unavailable. Progress will last for this session.';
  if(!dialog.open)dialog.showModal();
 }
 function start(id,{step:requested=null}={}){
  const l=lessonById(id);if(!l)return false;
  const saved=progress.lessons[id];
  active=id;stepIndex=Math.max(0,Math.min(l.steps.length-1,Number.isInteger(requested)?requested:saved?.finishedAt!==null&&saved?.finishedAt!==undefined?0:saved?.step||0));
  revealed=new Set();dialog.close();document.body.classList.add('lesson-mode');panel.hidden=false;$('#lesson-next').hidden=false;player.remove();$('#lesson-player-slot').append(player);
  api.closeOverlays();showStep();return true;
 }
 function startReview(){
  const due=reviewItems(progress);reviewQueue=due.length?due:reviewItems(progress,Date.now(),true);if(!reviewQueue.length)return;
  active='review';reviewIndex=0;reviewAnswers={};revealed=new Set();dialog.close();document.body.classList.add('lesson-mode');panel.hidden=false;$('#lesson-player-slot').append(player);api.closeOverlays();showStep();
 }
 function showStep(){
  const s=step();if(!s)return;running=null;savePosition();lastCue='';lastDiagram='';
  api.navigate({...s.view,process:active==='review'?null:s.view.process,autoplay:canPlay()});
  api.scene.setPaused(true);renderCard();changed();$('#lesson-heading').focus({preventScroll:true});$('.lesson-scroll').scrollTop=0;
 }
 function renderCard(){
  const l=lesson(),s=step(),a=answer();if(!s)return;
  panel.dataset.type=s.type;panel.dataset.play=String(canPlay());panel.dataset.stepKey=key();
  $('#lesson-catalog-button').textContent=active==='review'?'Review practice':l.title;
  $('#lesson-counter').textContent=active==='review'?`${reviewIndex+1} / ${reviewQueue.length}`:`${stepIndex+1} / ${l.steps.length}`;
  $('#lesson-kind').textContent=active==='review'?'Retrieve from memory':({explain:'Build the explanation',question:s.id==='predict'?'Make a prediction':'Apply the idea',observe:'Observe and explain',experiment:'Compare conditions',recall:'Retrieve from memory'}[s.type]);
  $('#lesson-heading').textContent=s.title;
  $('#lesson-source').href=l.source;
  $('#lesson-skill').innerHTML='<option value="">AP skills</option>'+l.nodes.map(id=>`<option value="${id}">${esc(api.nodeLabel(id))}</option>`).join('');
  $('#lesson-feedback').hidden=true;
  if(s.type==='question'){
   $('#lesson-content').innerHTML=`<p class="lesson-prompt">${esc(s.prompt)}</p><div class="lesson-choices" role="group" aria-label="Choose an explanation">${s.options.map((o,i)=>`<button data-answer="${o.id}" aria-pressed="${a?.choice===o.id}"><span>${String.fromCharCode(65+i)}</span>${esc(o.text)}</button>`).join('')}</div>`;
   if(a?.choice){const chosen=s.options.find(o=>o.id===a.choice);$('#lesson-feedback').hidden=false;$('#lesson-feedback').dataset.result=a.choice===s.correct?'correct':'retry';$('#lesson-feedback').innerHTML=`<b>${a.choice===s.correct?'That follows from the model.':'Reconsider the mechanism.'}</b><p>${esc(chosen.feedback)}</p>`;}
  }else if(s.type==='recall'){
   const shown=revealed.has(key())||!!a?.rating;
   $('#lesson-content').innerHTML=`<p class="lesson-prompt">${esc(s.prompt)}</p><label class="sr-only" for="lesson-response">Your explanation</label><textarea id="lesson-response" rows="3" maxlength="2000" placeholder="Write your explanation before revealing the comparison…">${esc(a?.text||'')}</textarea><button id="lesson-reveal" ${shown?'hidden':''} ${(a?.text?.trim().length||0)<12?'disabled':''}>Compare your explanation</button>${shown?`<div class="lesson-rubric"><b>Check for these ideas</b><ul>${s.rubric.map(p=>`<li>${esc(p)}</li>`).join('')}</ul><details><summary>One possible explanation</summary><p>${esc(s.sample)}</p></details><div class="self-check" role="group" aria-label="Assess your explanation"><button data-rating="again" aria-pressed="${a?.rating==='again'}">I need more practice</button><button data-rating="ready" aria-pressed="${a?.rating==='ready'}">I included both ideas</button></div></div>`:''}`;
  }else{
   $('#lesson-content').innerHTML=`<p>${esc(s.body)}</p>`;
  }
  $('#lesson-live').hidden=!canPlay();
  $('#lesson-live').innerHTML='';lastCue='';lastDiagram='';
  if(canPlay()){
   labData[l.id]??={condition:activities[l.id].options[0].id,prediction:'',runs:[]};
   $('#lesson-live').innerHTML=activityMarkup(l.id,labData[l.id]);
   if(s.type==='experiment'&&l.id==='selection')$('#diagram-pane').insertAdjacentHTML('afterbegin','<label class="lesson-condition">Relative survival<select id="lesson-environment"><option value="favor-a">Favor aa</option><option value="neutral">Equal fitness</option><option value="favor-A">Favor AA</option></select></label>');
   $('#lesson-cues').innerHTML=s.cues.map(c=>`<button data-lesson-at="${c.at}" aria-pressed="false">${esc(c.title)}</button>`).join('');
   $('#experiment-status').textContent='Choose Run experiment to apply this condition.';
   renderRuns();
  }
  $('#lesson-back').disabled=active==='review'?reviewIndex===0:stepIndex===0;
  $('#lesson-next').disabled=!isAnswered(s,a);
  $('#lesson-next').textContent=(active==='review'?reviewIndex===reviewQueue.length-1:stepIndex===l.steps.length-1)?'Finish →':'Continue →';
  if(canPlay())onFrame(api.snapshot());
 }
 function record(response){
  const l=lesson(),s=step(),id=key();
  if(s.type==='recall'&&(String(response.text||'').trim().length<12))response={...response,rating:null};
  if(active==='review'){
   const old=reviewAnswers[id],assessed=s.type==='question'||!!response.rating;
   reviewAnswers[id]={...old,...response};
   if(assessed&&!old?.recorded){progress=recordReview(progress,id,s.type==='question'?response.choice===s.correct:response.rating==='ready');reviewAnswers[id].recorded=true;persist();}
  }else{progress=answerStep(progress,l.id,s.id,response);persist();}
 }
 function next(){
  const s=step();if(!s||!isAnswered(s,answer()))return;
  if(active==='review'){
   if(reviewIndex<reviewQueue.length-1){reviewIndex++;showStep();}else finish();
  }else if(stepIndex<lesson().steps.length-1){stepIndex++;showStep();}else{
   const missing=lesson().steps.findIndex(s=>!isAnswered(s,progress.lessons[active]?.answers[s.id]));
   if(missing>=0){stepIndex=missing;showStep();return;}
   progress=finishLesson(progress,active);persist();finish();
  }
 }
 function back(){if(active==='review'){if(reviewIndex>0){reviewIndex--;showStep();}}else if(stepIndex>0){stepIndex--;showStep();}}
 function finish(){
  const l=lesson(),review=active==='review';api.scene.playProcess(false);panel.dataset.play='false';panel.dataset.type='complete';
  $('#lesson-heading').textContent=review?'Review complete':`${l.title} · complete`;
  $('#lesson-kind').textContent='Keep the idea available';$('#lesson-live').hidden=true;$('#lesson-feedback').hidden=true;
  const choices=checkpoints(l).filter(s=>s.type==='question'),correct=review?0:choices.filter(s=>progress.lessons[active].answers[s.id]?.firstCorrect).length;
  const recall=review?null:progress.lessons[active].answers[checkpoints(l).find(s=>s.type==='recall').id];
  const nextDue=review?null:Math.min(...checkpoints(l).map(s=>progress.reviews[lessonKey(l,s)].due));
  const reviewNotice=nextDue<=Date.now()?'Review prompts are ready in Learn.':`Next review: ${new Date(nextDue).toLocaleDateString(undefined,{month:'short',day:'numeric'})}.`;
  $('#lesson-content').innerHTML=`<p>${review?'Your scheduled reviews have been updated. Extra practice before a due date keeps the original date.':`You completed all three checkpoints. First attempts: ${correct} of ${choices.length} choice questions correct. For the written explanation, you ${recall?.rating==='ready'?'reported including both key ideas':'marked that you need more practice'}.`}</p><p class="lesson-completion-note">${review?'Return later to retrieve the ideas again.':`${reviewNotice} Completion records practice, not mastery.`}</p><div class="lesson-completion-actions"><button data-finish="catalog">Choose a lesson →</button><button data-finish="explore">Explore this model ↗</button></div>`;
  $('#lesson-counter').textContent='Finished';$('#lesson-back').disabled=true;$('#lesson-next').hidden=true;changed();$('#lesson-heading').focus({preventScroll:true});
 }
 function exit({update=true}={}){
  if(!active)return;running=null;savePosition();active=null;panel.hidden=true;document.body.classList.remove('lesson-mode');$('#lesson-next').hidden=false;viewer.append(player);api.onExit?.();if(update)changed();
 }
 function renderRuns(){
  const target=$('#experiment-history');if(!target||!lesson())return;
  const id=lesson().id,runs=labData[id]?.runs||[];
  target.innerHTML=runs.length?`<table class="experiment-results"><caption>Recent runs · same starting conditions</caption><thead><tr><th>Condition</th><th>Result</th></tr></thead><tbody>${runs.map(r=>`<tr><td>${esc(activities[id].options.find(o=>o.id===r.condition).label)}</td><td>${esc(r.result)}<details><summary>Your prediction</summary><p>${esc(r.prediction||'No prediction recorded.')}</p></details></td></tr>`).join('')}</tbody></table>`:'';
 }
 function selectActivity(name,focus=false){
  for(const button of panel.querySelectorAll('[data-activity-tab]')){
   const selected=button.dataset.activityTab===name;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
   $('#'+button.dataset.activityTab+'-pane').hidden=!selected;if(selected&&focus)button.focus();
  }
 }
 function runExperiment(){
  const id=lesson().id,saved=labData[id];
  saved.condition=$('#experiment-condition').value;saved.prediction=$('#experiment-prediction').value;
  running={id,condition:saved.condition,prediction:saved.prediction};saveExperiments(storage,labData);
  if(id==='selection')api.scene.setEnvironment(saved.condition);
  api.scene.setExperiment({condition:saved.condition});
  $('#experiment-status').textContent='Running…';
  if(api.scene.reducedMotion)api.scene.seekProcess(1);else api.scene.playProcess(true);
 }
 function onFrame(snapshot){
  if(!active||!canPlay()||!snapshot||snapshot.id!==step().view.process||panel.dataset.stepKey!==key()||panel.dataset.type==='complete'||!$('#lesson-cues'))return;
  const cues=step().cues,index=Math.max(0,cues.findLastIndex(c=>snapshot.t>=c.at)),cue=cues[index];
  const caption=snapshot.id==='translation'||snapshot.condition&&snapshot.condition!=='normal'?snapshot.caption:cue.text;
  const cueKey=`${key()}:${index}:${caption}`;
  if(lastCue!==cueKey){lastCue=cueKey;$('#lesson-cue-text').textContent=caption;for(const [i,b]of [...$('#lesson-cues').children].entries())b.setAttribute('aria-pressed',String(i===index));}
  const drawing=`${key()}:${Math.floor(snapshot.t*40)}:${snapshot.condition||''}`;
  if(lastDiagram!==drawing){lastDiagram=drawing;$('#lesson-diagram').innerHTML=diagramSVG(lesson().id,snapshot);}
  const metrics=snapshot.metrics.map(([label,value])=>`${label}: ${value}`).join('  ·  ');
  if($('#lesson-live-metrics').textContent!==metrics)$('#lesson-live-metrics').textContent=metrics;
  if(running&&snapshot.t>=1){
   const result=experimentResult(running.id,snapshot);
   labData[running.id].runs.push({...running,result});labData[running.id].runs=labData[running.id].runs.slice(-3);
   saveExperiments(storage,labData);running=null;$('#experiment-status').textContent=`Run complete. ${result}`;renderRuns();
  }
 }
 panel.addEventListener('keydown',event=>{
  const tab=event.target.closest('[data-activity-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();const names=['diagram','experiment','check'],i=names.indexOf(tab.dataset.activityTab);
  selectActivity(names[event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3],true);
 });
 panel.addEventListener('click',event=>{
  const tab=event.target.closest('[data-activity-tab]');if(tab){selectActivity(tab.dataset.activityTab);return;}
  const quick=event.target.closest('[data-quick-choice]');if(quick){const c=activities[lesson().id].check;for(const b of panel.querySelectorAll('[data-quick-choice]'))b.setAttribute('aria-pressed',String(b===quick));$('#quick-feedback').hidden=false;$('#quick-feedback').textContent=(Number(quick.dataset.quickChoice)===c.correct?'Yes. ':'Reconsider. ')+c.feedback;return;}
  if(event.target.id==='experiment-run'){runExperiment();return;}
  if(event.target.id==='experiment-reset'){running=null;api.scene.playProcess(false);api.scene.seekProcess(0);$('#experiment-status').textContent='Reset to the same starting conditions.';return;}

  const option=event.target.closest('[data-answer]');if(option){record({choice:option.dataset.answer});renderCard();$('#lesson-feedback').focus({preventScroll:true});return;}
  const rating=event.target.closest('[data-rating]');if(rating){record({text:$('#lesson-response').value,rating:rating.dataset.rating});renderCard();return;}
  if(event.target.id==='lesson-reveal'){if($('#lesson-response').value.trim().length<12)return;revealed.add(key());renderCard();return;}
  const cue=event.target.closest('[data-lesson-at]');if(cue){running=null;api.scene.playProcess(false);api.scene.seekProcess(Number(cue.dataset.lessonAt));return;}
  const finishAction=event.target.closest('[data-finish]');if(finishAction){const catalog=finishAction.dataset.finish==='catalog';exit();if(catalog)openCatalog();}
 });
 panel.addEventListener('input',event=>{if(event.target.id==='experiment-prediction'){labData[lesson().id].prediction=event.target.value;saveExperiments(storage,labData);return;}if(event.target.id==='lesson-response'){record({text:event.target.value,rating:null});$('#lesson-reveal').disabled=event.target.value.trim().length<12;$('#lesson-next').disabled=true;for(const button of panel.querySelectorAll('[data-rating]'))button.setAttribute('aria-pressed','false');}});
 panel.addEventListener('change',event=>{if(event.target.id==='experiment-condition'){running=null;api.scene.playProcess(false);labData[lesson().id].condition=event.target.value;saveExperiments(storage,labData);$('#experiment-status').textContent='Choose Run experiment to apply this condition.';return;}if(event.target.id==='lesson-environment'){running=null;api.scene.setEnvironment(event.target.value);$('#selection-environment').value=event.target.value;api.scene.playProcess(api.canAutoplay());}if(event.target.id==='lesson-skill'&&event.target.value){api.openNode(event.target.value);event.target.value='';}});
 $('#lesson-list').onclick=event=>{const card=event.target.closest('[data-lesson]');if(card){$('#lesson-next').hidden=false;start(card.dataset.lesson);}};
 $('#lesson-review-status').onclick=event=>{if(event.target.closest('#start-review')){$('#lesson-next').hidden=false;startReview();}};
 $('#lesson-catalog-close').onclick=()=>dialog.close();$('#lesson-catalog-button').onclick=openCatalog;$('#lesson-exit').onclick=()=>exit();$('#lesson-next').onclick=next;$('#lesson-back').onclick=back;
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 return {openCatalog,start,exit,onFrame,next,back,canPlay,get active(){return active;},get stepIndex(){return stepIndex;},has:id=>!!lessonById(id)};
}
