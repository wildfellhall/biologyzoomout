import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {conceptQuestions} from '../src/practice/concepts.js';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/',errors=[];
const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const go=async(p,hash)=>{await p.goto(base+hash);await p.locator('#practice-page').waitFor();};
const frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const seek=async(p,t)=>{await p.locator('#process-range').evaluate((el,t)=>{el.value=String(t);el.dispatchEvent(new Event('input',{bubbles:true}));},t);await frame(p);};
await mkdir('test-results/practice',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),p=await context.newPage();observe(p);
 await p.goto(base+'#lessons');await p.locator('.dashboard-practice').click();await p.locator('#practice-page').waitFor();assert.equal(await p.locator('.practice-card').count(),76);
 await p.screenshot({path:'test-results/practice/dashboard.png'});
 for(const [i,n]of [9,12,7,8,7,10,14,9].entries()){await p.locator('#practice-unit').selectOption(String(i+1));assert.equal(await p.locator('.practice-card').count(),n);}
 await p.locator('#practice-unit').selectOption('1');await p.locator('.practice-card[href*="concept-1.1"]').click();await p.locator('#practice-prompt').waitFor();assert.equal(await p.locator('.practice-feedback').count(),0);assert.equal(await p.locator('#practice-submit').isDisabled(),true);
 await p.locator('input[value="o1"]').check();await p.locator('#practice-submit').click();assert.match(await p.locator('.practice-feedback').innerText(),/Review the relationship/);
 await p.locator('#practice-correction').fill('An open hydrogen-bonded lattice lowers ice density.');await p.reload();await p.locator('#practice-correction').waitFor();assert.match(await p.locator('#practice-correction').inputValue(),/lattice/);
 await p.locator('#practice-retry').click();assert.equal(await p.locator('.practice-feedback').count(),0);await p.locator('input[value="o0"]').check();await p.locator('#practice-submit').click();assert.match(await p.locator('.practice-attempt-note').innerText(),/2 attempts · First attempt incorrect/);await p.screenshot({path:'test-results/practice/mcq-feedback.png'});
 await p.locator('.practice-back').click();assert.equal(await p.locator('#practice-unit').inputValue(),'1');await p.goBack();await p.locator('#practice-prompt').waitFor();console.log('PASS MCQ concealment, balanced unit filters, correction persistence, retry and browser history');
 await go(p,'#practice&type=frq&unit=5&item=frq-unit-5');assert.equal(await p.locator('#frq-criteria-title').count(),0);
 const responses=['8 DNA molecules after one S phase.','2 chromosomes with two sisters each.','2 chromosomes in each normal product.','The final counts are 3, 3, 1, and 1.'];for(const [i,text]of responses.entries())await p.locator(`[data-frq-part="${i}"]`).fill(text);
 await p.reload();await p.locator('[data-frq-part="0"]').waitFor();assert.equal(await p.locator('[data-frq-part="0"]').inputValue(),responses[0]);assert.equal(await p.locator('#frq-criteria-title').count(),0);
 await p.locator('#practice-submit').click();await p.locator('[data-criterion="0"]').check();await p.locator('[data-criterion="3"]').check();assert.match(await p.locator('#practice-self-score').innerText(),/2 \/ 4/);await p.screenshot({path:'test-results/practice/frq-feedback.png'});
 await p.locator('#practice-revise').click();assert.equal(await p.locator('#frq-criteria-title').count(),0);await p.locator('[data-frq-part="0"]').fill('Eight: four replicated chromosomes each have two DNA molecules.');await p.locator('#practice-submit').click();await p.reload();await p.locator('.practice-history').waitFor();assert.match(await p.locator('.practice-history').innerText(),/Saved responses · 2/);await p.locator('.practice-history summary').click();assert.ok((await p.locator('.practice-history').innerText()).includes(responses[0]));console.log('PASS FRQ autosave, concealed rubric, self-assessment and preserved revision history');
 await go(p,'#practice&type=frq');assert.equal(await p.locator('.practice-card').count(),8);await p.locator('.practice-card').nth(2).click();await p.locator('[data-frq-part="0"]').waitFor();await p.screenshot({path:'test-results/practice/frq.png'});
 for(const size of [{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
  await p.setViewportSize(size);await go(p,'#practice&type=frq&item=frq-unit-2');assert.equal(await p.evaluate(()=>document.querySelector('#practice-page').scrollWidth<=innerWidth),true);assert.equal(await p.locator('[data-frq-part="0"]').isVisible(),true);await p.screenshot({path:`test-results/practice/frq-${size.width}.png`});
  await go(p,'#practice');assert.equal(await p.evaluate(()=>document.querySelector('#practice-page').scrollWidth<=innerWidth),true);
 }
 console.log('PASS responsive practice dashboard and written-response layouts');
 await p.setViewportSize({width:1440,height:1000});
 await go(p,'#practice&type=mcq&item=ap-3-1');assert.equal(await p.locator('.practice-mcq-stimulus table').count(),1);assert.equal(await p.locator('.practice-feedback').count(),0);await p.screenshot({path:'test-results/practice/stimulus-mcq.png'});

 for(const topic of ['1-1','2-7','3-5','4-5','5-1','6-4','7-5','8-2']){
  await p.goto(base+`#lesson=topic-${topic}`);await p.locator('#check-tab').click();assert.equal(await p.locator('[data-quick-choice]').count(),4);assert.ok(!(await p.locator('#check-pane').innerText()).includes('response variable'));await p.locator('[data-quick-choice]').first().click();assert.ok((await p.locator('#quick-feedback').innerText()).length>20);
  if(topic==='6-4'){await p.goto(base+'#practice&type=mcq&item=concept-6.4');await p.locator('.practice-feedback').waitFor();assert.match(await p.locator('.practice-attempt-note').innerText(),/1 attempt/);}

 }
 await p.goto(base+'#lesson=topic-6-4&step=1');await p.locator('[data-answer]').first().waitFor();assert.equal(await p.locator('[data-answer]').count(),4);await p.screenshot({path:'test-results/practice/lesson-question.png'});console.log('PASS distinct concept review across all units and four-choice lesson checkpoints');
 for(const [path,model,process]of [['dna','nucleosome','DNA accessibility'],['dna','chromatin','Chromatin organization'],['renewal','mitotic-cell','Mitosis'],['germline','meiotic-cell','Meiosis']]){
  await p.goto(base+`#path=${path}&organism=animal&at=${model}`);await p.locator('#process-panel').waitFor();assert.equal(await p.locator('#scene').getAttribute('data-model'),model);assert.ok((await p.locator('#process-name').innerText()).includes(process));
  await seek(p,0);const start=await p.locator('#scene canvas').screenshot();await seek(p,.57);const mid=await p.locator('#scene canvas').screenshot();assert.notDeepEqual(start,mid);await p.screenshot({path:`test-results/practice/${model}.png`});
  await p.locator('#process-details-toggle').click();assert.ok(await p.locator('[data-process-at]').count()>=4);await p.locator('[data-process-at]').last().click();assert.ok(Number(await p.locator('#process-range').inputValue())>=.7);await p.screenshot({path:`test-results/practice/${model}-end.png`});
 }
 await p.goto(base+'#path=germline&organism=animal&at=meiotic-cell');await p.locator('#process-panel').waitFor();await seek(p,1);await p.setViewportSize({width:390,height:844});await frame(p);await p.screenshot({path:'test-results/practice/meiosis-mobile.png'});
 await p.goto(base+'#path=dna&organism=animal&at=chromatin');await p.locator('#process-panel').waitFor();await p.locator('#part-select').selectOption('nucleosome');await p.waitForFunction(()=>document.querySelector('#scene').dataset.model==='nucleosome');assert.match(p.url(),/at=nucleosome/);

 assert.equal(await p.locator('.webgl-fallback').count(),0);
 const moving=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'no-preference'});const mp=await moving.newPage();observe(mp);await mp.goto(base+'#path=renewal&organism=animal&at=mitotic-cell');await mp.waitForFunction(()=>document.querySelector('#process-panel')?.dataset.playing==='true');await mp.waitForFunction(()=>Number(document.querySelector('#process-range')?.value)>.015);await moving.close();
console.log('PASS new pathway renderers, timeline stages and deterministic scrubbing');
 const blocked=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('Storage unavailable');};});const b=await blocked.newPage();observe(b);await go(b,'#practice');assert.match(await b.locator('#practice-save').innerText(),/Storage unavailable/);await blocked.close();
 assert.deepEqual(errors,[]);console.log('PASS no browser errors and storage failure is visible');
}finally{await browser.close();}
