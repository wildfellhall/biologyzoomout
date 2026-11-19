import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],checks=[];
const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const check=s=>{checks.push(s);console.log('PASS',s);};
const go=async(p,path,model,organism='plant')=>{await p.goto(`${base}#path=${path}&at=${model}&organism=${organism}`);await p.locator(`#scene[data-model="${model}"]`).waitFor();await p.waitForLoadState('networkidle');await frame(p);};
const frame=async p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const seek=async(p,t)=>{await p.locator('#process-range').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},String(t));await frame(p);};
await fs.mkdir('test-results/organisms',{recursive:true});
try{
 const p=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});observe(p);
 for(const [path,model,organism='plant']of [['starch','plant'],['dna','rabbit','animal'],['woodland','tree'],['woodland','tree-population'],['starch','population'],['dna','rabbit-population','animal'],['woodland','community'],['woodland','ecosystem']]){
  await go(p,path,model,organism);assert.equal(await p.locator('#scene').getAttribute('data-lighting'),'habitat');await p.screenshot({path:`test-results/organisms/${model}.png`});
  assert.equal(await p.locator('#field-note').isVisible(),false);
  if(model==='plant'){
   await p.locator('#part-select').selectOption('leaf');await p.locator('#scene[data-model="leaf"]').waitFor();await p.locator('#structure-back').click();await p.locator('#scene[data-model="plant"]').waitFor();
  }
  if(model==='rabbit'){
   await p.locator('#part-select').selectOption('epithelium');await p.locator('#scene[data-model="epithelium"]').waitFor();await p.locator('#structure-back').click();await p.locator('#scene[data-model="rabbit"]').waitFor();
  }
  if(['population','rabbit-population','community','ecosystem'].includes(model)){
   await seek(p,.15);const before=await p.locator('#scene canvas').screenshot();await seek(p,.85);const after=await p.locator('#scene canvas').screenshot();assert.notDeepEqual(before,after,`${model} process still changes its rendered state`);
   await seek(p,.15);const back=await p.locator('#scene canvas').screenshot();assert.deepEqual(back,before,`${model} scrubbing is deterministic, including ambient poses`);
  }
  if(model==='community'){
   await p.locator('#field-note-toggle').click();await p.locator('#feature-select').selectOption('predator');assert.match(await p.locator('#field-note-text').textContent(),/predator–prey/);await p.locator('#field-note-close').click();
   await seek(p,.1);await p.screenshot({path:'test-results/organisms/community-life.png'});
  }
 }
 check('All eight larger-scale views render; plant and animal tissue inspection retains valid return paths');
 check('Plant/rabbit selection, predation and succession change visibly and scrub reversibly with stable poses');
 await go(p,'dna','animal-cell','animal');assert.equal(await p.locator('#scene').getAttribute('data-lighting'),'scientific');
 await p.screenshot({path:'test-results/organisms/cell-after-habitat.png'});
 check('Returning from the habitat restores scientific lighting for cell inspection');
 // Reduced motion freezes the organism's fine movement as well as camera rotation.
 await go(p,'dna','rabbit','animal');await frame(p);await p.mouse.move(20,80);
 const still=await p.locator('#scene canvas').screenshot();await p.waitForTimeout(300);assert.deepEqual(await p.locator('#scene canvas').screenshot(),still);
 await p.close();check('Reduced motion leaves the animal still');
 const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});observe(m);
 for(const [path,model,organism]of [['starch','plant','plant'],['dna','rabbit','animal'],['woodland','community','plant']]){
  await go(m,path,model,organism);assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),true);
  await m.screenshot({path:`test-results/organisms/mobile-${model}.png`});
 }
 await m.close();check('Plant, animal and woodland scenes fit phone screens without overflow');
 const a=await browser.newPage({viewport:{width:900,height:700},reducedMotion:'no-preference'});observe(a);
 await go(a,'dna','rabbit','animal');const initial=await a.locator('#scene canvas').screenshot();await a.waitForTimeout(300);assert.notDeepEqual(await a.locator('#scene canvas').screenshot(),initial);
 await go(a,'woodland','community');await a.waitForFunction(()=>+document.querySelector('#process-range').value>.002);assert.equal(await a.locator('#process-play').getAttribute('aria-label'),'Pause animation');
 await a.locator('#process-play').click();const paused=await a.locator('#process-range').inputValue();await a.waitForTimeout(250);assert.equal(await a.locator('#process-range').inputValue(),paused);await a.close();
 check('Automatic motion and ecological playback work; process pause remains stable');
 assert.deepEqual(errors,[]);check('No application or WebGL errors');await fs.writeFile('test-results/organisms/report.json',JSON.stringify({base,checks,errors},null,2));
}finally{await browser.close();}
