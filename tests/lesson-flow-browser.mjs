import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {showLessonPart,waitForOffline} from './ui-helpers.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[];const check=s=>{checks.push(s);console.log('PASS',s);};
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const parts=['overview','predict','observe','experiment','example','label','build','practice-1','practice-2','transfer','recall'];
const current=p=>p.locator('#lesson-panel').getAttribute('data-part');
async function fillVisual(p){for(let i=0;i<4;i++){await p.locator(`[data-visual-piece=p${i}]`).click();await p.locator(`button[data-visual-slot=s${i}]`).click();}}
await mkdir('test-results/lesson-flow',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await context.newPage();watch(p);
 for(const id of ['replication','topic-7-9']){
  await p.goto(`${base}#lesson=${id}`);await p.locator('#lesson-panel').waitFor();
  for(const [i,part] of parts.entries()){
   assert.equal(await current(p),part);assert.equal(await p.locator('#lesson-counter').textContent(),`${i+1} / 11`);
   assert.equal(await p.locator('#lesson-panel [role=tablist],#lesson-panel [data-visual-mode],#lesson-panel [data-question-nav]').count(),0);
   assert.equal(await p.locator('#lesson-back').isDisabled(),i===0);
   if(['predict','transfer'].includes(part)){
    assert.equal(await p.locator('#lesson-next').isDisabled(),true);await p.keyboard.press('ArrowRight');assert.equal(await current(p),part);
    await p.locator('[data-answer]').first().click();assert.equal(await p.locator('#lesson-feedback').isVisible(),true);
   }
   if(part==='observe'){assert.equal(await p.locator('.lesson-diagram').count(),1);await p.locator('#lesson-stages summary').click();await p.locator('[data-lesson-at]').nth(1).click();}
   if(part==='experiment'){await p.locator('#experiment-prediction').fill('Changing this condition should change the modeled outcome because the components interact.');await p.locator('#experiment-run').click();assert.match(await p.locator('#experiment-status').textContent(),/Run complete/);}
   if(['label','build'].includes(part)){
    assert.equal(await p.locator('#lesson-next').isDisabled(),true);assert.match(await p.locator('#lesson-next').textContent(),/Check/);
    await fillVisual(p);await p.locator('#lesson-next').click();assert.equal(await current(p),part);assert.match(await p.locator('#visual-feedback').textContent(),/4 of 4/);assert.match(await p.locator('#lesson-next').textContent(),/Continue/);
    await p.locator('.lesson-scroll').evaluate(e=>e.scrollTop=0);await p.screenshot({path:`test-results/lesson-flow/${id}-${part}.png`});
    if(part==='build'){
     assert.equal(await p.locator('#scene').getAttribute('data-model'),'lesson-puzzle');await p.reload();await p.locator('#visual-feedback').waitFor();assert.equal(await current(p),'build');
     const saved=await p.evaluate(id=>JSON.parse(localStorage.getItem('biology-zoomout-lessons-v1')).lessons[id],id);assert.equal(saved.step,3);assert.equal(saved.part,'build');
     await p.locator('#lesson-back').click();assert.equal(await current(p),'label');assert.match(await p.locator('#visual-feedback').textContent(),/4 of 4/);await p.locator('#lesson-next').click();assert.equal(await current(p),'build');
    }
   }
   if(part.startsWith('practice')){
    assert.equal(await p.locator('#lesson-next').isDisabled(),true);assert.equal(await p.locator('[data-quick-choice]').count(),4);await p.locator('[data-quick-choice]').first().click();assert.equal(await p.locator('#lesson-next').isEnabled(),true);
    if(part==='practice-2'){await p.locator('[data-question-retry]').click();assert.equal(await p.locator('#lesson-next').isDisabled(),true);await p.locator('[data-quick-choice]').last().click();await p.reload();await p.locator('#quick-feedback').waitFor();assert.equal(await current(p),'practice-2');assert.equal(await p.locator('#lesson-next').isEnabled(),true);}
   }
   if(part==='recall'){assert.equal(await p.locator('#lesson-next').isDisabled(),true);await p.locator('#lesson-response').fill('The model connects component structure to the mechanism. Changing one component affects the outcome through those biological relationships.');await p.locator('#lesson-reveal').click();await p.locator('[data-rating=ready]').click();}
   // All forward navigation uses the one main action, never a tab or mode menu.
   await p.locator('#lesson-next').click();
  }
  assert.equal(await p.locator('#lesson-panel').getAttribute('data-type'),'complete');assert.equal(await p.locator('#lesson-next').isHidden(),true);
 }
 check('Complete focused and course lessons use Continue through all 11 parts, with assessment gating, checked puzzles, feedback, Back and precise reload/resume');
 await p.goto(base+'#lesson=topic-2-1&part=label');await p.locator('#visual-practice').waitFor();await p.locator('[data-visual-piece=p2]').click();await p.locator('g[data-visual-slot=s0]').click();
 await p.locator('#lesson-catalog-button').click();await p.locator('[data-resume="topic-2-1"]').click();assert.equal(await current(p),'label');assert.match(await p.locator('button[data-visual-slot=s0]').textContent(),/Golgi/);
 await waitForOffline(p);await context.setOffline(true);await p.reload();await p.locator('#visual-practice').waitFor();assert.equal(await current(p),'label');await fillVisual(p);await p.locator('#lesson-next').click();await p.locator('#lesson-next').click();assert.equal(await current(p),'build');await context.setOffline(false);
 check('Dashboard resume and offline continuation retain the exact activity and partial construction');await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),m=await mobile.newPage();watch(m);
 await m.goto(base+'#lesson=replication&part=label');await m.locator('#visual-practice').waitFor();await m.locator('[data-visual-piece=p0]').tap();await m.locator('g[data-visual-slot=s0]').tap();
 for(let i=1;i<4;i++){await m.locator(`[data-visual-piece=p${i}]`).tap();await m.locator(`button[data-visual-slot=s${i}]`).tap();}await m.locator('#lesson-next').tap();await m.locator('#lesson-next').tap();assert.equal(await current(m),'build');
 for(const size of [{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  await m.setViewportSize(size);await m.locator('.lesson-scroll').evaluate(e=>e.scrollTop=0);await m.screenshot({path:`test-results/lesson-flow/phone-${size.width}.png`});
  assert.equal(await m.evaluate(()=>{const c=document.querySelector('#scene canvas').getBoundingClientRect(),p=document.querySelector('#lesson-panel').getBoundingClientRect();return document.documentElement.scrollWidth<=innerWidth&&c.height>120&&(c.bottom<=p.top+.5||c.right<=p.left+.5);}),true);
 }
 await mobile.close();check('Touch continuation and puzzle layouts fit portrait, narrow and landscape phones');
 const motion=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'no-preference'});watch(motion);await motion.goto(base+'#lesson=replication');await motion.locator('#lesson-panel').waitFor();await motion.waitForFunction(()=>+document.querySelector('#process-range').value>.01);await motion.locator('#lesson-next').click();await motion.waitForFunction(()=>document.querySelector('.lesson-scroll').getAnimations().length===0);assert.equal(await current(motion),'predict');assert.equal(await motion.locator('#lesson-heading').evaluate(e=>e===document.activeElement),true);
 await motion.locator('[data-answer]').first().click();await motion.locator('#lesson-next').click();await motion.waitForFunction(()=>+document.querySelector('#process-range').value>.01);await motion.waitForFunction(()=>!document.querySelector('#lesson-next').disabled);await motion.locator('#lesson-next').click();assert.equal(await current(motion),'experiment');await motion.close();check('Animated transitions retain focus and automatic playback; reduced motion completes without transition delays');
 assert.deepEqual(errors,[]);await writeFile('test-results/lesson-flow/report.json',JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
