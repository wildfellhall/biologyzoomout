import {createLessonQuestions} from './lesson-practice/question-ui.js';
import {createVisualPractice} from './lesson-practice/visual-ui.js';
import {visualActivities} from './lesson-practice/visual-data.js';
import {activities,activityMarkup,diagramSVG,loadExperiments,saveExperiments,experimentResult} from './lesson-activities.js';
import {lessonById,checkpoints,lessonKey} from './lessons.js';
import {loadProgress,saveProgress,beginLesson,answerStep,isAnswered,finishLesson,reviewItems,recordReview} from './lesson-progress.js';
import {esc} from './node-detail.js';

export function createLessonUI(api){
 const $=s=>document.querySelector(s);let storage;try{storage=localStorage;}catch{}
 let visualUI=null,puzzleScene=null;
 let labData=loadExperiments(storage),running=null,lastDiagram='';
 let progress=loadProgress(storage),active=null,stepIndex=0,reviewQueue=[],reviewIndex=0,reviewAnswers={},revealed=new Set(),lastCue='',persistent=!!storage;
 const player=$('#process-panel'),viewer=$('#viewer');
 $('#app').insertAdjacentHTML('beforeend',`
  <section id="lesson-panel" aria-labelledby="lesson-heading" hidden>
   <div class="lesson-topline"><button id="lesson-catalog-button">← Lessons</button><span id="lesson-topic"></span><span id="lesson-counter"></span><button id="lesson-exit" aria-label="Exit lesson and explore this model">Explore ↗</button></div>
   <div class="lesson-scroll"><div class="lesson-kind" id="lesson-kind"></div><h2 id="lesson-heading" tabindex="-1"></h2><div id="lesson-tabs" hidden></div><div id="lesson-content"></div><div id="lesson-live" hidden><div id="lesson-cues"></div><p id="lesson-cue-text" aria-live="polite" aria-atomic="true"></p><output id="lesson-live-metrics"></output></div><div id="lesson-feedback" role="status" tabindex="-1" hidden></div><details class="lesson-references"><summary>Sources & AP skills</summary><div><select id="lesson-skill" aria-label="Open a related AP Biology skill"></select><a id="lesson-source" target="_blank" rel="noopener">Reference ↗</a></div></details></div>
   <div id="lesson-player-slot"><nav id="lesson-stage-nav" aria-label="Cell division stages" hidden><button id="lesson-stage-back" aria-label="Previous animation stage">←</button><select id="lesson-stage-select" aria-label="Animation stage"></select><button id="lesson-stage-next" aria-label="Next animation stage">→</button></nav></div>
  <div class="lesson-footer"><button id="lesson-back">← Back</button><button id="lesson-next">Continue →</button></div>
  </section>`);
 const panel=$('#lesson-panel');
 const persist=()=>{persistent=saveProgress(progress,storage);};
 const lesson=()=>active==='review'?reviewQueue[reviewIndex]?.lesson:lessonById(active);
 const step=()=>active==='review'?reviewQueue[reviewIndex]?.step:lesson()?.steps[stepIndex];
 const key=()=>lesson()&&step()?lessonKey(lesson(),step()):'';
 const answer=()=>active==='review'?reviewAnswers[key()]:progress.lessons[active]?.answers[step()?.id];
 const canPlay=()=>!puzzleScene&&active!=='review'&&['explain','observe','experiment'].includes(step()?.type)&&!!step()?.view.process;
 const changed=()=>api.onChange?.();
 const savePosition=()=>{if(active&&active!=='review'){progress=beginLesson(progress,active,stepIndex);persist();}};

 function openCatalog(){savePosition();api.openDashboard();}
 function start(id,{step:requested=null}={}){
  const l=lessonById(id);if(!l)return false;
  const saved=progress.lessons[id];
  active=id;stepIndex=Math.max(0,Math.min(l.steps.length-1,Number.isInteger(requested)?requested:saved?.finishedAt!==null&&saved?.finishedAt!==undefined?0:saved?.step||0));
  revealed=new Set();document.body.classList.add('lesson-mode');panel.hidden=false;$('#lesson-next').hidden=false;player.remove();$('#lesson-player-slot').append(player);
  api.closeOverlays();showStep();return true;
 }
 function startReview(){
  const due=reviewItems(progress);reviewQueue=due.length?due:reviewItems(progress,Date.now(),true);if(!reviewQueue.length)return false;
  active='review';reviewIndex=0;reviewAnswers={};revealed=new Set();document.body.classList.add('lesson-mode');panel.hidden=false;$('#lesson-next').hidden=false;$('#lesson-player-slot').append(player);api.closeOverlays();showStep();return true;
 }
 function showStep(){
  visualUI?.destroy();visualUI=null;
  const s=step();if(!s)return;running=null;savePosition();lastCue='';lastDiagram='';
  api.navigate({...s.view,process:active==='review'?null:s.view.process,autoplay:canPlay()});
  api.scene.setPaused(true);renderCard();changed();$('#lesson-heading').focus({preventScroll:true});$('.lesson-scroll').scrollTop=0;
 }
 function renderCard(){
  const l=lesson(),s=step(),a=answer();if(!s)return;
  panel.dataset.type=s.type;panel.dataset.play=String(canPlay());panel.dataset.stepKey=key();
  $('#lesson-topic').textContent=active==='review'?'Review':l.topic?`Topic ${l.topic}`:l.unit;
  $('#lesson-counter').textContent=active==='review'?`${reviewIndex+1} / ${reviewQueue.length}`:`${stepIndex+1} / ${l.steps.length}`;
  $('#lesson-kind').textContent=active==='review'?'Retrieve from memory':({explain:'Build the explanation',question:s.id==='predict'?'Make a prediction':'Apply the idea',observe:'Observe and explain',experiment:'Compare conditions',recall:'Retrieve from memory'}[s.type]);
  $('#lesson-heading').textContent=s.title;
  $('#lesson-source').href=l.source;
  $('#lesson-skill').innerHTML='<option value="">AP skills</option>'+l.nodes.map(id=>`<option value="${id}">${esc(api.nodeLabel(id))}</option>`).join('');
  $('#lesson-feedback').hidden=true;
  if(s.type==='question'){
   $('#lesson-content').innerHTML=`<p class="lesson-prompt">${esc(s.prompt)}</p><div class="lesson-choices" role="group" aria-label="Choose an explanation">${s.options.map((o,i)=>`<button data-answer="${o.id}" aria-pressed="${a?.choice===o.id}"><span>${String.fromCharCode(65+i)}</span>${esc(o.text)}</button>`).join('')}</div>`;
   if(a?.choice){const chosen=s.options.find(o=>o.id===a.choice);$('#lesson-feedback').hidden=false;$('#lesson-feedback').dataset.result=a.choice===s.correct?'correct':'retry';$('#lesson-feedback').innerHTML=`<b>${a.choice===s.correct?'Correct.':'Review the concept.'}</b><p>${esc(chosen.feedback)}</p>`;}
  }else if(s.type==='recall'){
   const shown=revealed.has(key())||!!a?.rating;
   $('#lesson-content').innerHTML=`<p class="lesson-prompt">${esc(s.prompt)}</p><label class="sr-only" for="lesson-response">Your explanation</label><textarea id="lesson-response" rows="3" maxlength="2000" placeholder="Write your explanation before revealing the comparison…">${esc(a?.text||'')}</textarea><button id="lesson-reveal" ${shown?'hidden':''} ${(a?.text?.trim().length||0)<12?'disabled':''}>Compare your explanation</button>${shown?`<div class="lesson-rubric"><b>Check for these ideas</b><ul>${s.rubric.map(p=>`<li>${esc(p)}</li>`).join('')}</ul><details><summary>One possible explanation</summary><p>${esc(s.sample)}</p></details><div class="self-check" role="group" aria-label="Assess your explanation"><button data-rating="again" aria-pressed="${a?.rating==='again'}">I need more practice</button><button data-rating="ready" aria-pressed="${a?.rating==='ready'}">I included both ideas</button></div></div>`:''}`;
  }else{
   $('#lesson-content').innerHTML=`<p>${esc(s.body)}</p>${canPlay()?'<div class="lesson-practice-links"><button data-open-visual>Label & build →</button><button data-open-practice>Practice questions →</button></div>':''}`;
  }
  $('#lesson-tabs').hidden=!canPlay();$('#lesson-tabs').innerHTML='';
  $('#lesson-content').hidden=false;$('#lesson-content').removeAttribute('role');$('#lesson-content').removeAttribute('aria-labelledby');
  panel.querySelector('.lesson-references').open=false;
  $('#lesson-live').hidden=!canPlay();
  $('#lesson-live').innerHTML='';lastCue='';lastDiagram='';
  const stages=activities[l.id]?.stages;
  $('#lesson-stage-nav').hidden=!canPlay()||!stages;
  $('#lesson-stage-select').innerHTML=stages?stages.map((stage,i)=>`<option value="${i}">${esc(stage.title)}</option>`).join(''):'';
  if(canPlay()){
   labData[l.id]??={condition:activities[l.id].options[0].id,prediction:'',runs:[]};
   $('#lesson-live').innerHTML=activityMarkup(l.id,labData[l.id]);
   createLessonQuestions($('#check-pane'),l.id,storage);
   visualUI=createVisualPractice({container:$('#visual-practice'),activity:visualActivities[l.id],storage,has3D:!!api.scene.renderer,onScene:showPuzzle,onRestore:restorePuzzle});
   $('#lesson-tabs').append($('#lesson-live .activity-tabs'));
   $('#experiment-pane .experiment-question').hidden=s.title===activities[l.id].prompt;
   $('#lesson-content').setAttribute('role','tabpanel');$('#lesson-content').setAttribute('aria-labelledby','read-tab');
   if(s.type==='experiment'&&l.id==='selection')$('#diagram-pane').insertAdjacentHTML('afterbegin','<label class="lesson-condition">Relative survival<select id="lesson-environment"><option value="favor-a">Favor aa</option><option value="neutral">Equal fitness</option><option value="favor-A">Favor AA</option></select></label>');
   $('#lesson-cues').innerHTML=s.cues.map(c=>`<button data-lesson-at="${c.at}" aria-pressed="false">${esc(c.title)}</button>`).join('');
   $('#experiment-status').textContent='Choose Run experiment to apply this condition.';
   renderRuns();selectActivity(s.type==='experiment'?'experiment':s.type==='observe'?'diagram':'read');
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
  $('#lesson-kind').textContent='Keep the idea available';$('#lesson-live').hidden=true;$('#lesson-tabs').hidden=true;$('#lesson-content').hidden=false;$('#lesson-feedback').hidden=true;
  $('#lesson-stage-nav').hidden=true;
  const choices=checkpoints(l).filter(s=>s.type==='question'),correct=review?0:choices.filter(s=>progress.lessons[active].answers[s.id]?.firstCorrect).length;
  const recall=review?null:progress.lessons[active].answers[checkpoints(l).find(s=>s.type==='recall').id];
  const nextDue=review?null:Math.min(...checkpoints(l).map(s=>progress.reviews[lessonKey(l,s)].due));
  const reviewNotice=nextDue<=Date.now()?'Review questions are ready on your lesson dashboard.':`Next review: ${new Date(nextDue).toLocaleDateString(undefined,{month:'short',day:'numeric'})}.`;
  $('#lesson-content').innerHTML=`<p>${review?'Your scheduled reviews have been updated. Extra practice before a due date keeps the original date.':`You completed all three checkpoints. First attempts: ${correct} of ${choices.length} choice questions correct. For the written explanation, you ${recall?.rating==='ready'?'reported including both key ideas':'marked that you need more practice'}.`}</p><p class="lesson-completion-note">${review?'Return later to retrieve the ideas again.':`${reviewNotice} Completion records practice, not mastery.`}</p><div class="lesson-completion-actions"><button data-finish="catalog">Choose a lesson →</button><button data-finish="explore">Explore this model ↗</button></div>`;
  $('#lesson-counter').textContent='Finished';$('#lesson-back').disabled=true;$('#lesson-next').hidden=true;changed();$('#lesson-heading').focus({preventScroll:true});
 }
 function exit({update=true}={}){
  if(!active)return;visualUI?.destroy();visualUI=null;running=null;savePosition();active=null;panel.hidden=true;document.body.classList.remove('lesson-mode');$('#lesson-next').hidden=false;viewer.append(player);api.onExit?.();if(update)changed();
 }
 function renderRuns(){
  const target=$('#experiment-history');if(!target||!lesson())return;
  const id=lesson().id,runs=labData[id]?.runs||[];
  target.innerHTML=runs.length?`<table class="experiment-results"><caption>Recent runs · same starting conditions</caption><thead><tr><th>Condition</th><th>Result</th></tr></thead><tbody>${runs.map(r=>`<tr><td>${esc(activities[id].options.find(o=>o.id===r.condition).label)}</td><td>${esc(r.result)}<details><summary>Your prediction</summary><p>${esc(r.prediction||'No prediction recorded.')}</p></details></td></tr>`).join('')}</tbody></table>`:'';
 }
 function selectActivity(name,focus=false){
  visualUI?.setVisible(name==='diagram');
  $('#lesson-live').hidden=name==='read';panel.dataset.activity=name;
  for(const button of panel.querySelectorAll('[data-activity-tab]')){
   const selected=button.dataset.activityTab===name;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
   $('#'+button.getAttribute('aria-controls')).hidden=!selected;if(selected&&focus)button.focus();
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
  const caption=(snapshot.id==='translation'||snapshot.id.startsWith('topic-'))||snapshot.condition&&snapshot.condition!=='normal'?snapshot.caption:cue.text;
  const cueKey=`${key()}:${index}:${caption}`;
  if(lastCue!==cueKey){lastCue=cueKey;$('#lesson-cue-text').textContent=caption;for(const [i,b]of [...$('#lesson-cues').children].entries())b.setAttribute('aria-pressed',String(i===index));}
  const drawing=`${key()}:${Math.floor(snapshot.t*40)}:${snapshot.condition||''}`;
  if(lastDiagram!==drawing){lastDiagram=drawing;$('#lesson-diagram').innerHTML=diagramSVG(lesson().id,snapshot);}
  const metrics=snapshot.metrics.map(([label,value])=>`${label}: ${value}`).join('  ·  ');
  if($('#lesson-live-metrics').textContent!==metrics)$('#lesson-live-metrics').textContent=metrics;
  const stages=activities[lesson().id]?.stages;
  if(stages){$('#lesson-stage-select').value=String(snapshot.phase);$('#lesson-stage-back').disabled=snapshot.phase===0;$('#lesson-stage-next').disabled=snapshot.arrested||snapshot.phase===stages.length-1;}
  if(running&&snapshot.t>=1){
   const result=experimentResult(running.id,snapshot);
   labData[running.id].runs.push({...running,result});labData[running.id].runs=labData[running.id].runs.slice(-3);
   saveExperiments(storage,labData);running=null;$('#experiment-status').textContent=`Run complete. ${result}`;renderRuns();
  }
 }
 function showPuzzle(activity,placements,selected,correct){
  const scene=api.scene;
  if(!puzzleScene){
   running=null;
   puzzleScene={focus:scene.focusDefinition,process:scene.process,at:scene.processProgress,playing:scene.processPlaying,options:{...scene.experimentOptions},environment:scene.environment,labels:scene.labelsVisible,camera:scene.camera?.position.clone(),target:scene.controls?.target.clone()};
   scene.focus({id:'lesson-puzzle',data:{id:`${activity.id}@${activity.version}`,activity}});scene.setPaused(true);scene.setLabels(true);
  }
  panel.dataset.visualWorkspace='true';
  scene.renderer?.domElement.setAttribute('aria-label','3D assembly workspace. Select a piece, then a numbered position. The Visual lab also provides keyboard controls.');
  scene.activeView?.processRig?.place?.(placements,selected,correct);
 }
 function restorePuzzle(){
  if(!puzzleScene)return;
  const saved=puzzleScene,scene=api.scene;puzzleScene=null;delete panel.dataset.visualWorkspace;
  scene.renderer?.domElement.setAttribute('aria-label','3D biology model. Drag to rotate; scroll or pinch to change scale.');
  scene.focus(saved.focus);scene.environment=saved.environment;scene.setProcess(saved.process);scene.experimentOptions={...saved.options};scene.seekProcess(saved.at);scene.playProcess(saved.playing);scene.setLabels(saved.labels);scene.setPaused(true);
  if(saved.camera)scene.camera.position.copy(saved.camera);if(saved.target)scene.controls.target.copy(saved.target);
 }
 panel.addEventListener('keydown',event=>{
  const tab=event.target.closest('[data-activity-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();event.stopPropagation();const names=['read','diagram','experiment','check'],i=names.indexOf(tab.dataset.activityTab);
  selectActivity(names[event.key==='Home'?0:event.key==='End'?3:(i+(event.key==='ArrowRight'?1:3))%4],true);
 });
 function selectStage(index){const stages=activities[lesson()?.id]?.stages;if(!stages?.[index])return;running=null;api.scene.playProcess(false);api.scene.seekProcess(stages[index].at);}
 $('#lesson-stage-select').onchange=event=>selectStage(Number(event.target.value));
 $('#lesson-stage-back').onclick=()=>selectStage(Number($('#lesson-stage-select').value)-1);
 $('#lesson-stage-next').onclick=()=>selectStage(Number($('#lesson-stage-select').value)+1);
 panel.addEventListener('click',event=>{
  if(event.target.closest('[data-open-visual]')){selectActivity('diagram');panel.querySelector('[data-visual-mode=label]').click();return;}
  if(event.target.closest('[data-open-practice]')){selectActivity('check',true);return;}
  const tab=event.target.closest('[data-activity-tab]');if(tab){selectActivity(tab.dataset.activityTab);return;}
  if(event.target.id==='experiment-run'){runExperiment();return;}
  if(event.target.id==='experiment-reset'){running=null;api.scene.playProcess(false);api.scene.seekProcess(0);$('#experiment-status').textContent='Reset to the same starting conditions.';return;}

  const option=event.target.closest('[data-answer]');if(option){record({choice:option.dataset.answer});renderCard();$('#lesson-feedback').focus({preventScroll:true});return;}
  const rating=event.target.closest('[data-rating]');if(rating){record({text:$('#lesson-response').value,rating:rating.dataset.rating});renderCard();return;}
  if(event.target.id==='lesson-reveal'){if($('#lesson-response').value.trim().length<12)return;revealed.add(key());renderCard();return;}
  const cue=event.target.closest('[data-lesson-at]');if(cue){running=null;api.scene.playProcess(false);api.scene.seekProcess(Number(cue.dataset.lessonAt));return;}
  const finishAction=event.target.closest('[data-finish]');if(finishAction){const catalog=finishAction.dataset.finish==='catalog';if(catalog)openCatalog();else exit();}
 });
 panel.addEventListener('input',event=>{if(event.target.id==='experiment-prediction'){labData[lesson().id].prediction=event.target.value;saveExperiments(storage,labData);return;}if(event.target.id==='lesson-response'){record({text:event.target.value,rating:null});$('#lesson-reveal').disabled=event.target.value.trim().length<12;$('#lesson-next').disabled=true;for(const button of panel.querySelectorAll('[data-rating]'))button.setAttribute('aria-pressed','false');}});
 panel.addEventListener('change',event=>{if(event.target.id==='experiment-condition'){running=null;api.scene.playProcess(false);labData[lesson().id].condition=event.target.value;saveExperiments(storage,labData);$('#experiment-status').textContent='Choose Run experiment to apply this condition.';return;}if(event.target.id==='lesson-environment'){running=null;api.scene.setEnvironment(event.target.value);$('#selection-environment').value=event.target.value;api.scene.playProcess(api.canAutoplay());}if(event.target.id==='lesson-skill'&&event.target.value){api.openNode(event.target.value);event.target.value='';}});
 $('#lesson-catalog-button').onclick=openCatalog;$('#lesson-exit').onclick=()=>exit();$('#lesson-next').onclick=next;$('#lesson-back').onclick=back;
 return {handleVisualPick:selection=>visualUI?.pick(selection)||false,openCatalog,start,startReview,exit,onFrame,next,back,canPlay,get persistent(){return persistent;},get progress(){return progress;},get active(){return active;},get stepIndex(){return stepIndex;},has:id=>!!lessonById(id)};
}
