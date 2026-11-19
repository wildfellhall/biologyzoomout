import {choosePath,chooseContext,showProcessDetails} from './ui-helpers.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {cellParts} from '../src/structures.js';
import {featureNotes} from '../src/field-notes.js';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],checks=[];
const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const check=label=>{checks.push(label);console.log('PASS',label);};
const range=async(p,selector,value)=>{await p.locator(selector).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},String(value));await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
const at=async(p,model)=>{await p.locator(`.scale-stops [data-model="${model}"]`).click();await p.locator(`#scene[data-model="${model}"]`).waitFor();};
const go=async(p,path,model,organism='plant')=>{await choosePath(p,path);if(await p.locator('#organism-select').isEnabled())await chooseContext(p,organism);await at(p,model);};
await fs.mkdir('test-results/interactive',{recursive:true});
try{
 if(process.env.TEST_PHASE!=='mobile'){
 const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});observe(page);
 await page.goto(`${base}#scale=cells`);await page.locator('#scene[data-model="animal-cell"]').waitFor();
 await page.screenshot({path:'test-results/interactive/cell.png'});
 let hit=false;
 for(const [x,y]of [[620,400],[600,380],[600,430],[790,540],[840,360],[580,400],[650,400]]){
  await page.mouse.move(x,y);
  if(await page.locator('.hover-label').isVisible()){
   const label=await page.locator('.hover-label strong').textContent();
   if(!/membrane/i.test(label)&&!Object.values(featureNotes).some(f=>label===`${f.name} ↗`)){await page.mouse.click(x,y);hit=true;break;}
  }
 }
 assert.ok(hit,'an actual cell mesh is clickable');assert.ok(await page.locator('#structure-back').isVisible());
 assert.equal(await page.locator('#node-dialog').isVisible(),false);await page.locator('#structure-back').click();
 check('Direct 3D mesh clicks open a structure render with a return path');
 for(const type of ['animal-cell','plant-cell']){
  await go(page,'dna',type,type==='animal-cell'?'animal':'plant');
  for(const id of cellParts[type]){
   await page.locator('#part-select').selectOption(id);assert.equal(await page.locator('#scene').getAttribute('data-model'),id);
   if(type==='animal-cell'&&['nucleus','rough-er','golgi','ribosome','mitochondrion'].includes(id))await page.screenshot({path:`test-results/interactive/${id}.png`});
   await page.locator('#structure-back').click();assert.equal(await page.locator('#scene').getAttribute('data-model'),type);
  }
 }
 check('All 13 animal-cell and 14 plant-cell structure choices render and return correctly');
 await page.locator('#part-select').selectOption('nucleus');await page.locator('#part-select').selectOption('nucleolus');await page.locator('#part-select').selectOption('rrna');
 assert.equal(await page.locator('#path-select').inputValue(),'nucleolar-rna');await page.locator('#zoom-out').click();await page.locator('#scene[data-model="nucleolus"]').waitFor();await page.locator('#zoom-out').click();await page.locator('#scene[data-model="nucleus"]').waitFor();
 await page.locator('#part-select').selectOption('nucleolus');await page.keyboard.press('Escape');assert.equal(await page.locator('#field-note').isVisible(),false);await page.keyboard.press('Escape');assert.equal(await page.locator('#scene').getAttribute('data-model'),'nucleus');
 await page.waitForTimeout(220);await page.reload();await page.locator('#scene[data-model="nucleus"]').waitFor();await page.locator('#zoom-out').click();await page.locator('#scene[data-model="plant-cell"]').waitFor();
 for(const [parent,child,next]of [['mitochondrion','mitochondrial-dna','mitochondrion'],['chloroplast','chloroplast-dna','chloroplast'],['chloroplast','chloroplast-atp-synthase','thylakoid']]){
  await go(page,'dna','plant-cell');await page.locator('#part-select').selectOption(parent);await page.locator('#part-select').selectOption(child);assert.equal(await page.locator('#scene').getAttribute('data-model'),child);await page.locator('#zoom-out').click();await page.locator(`#scene[data-model="${next}"]`).waitFor();
 }
 check('Nested inspection, organelle-specific parents, Escape/back, and route deep links');
 const cases=[['dna','dna','replication'],['enzymes','enzyme','catalysis'],['membrane','membrane','diffusion'],['respiration','mitochondrion','chemiosmosis'],['photosynthesis','chloroplast','light'],['dna','animal-cell','secretion','animal'],['starch','population','selection'],['dna','rabbit-population','selection','animal'],['woodland','community','predation'],['woodland','ecosystem','succession']];
 for(const [path,model,process,organism]of cases){
  await go(page,path,model,organism);
  assert.equal(await page.locator('#process-select').inputValue(),process);
  assert.equal(await page.locator('#process-play').getAttribute('aria-label'),'Play animation');
  if(process==='selection'){await showProcessDetails(page);await page.locator('#selection-environment').selectOption('favor-a');}
  await range(page,'#process-range',.2);const before=await page.locator('#scene canvas').screenshot();
  await range(page,'#process-range',.8);assert.equal(Number(await page.locator('#process-range').inputValue()),.8);const after=await page.locator('#scene canvas').screenshot();assert.notDeepEqual(after,before,`${process} visibly changes the 3D scene`);
  await page.screenshot({path:`test-results/interactive/${process}.png`});
  await range(page,'#process-range',.2);assert.equal(Number(await page.locator('#process-range').inputValue()),.2);
  if(process==='selection'){
   await showProcessDetails(page);
   for(const [environment,expected]of [['favor-A',.9],['favor-a',.02],['neutral',.35]]){await page.locator('#selection-environment').selectOption(environment);await range(page,'#process-range',1);const value=parseFloat(await page.locator('#process-metrics b').first().textContent())/100;if(environment==='favor-A')assert.ok(value>expected);else if(environment==='favor-a')assert.ok(value<expected);else assert.equal(value,expected);}
   assert.equal(await page.locator('#process-chart').isVisible(),true);assert.equal(await page.locator('#process-chart path').count(),2);
  }
 }
 check('Nine process types scrub in both directions; plant and animal selection pressures diverge');
 await go(page,'translation','ribosome');assert.equal(await page.locator('#process-select').inputValue(),'translation');
 await range(page,'#process-range',.6);await page.screenshot({path:'test-results/interactive/translation.png'});
 await range(page,'#process-range',1);await page.locator('#process-play').click();await page.waitForFunction(()=>+document.querySelector('#process-range').value>0&&+document.querySelector('#process-range').value<.2);await page.locator('#process-play').click();
 const paused=await page.locator('#process-range').inputValue();await page.waitForTimeout(300);assert.equal(await page.locator('#process-range').inputValue(),paused);
 await showProcessDetails(page);await page.locator('#process-speed').selectOption('2');await page.locator('#process-restart').click();assert.equal(Number(await page.locator('#process-range').inputValue()),0);
 check('Translation, replay after completion, pause stability, speed, and reduced-motion restart');
 await page.close();
 }
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});observe(mobile);
 await mobile.goto(`${base}#scale=cells&model=plant-cell`);await mobile.locator('#part-select').selectOption('chloroplast');assert.equal(await mobile.locator('#process-select').inputValue(),'light');await range(mobile,'#process-range',.7);
 assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),true);
 const dock=await mobile.locator('.scale-dock').boundingBox();
 for(const selector of ['#process-panel','#part-select','#paths-toggle']){const box=await mobile.locator(selector).boundingBox();assert.ok(box.x>=0&&box.x+box.width<=391&&box.y>=0&&box.y+box.height<=dock.y,selector);}
 await mobile.screenshot({path:'test-results/interactive/mobile-process.png'});
 await mobile.locator('#process-play').tap();await mobile.locator('#process-play').tap();await mobile.locator('#structure-back').tap();assert.equal(await mobile.locator('#scene').getAttribute('data-model'),'plant-cell');
 await mobile.screenshot({path:'test-results/interactive/mobile-cell.png'});
 check('Phone layout, touch inspection, touch playback, and no overflow');
 assert.deepEqual(errors,[]);check('No application or WebGL shader errors');
 await fs.writeFile(`test-results/interactive/report${process.env.TEST_PHASE==='mobile'?'-mobile':''}.json`,JSON.stringify({base,checks,errors},null,2));
}finally{await browser.close();}
