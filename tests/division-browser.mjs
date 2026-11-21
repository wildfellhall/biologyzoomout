import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {divisionStages} from '../src/division-state.js';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/',errors=[],checks=[];
const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const seek=async(p,t)=>{await p.locator('#process-range').evaluate((el,t)=>{el.value=String(t);el.dispatchEvent(new Event('input',{bubbles:true}));},t);await frame(p);};
const go=async(p,topic)=>{await p.goto(`${base}#lesson=topic-${topic}&step=0`);await p.locator('#lesson-stage-nav').waitFor();await frame(p);};
const check=s=>{checks.push(s);console.log('PASS',s);};
await mkdir('test-results/division',{recursive:true});
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});observe(p);
 await p.goto(base+'#lessons');await p.locator('#lesson-search').fill('mitosis');assert.equal(await p.locator('[data-lesson="topic-4-5"]').count(),1);
 await p.locator('[data-lesson="topic-4-5"]').click();await p.locator('#lesson-stage-nav').waitFor();
 for(const [kind,topic]of [['mitosis','4-5'],['meiosis','5-1']]){
  await go(p,topic);assert.equal(await p.locator('#lesson-stage-select option').count(),divisionStages[kind].length);
  assert.equal(await p.locator('#process-panel').getAttribute('data-playing'),'false');
  const initial=await p.locator('#scene canvas').screenshot();await p.locator('#diagram-tab').click();
  for(const [i,s]of divisionStages[kind].entries()){
   await p.locator('#lesson-stage-select').selectOption(String(i));assert.equal(await p.locator('#lesson-stage-select').inputValue(),String(i));
   assert.equal(Number(await p.locator('#process-range').inputValue()),s.at);assert.equal(await p.locator('#lesson-cue-text').textContent(),s.text);
   assert.ok((await p.locator('#lesson-diagram').textContent()).includes(s.title));
  }
  await p.locator('#lesson-stage-back').click();assert.equal(await p.locator('#lesson-stage-select').inputValue(),String(divisionStages[kind].length-2));
  await p.locator('#lesson-stage-next').click();const final=await p.locator('#scene canvas').screenshot();assert.notDeepEqual(initial,final);
  for(const [name,t]of kind==='mitosis'?[['metaphase',.49],['anaphase',.65],['daughters',1]]:[['crossing-over',.28],['anaphase-I',.50],['interkinesis',.65],['metaphase-II',.78],['products',1]]){
   await seek(p,t);await p.screenshot({path:`test-results/division/${kind}-${name}.png`});
  }
  await p.locator('#experiment-tab').click();await p.locator('#experiment-condition').selectOption(kind==='mitosis'?'blocked':'nondisjunction');
  await p.locator('#experiment-prediction').fill(kind==='mitosis'?'Sisters remain together and cytokinesis does not finish.':'Both long homologs go to one pole, leaving an unequal chromosome complement.');
  await p.locator('#experiment-run').click();assert.match(await p.locator('#experiment-status').textContent(),kind==='mitosis'?/Metaphase arrest/:/3 \/ 3 \/ 1 \/ 1/);
  await p.screenshot({path:`test-results/division/${kind}-perturbation.png`});
  if(kind==='mitosis')assert.equal(await p.locator('#lesson-stage-next').isDisabled(),true);
  else for(const condition of ['no-crossover','alternate']){
   await p.locator('#experiment-condition').selectOption(condition);await p.locator('#experiment-run').click();assert.match(await p.locator('#experiment-status').textContent(),/2 \/ 2 \/ 2 \/ 2/);
  }
  await p.reload();await p.locator('#experiment-tab').click();assert.ok(await p.locator('.experiment-results tbody tr').count()>0);
  await p.locator('#lesson-next').click();assert.equal(await p.locator('#lesson-stage-nav').isHidden(),true);assert.equal(await p.locator('#lesson-next').isDisabled(),true);
  await p.locator('[data-answer="correct"]').click();await p.locator('#lesson-next').click();await p.locator('#lesson-stage-nav').waitFor();
  await p.locator('#lesson-exit').click();assert.equal(await p.locator('#scene').getAttribute('data-model'),'animal-cell');
  // Reuse the cached division rig after another model has been built.
  await p.locator('#learn-toggle').click();await p.locator('#lesson-search').fill(kind);await p.locator(`[data-lesson="topic-${topic}"]`).click();
  await p.locator('#lesson-stage-nav').waitFor();await seek(p,.49);await seek(p,1);
  check(`${kind}: all phases, linked counts, controlled comparisons, saved runs and lesson navigation work`);
 }
 await p.close();
 const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});observe(m);
 for(const [width,height]of [[390,844],[320,568],[844,390]]){
  await m.setViewportSize({width,height});await go(m,'5-1');await m.locator('#lesson-stage-select').selectOption('10');await seek(m,.87);
  const fits=await m.evaluate(()=>{const box=id=>document.querySelector(id).getBoundingClientRect(),c=box('#scene canvas'),n=box('#lesson-stage-nav'),bar=box('#lesson-player-slot'),p=box('#lesson-panel');return document.documentElement.scrollWidth<=innerWidth&&n.width>150&&c.height>100&&((c.right<=p.left+.5&&c.bottom<=n.top+.5)||(c.bottom<=n.top+.5&&bar.bottom<=p.top+.5));});
  assert.equal(fits,true,`${width}×${height}: model, stages and reader stay separate`);
  await m.screenshot({path:`test-results/division/phone-${width}.png`});
  await m.locator('#experiment-tab').click();await m.locator('#experiment-run').click();assert.match(await m.locator('#experiment-status').textContent(),/2 \/ 2 \/ 2 \/ 2/);
 }
 await m.close();check('Stage controls and experiments fit portrait and landscape phones without covering the model');
 const a=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'no-preference'});observe(a);
 for(const topic of ['4-5','5-1']){await go(a,topic);await a.waitForFunction(()=>Number(document.querySelector('#process-range').value)>.008);await a.locator('#process-play').click();const at=await a.locator('#process-range').inputValue();await a.waitForTimeout(150);assert.equal(await a.locator('#process-range').inputValue(),at);await a.locator('#process-play').click();}
 await a.close();check('Both animations start automatically, pause on request and respect reduced motion');
 assert.deepEqual(errors,[]);await writeFile('test-results/division/report.json',JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
