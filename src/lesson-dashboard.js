import {lessons,lessonById,framework,learningSource} from './lessons.js';
import {reviewItems} from './lesson-progress.js';
import {esc} from './node-detail.js';

const marks=[
 '<circle cx="34" cy="37" r="10"/><circle cx="16" cy="19" r="6"/><circle cx="53" cy="19" r="6"/><path d="m21 24 7 7m13 0 7-7"/>',
 '<ellipse cx="34" cy="33" rx="25" ry="21"/><ellipse cx="34" cy="33" rx="17" ry="14"/><circle cx="35" cy="32" r="6"/>',
 '<path d="M15 53C12 24 27 13 54 12c0 28-12 42-39 41Zm0 0 30-30m-17 17V27m0 13h14"/>',
 '<circle cx="13" cy="33" r="6"/><circle cx="34" cy="19" r="6"/><circle cx="55" cy="33" r="6"/><circle cx="34" cy="49" r="6"/><path d="m18 29 11-7m10 0 11 7m0 8-11 8m-10 0L18 37"/>',
 '<path d="m15 12 18 40M33 12 15 52m21-40 18 40m0-40L36 52"/><circle cx="24" cy="32" r="3"/><circle cx="45" cy="32" r="3"/>',
 '<path d="M20 9c34 15-6 31 28 46M48 9c-34 15 6 31-28 46M26 15h16M28 25h12M28 39h12M26 49h16"/>',
 '<path d="M34 56V39L17 26V12m17 27 17-13V12M17 26l13-12m21 12 12-12"/><circle cx="34" cy="39" r="3"/>',
 '<path d="M8 53h52M20 52V33m0 4C8 36 9 24 9 24c12 0 11 13 11 13Zm0 6c13 0 13-12 13-12-12 0-13 12-13 12Zm26 10V21m0 8C33 28 34 16 34 16c12 0 12 13 12 13Zm0 9c13 0 13-13 13-13-12 0-13 13-13 13Z"/>',
];
export function createLessonDashboard(api){
 const page=document.createElement('main');page.id='lesson-dashboard';page.hidden=true;page.setAttribute('aria-labelledby','dashboard-title');
 page.innerHTML=`<div class="dashboard-body">
  <header class="dashboard-heading"><div><p class="dashboard-eyebrow">AP Biology</p><h1 id="dashboard-title" tabindex="-1">Lessons</h1><p id="dashboard-progress"></p></div><label class="lesson-search"><span class="sr-only">Search all lessons</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input id="lesson-search" type="search" placeholder="Find a topic" autocomplete="off"></label></header>
  <div class="dashboard-continuation"><div id="lesson-resume"></div><div id="lesson-review-status"></div></div>
  <section id="dashboard-units" aria-labelledby="dashboard-units-title"><div class="dashboard-section-heading"><h2 id="dashboard-units-title">Your units</h2><span>01 — 08</span></div><nav id="lesson-units" aria-label="Course units"></nav></section>
  <section id="dashboard-topics" hidden aria-labelledby="lesson-unit-heading"><button id="dashboard-all-units">← All units</button><div class="lesson-unit-heading"><h2 id="lesson-unit-heading" tabindex="-1"></h2><span id="lesson-unit-count"></span></div><div id="lesson-list"></div></section>
  <footer class="dashboard-footer"><details class="learning-method"><summary>About these lessons</summary><p>Explanations lead into prediction, practice with feedback, and written recall. Review questions return after a delay. These choices follow <a href="${learningSource}" target="_blank" rel="noopener">IES learning guidance</a>; this app has not been tested for learning gains. Review intervals of 1, 3, 7, and 21 days are an authored schedule.</p><p>60 topic lessons follow the 2026–27 framework, alongside seven focused model studies. Completion records participation, not mastery. Written explanations use your self-check. These lessons do not replace required laboratory investigations.</p><p><a href="/data/lesson-coverage.csv" download>Topic coverage table ↓</a> · <a href="${framework.source}" target="_blank" rel="noopener">College Board framework ↗</a></p></details><small id="lesson-storage-note">Progress is stored on this device.</small></footer>
 </div>`;
 document.querySelector('#app').append(page);
 const $=s=>page.querySelector(s);let unit=null,query='';
 const course=lessons.filter(l=>l.topic);
 const complete=(p,l)=>p.lessons[l.id]?.finishedAt!=null;
 function render(){
  const progress=api.getProgress(),saved=lessonById(progress.lastLesson),done=course.filter(l=>complete(progress,l)).length;
  $('#lesson-storage-note').textContent=api.hasStorage()?'Progress is stored on this device.':'Storage is unavailable. Progress lasts for this session.';
  $('#dashboard-progress').textContent=done?`${done} of 60 topics completed · 8 units`:'8 units · 60 topics';
  $('#lesson-resume').innerHTML=saved?`<button data-resume="${saved.id}"><span class="resume-label">${complete(progress,saved)?'Revisit your last lesson':'Continue learning'}</span><strong>${esc(saved.title)}</strong><span class="resume-meta">${esc(saved.topic?`Topic ${saved.topic}`:saved.unit)} <span>→</span></span></button>`:'';
  const due=reviewItems(progress),all=reviewItems(progress,Date.now(),true),next=all.length?Math.min(...all.map(q=>progress.reviews[q.key].due)):null;
  $('#lesson-review-status').innerHTML=all.length?`<div class="review-banner"><span>${due.length?`${due.length} review questions ready`:`Next review · ${new Date(next).toLocaleDateString(undefined,{month:'short',day:'numeric'})}`}</span><button id="start-review">${due.length?'Start review':'Practice again'} →</button></div>`:'';
  $('.dashboard-continuation').hidden=!saved&&!all.length;
  $('#lesson-units').innerHTML=Object.entries(framework.units).map(([n,name])=>{
   const topics=course.filter(l=>l.unitNumber===Number(n)),completed=topics.filter(l=>complete(progress,l)).length;
   return `<button class="unit-card" data-course-unit="${n}" aria-label="Unit ${n}: ${esc(name)}, ${topics.length} topics${completed?`, ${completed} completed`:''}"><span class="unit-card-top"><span>Unit ${String(n).padStart(2,'0')}</span><svg viewBox="0 0 68 68" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${marks[Number(n)-1]}</svg></span><h3>${esc(name)}</h3><span class="unit-card-bottom"><span>${completed?`${completed} / ${topics.length} completed`:`${topics.length} topics`}</span><span>↗</span></span><span class="unit-progress" aria-hidden="true"><i style="width:${completed/topics.length*100}%"></i></span></button>`;
  }).join('');
  const searching=!!query.trim(),showTopics=!!unit||searching;
  $('#dashboard-units').hidden=showTopics;$('#dashboard-topics').hidden=!showTopics;
  const matches=l=>`${l.topic||''} ${l.title} ${l.objective} ${l.unit} ${framework.units[l.unitNumber]||''}`.toLowerCase().includes(query.trim().toLowerCase());
  const shown=course.filter(l=>searching?matches(l):l.unitNumber===unit),focused=lessons.filter(l=>!l.topic&&(searching?matches(l):Number(l.unit.match(/\d/)?.[0])===unit));
  const card=(l,focus=false)=>{const saved=progress.lessons[l.id],done=complete(progress,l);return `<button class="lesson-card ${focus?'focused-lesson':'topic-lesson'}" data-lesson="${l.id}"><span class="lesson-number">${esc(l.topic||'↳')}</span><span class="lesson-card-copy"><h3>${esc(l.title)}</h3><small>${l.minutes} min${done?' · completed':saved?' · in progress':''}</small></span><span class="lesson-card-action" aria-label="${done?'Revisit':saved?'Resume':'Begin'}">${done?'✓':'→'}</span></button>`;};
  $('#lesson-unit-heading').textContent=searching?'Search results':`Unit ${unit} · ${framework.units[unit]||''}`;
  $('#lesson-unit-count').textContent=searching?`${shown.length+focused.length} lessons`:`${shown.filter(l=>complete(progress,l)).length} / ${shown.length} topics completed`;
  $('#lesson-list').innerHTML=shown.map(l=>card(l)).join('')+(focused.length?`<details class="focused-lessons" ${searching?'open':''}><summary>Focused model studies · ${focused.length}</summary><div class="focused-list">${focused.map(l=>card(l,true)).join('')}</div></details>`:'')+(!shown.length&&!focused.length?'<p class="lesson-empty">No matching lessons. Try a topic number or a shorter phrase.</p>':'');
 }
 function navigate(next,{replace=false,focus=false}={}){
  unit=next.unit??null;query=next.query??'';$('#lesson-search').value=query;render();api.onRoute({unit,query},{replace});
  if(focus){page.scrollTop=0;$(unit?'#lesson-unit-heading':'#dashboard-title').focus({preventScroll:true});}
 }
 page.onclick=event=>{
  const unitButton=event.target.closest('[data-course-unit]');if(unitButton){navigate({unit:Number(unitButton.dataset.courseUnit)},{focus:true});return;}
  const lesson=event.target.closest('[data-lesson],[data-resume]');if(lesson){api.onStart(lesson.dataset.lesson||lesson.dataset.resume);return;}
  if(event.target.closest('#start-review'))api.onReview();
  if(event.target.closest('#dashboard-all-units'))navigate({},{focus:true});
 };
 $('#lesson-search').oninput=event=>navigate({unit,query:event.target.value},{replace:true});
 return {show(params={},focus=true){const n=Number(params.unit);unit=n>=1&&n<=8&&Number.isInteger(n)?n:null;query=String(params.query||'').slice(0,200);$('#lesson-search').value=query;page.hidden=false;render();page.scrollTop=0;if(focus)$(unit?'#lesson-unit-heading':'#dashboard-title').focus({preventScroll:true});},hide(){page.hidden=true;}};
}
