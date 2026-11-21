import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {lessons} from '../src/lessons.js';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[];
const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const go=async(p,id,step=0)=>{await p.goto(`${base}#lesson=${id}&step=${step}`);await p.locator('#lesson-panel').waitFor();await p.waitForLoadState('networkidle');};
const check=s=>{checks.push(s);console.log('PASS',s);};
const conditions={membranes:['closed',/20 above · 4 below/],gradient:['leaky',/ATP index 20/],light:['dark',/ATP index 0/],selection:['neutral',/A = 35.0%/],replication:['ligase-off',/5 unsealed nicks/],translation:['stop',/Met–Ala · 2 residues/],polypeptide:['uncharged',/3 residues · 2 peptide bonds/]};
await mkdir('test-results/interactive-lessons',{recursive:true});
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});observe(p);
 for(const l of lessons){
  await go(p,l.id);assert.equal(await p.locator('#lesson-panel').getAttribute('data-play'),'true');
  assert.equal(await p.locator('.lesson-diagram').count(),1);assert.equal(await p.locator('#scene canvas').count(),1);
  await p.locator('[data-lesson-at]').nth(2).click();
  assert.ok(Number(await p.locator('#process-range').inputValue())>0);
  assert.ok((await p.locator('#lesson-cue-text').textContent()).length>30);
  if(l.id==='translation'){
   await p.locator('#process-range').evaluate(el=>{el.value='.29';el.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.match(await p.locator('#lesson-cue-text').textContent(),/advances by one codon/);
   await p.locator('[data-lesson-at="0.25"]').click();
  }
  if(['replication','translation','polypeptide'].includes(l.id))await p.screenshot({path:`test-results/interactive-lessons/${l.id}.png`});
  await p.locator('#check-tab').click();assert.equal(await p.locator('#quick-feedback').isHidden(),true);
  await p.locator('[data-quick-choice]').first().click();assert.equal(await p.locator('#quick-feedback').isVisible(),true);
  await p.locator('#experiment-tab').click();await p.locator('#experiment-prediction').fill(`I predict that changing the ${l.id} condition will change the result because the mechanism needs that component.`);
  await p.locator('#experiment-run').click();await p.waitForFunction(()=>document.querySelector('#experiment-status').textContent.includes('Run complete'));
  const control=await p.locator('.experiment-results tbody tr').last().textContent();
  const [condition,result]=conditions[l.id];await p.locator('#experiment-condition').selectOption(condition);await p.locator('#experiment-run').click();
  await p.waitForFunction(()=>document.querySelector('#experiment-status').textContent.includes('Run complete'));
  const variant=await p.locator('.experiment-results tbody tr').last().textContent();
  assert.match(variant,result);assert.notEqual(variant,control);
  if(l.id==='membranes'){
   await p.locator('#diagram-tab').click();assert.match(await p.locator('#lesson-cue-text').textContent(),/channel is closed/);
  }
  if(l.id==='light'||l.id==='polypeptide'){
   const label=l.id==='light'?'ATP':'New C–N peptide bond';
   await p.waitForFunction(text=>{const labels=[...document.querySelectorAll('.view-labels:not([hidden]) .process-label')].filter(el=>el.textContent===text);return labels.length>0&&labels.every(el=>el.hidden);},label);
  }
  if(l.id==='polypeptide'){
   await p.locator('#diagram-tab').click();assert.match(await p.locator('#lesson-diagram').textContent(),/Uncharged tRNA/);
   await p.locator('#diagram-tab').focus();await p.keyboard.press('ArrowRight');
   assert.equal(await p.locator('#experiment-tab').getAttribute('aria-selected'),'true');
   assert.equal(await p.locator('#lesson-counter').textContent(),'1 / 6');
  }
  if(l.id==='light'){
   await p.locator('#lesson-exit').click();assert.equal(await p.locator('#lesson-panel').isHidden(),true);
   assert.match(await p.locator('#process-metrics').textContent(),/100/);
  }
  check(`${l.title}: 3D playback, linked diagram, question feedback and controlled comparison work`);
 }
 await p.reload();await p.locator('#experiment-tab').click();assert.equal(await p.locator('.experiment-results tbody tr').count(),2);assert.match(await p.locator('#experiment-prediction').inputValue(),/polypeptide/);
 await go(p,'replication',1);assert.equal(await p.locator('#lesson-live').isHidden(),true);assert.equal(await p.locator('#lesson-feedback').isHidden(),true);
 await p.locator('[data-answer="reverse"]').click();await p.locator('[data-answer="same"]').click();
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('biology-zoomout-lessons-v1')).lessons.replication.answers.predict.firstCorrect),false);
 await go(p,'translation',5);assert.equal(await p.locator('#lesson-live').isHidden(),true);assert.equal(await p.locator('.lesson-rubric').count(),0);
 await p.close();check('Predictions and comparisons persist; assessment and recall answers stay hidden until an attempt');
 const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});observe(m);
 await go(m,'replication');await m.locator('[data-lesson-at]').nth(2).tap();await m.screenshot({path:'test-results/interactive-lessons/phone-diagram.png'});
 await m.locator('#experiment-tab').tap();await m.locator('#experiment-condition').selectOption('helicase-off');await m.locator('#experiment-run').tap();
 assert.match(await m.locator('#experiment-status').textContent(),/0 leading \+ 0 lagging/);
 await m.screenshot({path:'test-results/interactive-lessons/phone-experiment.png'});
 assert.equal(await m.evaluate(()=>{const c=document.querySelector('#scene canvas').getBoundingClientRect(),p=document.querySelector('#lesson-panel').getBoundingClientRect();return c.height>130&&c.bottom<=p.top&&document.documentElement.scrollWidth<=innerWidth;}),true);
 await m.close();check('Phone diagrams and experiments keep the 3D canvas visible and separate from the card');
 const a=await browser.newPage({viewport:{width:1100,height:900},reducedMotion:'no-preference'});observe(a);
 for(const id of ['replication','translation','polypeptide']){await go(a,id);await a.waitForFunction(()=>Number(document.querySelector('#process-range').value)>.01);await a.locator('#process-play').click();const t=await a.locator('#process-range').inputValue();await a.waitForTimeout(150);assert.equal(await a.locator('#process-range').inputValue(),t);await a.locator('#process-play').click();}
 await a.close();check('All three new molecular lessons animate automatically and pause on request');
 assert.deepEqual(errors,[]);check('No application or shader errors');await writeFile('test-results/interactive-lessons/report.json',JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
