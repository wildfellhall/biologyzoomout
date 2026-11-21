import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/',checks=[],errors=[];
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const check=s=>{checks.push(s);console.log('PASS',s);};
const frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
await mkdir('test-results/dashboard',{recursive:true});
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});watch(p);
 await p.goto(base);await p.locator('#home-lessons').click();await p.locator('#lesson-dashboard').waitFor();
 assert.match(p.url(),/#lessons$/);assert.equal(await p.locator('#home-page').isHidden(),true);assert.equal(await p.locator('#viewer').isHidden(),true);assert.equal(await p.locator('dialog[open]').count(),0);
 assert.equal(await p.locator('.unit-card').count(),8);await p.screenshot({path:'test-results/dashboard/overview.png'});
 for(const [i,count]of [7,10,5,6,5,8,12,7].entries()){
  await p.locator(`[data-course-unit="${i+1}"]`).click();assert.equal(await p.locator('.topic-lesson').count(),count);assert.match(p.url(),new RegExp(`unit=${i+1}`));await p.locator('#dashboard-all-units').click();
 }
 await p.locator('[data-course-unit="6"]').click();await p.reload();await p.locator('#lesson-unit-heading').waitFor();assert.match(await p.locator('#lesson-unit-heading').textContent(),/Gene Expression/);
 await p.screenshot({path:'test-results/dashboard/unit.png'});
 await p.locator('#lesson-search').fill('meiosis');assert.equal(await p.locator('.topic-lesson').count(),2);assert.match(p.url(),/q=meiosis/);assert.equal(await p.locator('#lesson-search').evaluate(el=>el===document.activeElement),true);
 await p.reload();assert.equal(await p.locator('#lesson-search').inputValue(),'meiosis');await p.locator('#lesson-search').fill('nothingmatches');assert.equal(await p.locator('.lesson-empty').isVisible(),true);
 await p.locator('#dashboard-all-units').click();await p.locator('[data-course-unit="6"]').click();
 check('Lessons is a dedicated dashboard; all eight units, search, deep links and reloads work');
 await p.locator('[data-lesson="topic-6-2"]').click();await p.locator('#lesson-panel').waitFor();
 assert.equal(await p.locator('#lesson-dashboard').isHidden(),true);assert.equal(await p.locator('#lesson-content').isVisible(),true);assert.equal(await p.locator('#lesson-live').isHidden(),true);assert.equal(await p.locator('.lesson-references').getAttribute('open'),null);
 await p.screenshot({path:'test-results/dashboard/lesson-read.png'});
 await p.locator('#read-tab').focus();await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#diagram-tab').getAttribute('aria-selected'),'true');assert.equal(await p.locator('#lesson-counter').textContent(),'1 / 6');
 assert.equal(await p.locator('#lesson-content').isHidden(),true);assert.equal(await p.locator('#lesson-stages').getAttribute('open'),null);
 await p.locator('#lesson-stages summary').click();await p.locator('[data-lesson-at]').nth(2).click();await p.screenshot({path:'test-results/dashboard/lesson-diagram.png'});
 await p.locator('#experiment-tab').click();assert.equal(await p.locator('#diagram-pane').isHidden(),true);await p.locator('#experiment-condition').selectOption('ligase-off');await p.locator('#experiment-prediction').fill('New strands form, but nicks remain unsealed.');await p.locator('#experiment-run').click();assert.match(await p.locator('#experiment-status').textContent(),/Unsealed nicks: 5/);
 await p.locator('#lesson-next').click();assert.equal(await p.locator('#lesson-tabs').isHidden(),true);assert.equal(await p.locator('#lesson-next').isDisabled(),true);await p.locator('[data-answer="correct"]').click();
 await p.goBack();await p.locator('#lesson-dashboard').waitFor();assert.match(p.url(),/unit=6/);assert.match(await p.locator('#lesson-resume').textContent(),/DNA Replication/);
 await p.locator('[data-resume="topic-6-2"]').click();assert.equal(await p.locator('#lesson-counter').textContent(),'2 / 6');
 await p.locator('#lesson-next').click();assert.equal(await p.locator('#experiment-tab').getAttribute('aria-selected'),'true');assert.match(await p.locator('#experiment-prediction').inputValue(),/nicks/);assert.equal(await p.locator('.experiment-results tbody tr').count(),1);
 await p.locator('#lesson-next').click();await p.locator('#lesson-next').click();await p.locator('[data-answer="correct"]').click();await p.locator('#lesson-next').click();
 await p.locator('#lesson-response').fill('Each old strand templates a new strand. Polymerases extend new DNA in the five to three direction.');await p.locator('#lesson-reveal').click();await p.locator('[data-rating="ready"]').click();await p.locator('#lesson-next').click();
 await p.locator('[data-finish="catalog"]').click();assert.match(await p.locator('#dashboard-progress').textContent(),/1 of 60/);assert.match(await p.locator('#lesson-review-status').textContent(),/Next review/);
 await p.screenshot({path:'test-results/dashboard/progress.png'});
 await p.locator('#start-review').click();assert.equal(await p.locator('#lesson-feedback').isHidden(),true);await p.locator('#lesson-catalog-button').click();
 check('Lessons show one activity at a time; keyboard tabs, experiments, answers, resume, completion and reviews survive dashboard navigation');
 await p.locator('#dashboard-explore').click();assert.equal(await p.locator('#scene').getAttribute('data-model'),'dna');assert.equal(await p.locator('#learn-toggle').getAttribute('aria-current'),null);await p.locator('#learn-toggle').click();await p.goBack();await p.locator('#viewer').waitFor();
 await p.locator('#home').click();await p.locator('#home-page').waitFor();await p.close();
 const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});watch(m);
 for(const width of [390,320]){
  await m.setViewportSize({width,height:844});await m.goto(base+'#lessons');await m.locator('.unit-card').first().waitFor();
  assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('#lesson-dashboard').scrollWidth<=innerWidth&&document.querySelector('.brand').getBoundingClientRect().right<document.querySelector('.top-actions').getBoundingClientRect().left),true);
  assert.equal(await m.locator('.unit-card h3').evaluateAll(titles=>titles.every(title=>title.scrollWidth<=title.clientWidth)),true,'Unit titles fit inside their cards');
  await m.screenshot({path:`test-results/dashboard/phone-${width}.png`});await m.locator('[data-course-unit="6"]').click();await m.locator('[data-lesson="topic-6-2"]').click();await frame(m);
  assert.equal(await m.evaluate(()=>{const c=document.querySelector('#scene canvas').getBoundingClientRect(),p=document.querySelector('#lesson-panel').getBoundingClientRect();return c.height>180&&c.bottom<=p.top&&document.documentElement.scrollWidth<=innerWidth;}),true);
  assert.equal(await m.locator('#lesson-content').isVisible(),true);await m.screenshot({path:`test-results/dashboard/phone-read-${width}.png`});
  await m.locator('#experiment-tab').click();assert.equal(await m.locator('#experiment-pane').isVisible(),true);await m.screenshot({path:`test-results/dashboard/phone-experiment-${width}.png`});
 }
 await m.close();check('Dashboard and focused lesson views fit 320–390px phones while keeping the model unobstructed');
 assert.deepEqual(errors,[]);await writeFile('test-results/dashboard/report.json',JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
