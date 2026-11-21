import {showLessonDiagram} from './ui-helpers.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {courseLessons} from '../src/course/lessons.js';
import {labs,sampleLab} from '../src/course/labs.js';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/',errors=[],checks=[];
const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const check=s=>{checks.push(s);console.log('PASS',s);};
const frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const go=async(p,id)=>{await p.goto(`${base}#lesson=${id}&step=0`);await p.locator('#lesson-panel').waitFor();await p.waitForFunction(id=>document.querySelector('#lesson-panel')?.dataset.stepKey===`${id}/explain`,id);await frame(p);};
await mkdir('test-results/course',{recursive:true});
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});observe(p);
 const counts=[];await p.goto(base);await p.locator('#home-lessons').click();
 for(let u=1;u<=8;u++){await p.locator(`[data-course-unit="${u}"]`).click();const n=await p.locator('.topic-lesson').count();counts.push(n);assert.ok(n>0);await p.locator('#dashboard-all-units').click();}
 assert.deepEqual(counts,[7,10,5,6,5,8,12,7]);
 await p.locator('#lesson-search').fill('meiosis');assert.equal(await p.locator('.topic-lesson').count(),2);await p.screenshot({path:'test-results/course/search.png'});
 await p.locator('#lesson-search').fill('');await p.locator('[data-course-unit="4"]').click();await p.screenshot({path:'test-results/course/catalog.png'});await p.locator('#dashboard-explore').click();
 check('All 60 topics are discoverable by unit and cross-unit search');
 for(const l of courseLessons){
  await go(p,l.id);assert.equal(await p.locator('#scene').getAttribute('data-model'),'lesson-lab');
  assert.equal(await p.locator('#scene canvas').count(),1);assert.equal(await p.locator('.webgl-fallback').count(),0);
  const before=await p.locator('#scene canvas').screenshot();
  await showLessonDiagram(p);await p.locator('[data-lesson-at]').nth(2).click();assert.ok(Number(await p.locator('#process-range').inputValue())>.6);
  assert.equal(await p.locator('.lesson-diagram').count(),1);
  if(['1.1','2.2','3.4','4.5','5.1','6.3','7.9','8.4'].includes(l.topic))await p.screenshot({path:`test-results/course/topic-${l.topic}.png`});
  await p.locator('#experiment-tab').click();await p.locator('#experiment-prediction').fill(`My prediction for ${l.topic}: changing this condition will test the mechanism.`);
  let renderedChange=!before.equals(await p.locator('#scene canvas').screenshot());
  const config=labs[l.labKind];
  for(const option of [config.options[0],config.options[1]]){
   await p.locator('#experiment-condition').selectOption(option.id);await p.locator('#experiment-run').click();
   await p.waitForFunction(()=>document.querySelector('#experiment-status').textContent.startsWith('Run complete'));
   renderedChange ||= !before.equals(await p.locator('#scene canvas').screenshot());
   const s=sampleLab(l.labKind,1,option.id);assert.ok((await p.locator('#experiment-status').textContent()).includes(s.metrics[0][1]),l.topic);
  }
  assert.ok(renderedChange,`${l.topic}: model should visibly respond to its process or condition`);
  assert.equal(await p.locator('.experiment-results tbody tr').count(),2);
  if(errors.length)throw new Error(`${l.topic}: ${errors.join('; ')}`);
  check(`${l.topic}: 3D model, diagram, and both experiment conditions`);
 }
 await p.reload();await p.locator('#experiment-tab').click();assert.equal(await p.locator('.experiment-results tbody tr').count(),2);assert.match(await p.locator('#experiment-prediction').inputValue(),/8.7/);
 await p.locator('#lesson-exit').click();assert.notEqual(await p.locator('#scene').getAttribute('data-model'),'lesson-lab');assert.equal(await p.locator('.scale-dock').isVisible(),true);
 await go(p,'topic-5-3');await p.locator('#lesson-next').click();assert.equal(await p.locator('#lesson-live').isHidden(),true);assert.equal(await p.locator('#lesson-next').isDisabled(),true);
 await p.locator('[data-answer="alternative-1"]').click();await p.locator('[data-answer="correct"]').click();await p.reload();assert.match(await p.locator('#lesson-feedback').textContent(),/Each parent/);
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('biology-zoomout-lessons-v1')).lessons['topic-5-3'].answers.predict.firstCorrect),false);
 await p.close();check('Course experiments and answers persist, assessment feedback is gated, and exit restores the zoom pathway');
 const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});observe(m);
 for(const id of ['topic-4-3','topic-6-2','topic-8-5']){
  await go(m,id);await showLessonDiagram(m);await m.locator('[data-lesson-at]').nth(2).click();
  assert.equal(await m.evaluate(()=>{const c=document.querySelector('#scene canvas').getBoundingClientRect(),p=document.querySelector('#lesson-panel').getBoundingClientRect();return c.height>130&&c.bottom<=p.top&&document.documentElement.scrollWidth<=innerWidth;}),true);
  await m.screenshot({path:`test-results/course/phone-${id}.png`});
 }
 await m.locator('#lesson-catalog-button').click();await m.locator('[data-course-unit="8"]').click();await m.screenshot({path:'test-results/course/phone-catalog.png'});await m.close();
 check('Phone topic models and catalog fit without covering the 3D canvas');
 const a=await browser.newPage({viewport:{width:1100,height:900},reducedMotion:'no-preference'});observe(a);await go(a,'topic-4-5');await a.waitForFunction(()=>Number(document.querySelector('#process-range').value)>.03);await a.locator('#process-play').click();const time=await a.locator('#process-range').inputValue();await a.waitForTimeout(200);assert.equal(await a.locator('#process-range').inputValue(),time);await a.close();
 assert.deepEqual(errors,[]);check('Course autoplay and pause work without application or shader errors');
 await writeFile('test-results/course/report.json',JSON.stringify({checks,errors,topics:60},null,2));
}finally{await browser.close();}
