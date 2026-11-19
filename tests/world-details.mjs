import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {featureNotes} from '../src/field-notes.js';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],checks=[];
const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const check=label=>{checks.push(label);console.log('PASS',label);};
const go=async(p,path,model,organism='plant')=>{await p.goto(`${base}#path=${path}&at=${model}&organism=${organism}`);await p.locator(`#scene[data-model="${model}"]`).waitFor();};
const frame=async p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const chooseFeature=async(p,id)=>{if(await p.locator('#field-note').isHidden())await p.locator('#field-note-toggle').click();await p.locator('#feature-select').selectOption(id);assert.equal(await p.locator('#field-note-title').textContent(),featureNotes[id].name);};
await fs.mkdir('test-results/world',{recursive:true});
try{
 const p=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});observe(p);
 await go(p,'dna','animal-cell','animal');
 await p.screenshot({path:'test-results/world/animal-cell.png'});
 assert.equal(await p.locator('#field-note').isVisible(),false);assert.equal(await p.locator('#process-panel').isVisible(),true);
 await p.locator('#field-note-toggle').click();
 const features=await p.locator('#feature-select option').evaluateAll(items=>items.map(i=>i.value));
 for(const id of ['cytoplasm','cortex','microtubules','glycocalyx'])assert.ok(features.includes(id));
 await chooseFeature(p,'glycocalyx');assert.match(await p.locator('#field-note-text').textContent(),/recognize/);
 await p.locator('[data-note-tab="look"]').click();assert.match(await p.locator('#field-note-text').textContent(),/Branched/);
 await p.locator('[data-note-tab="context"]').click();assert.match(await p.locator('#field-note-text').textContent(),/animal cell/);
 assert.match(await p.locator('#field-note-source').getAttribute('href'),/openstax.org/);
 await p.locator('#field-note-learn').click();assert.match(await p.locator('#node-dialog').textContent(),/APBIO-2.3-01/);await p.locator('#node-dialog .close-dialog').click();
 await p.locator('#field-note-inspect').click();await p.locator('#scene[data-model="membrane"]').waitFor();
 assert.equal(await p.locator('#field-note').isVisible(),true);await p.locator('#zoom-out').click();await p.locator('#scene[data-model="animal-cell"]').waitFor();assert.equal(await p.locator('#field-note').isVisible(),false);
 check('Cell details explain appearance, function and context; sources and original AP nodes resolve; inspection follows a valid membrane route');
 // Exercise actual geometry picking, including instanced particles, without relying on a debug scene API.
 await frame(p);
 const point=await p.evaluate(names=>{
  const canvas=document.querySelector('#scene canvas');
  for(let y=240;y<700;y+=17)for(let x=430;x<1050;x+=17){
   canvas.dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:y,pointerType:'mouse',bubbles:true}));
   const label=document.querySelector('.hover-label');
   if(!label.hidden&&names.some(n=>label.querySelector('strong')?.textContent===`${n} ↗`))return {x,y};
  }
  return null;
 },Object.values(featureNotes).map(f=>f.name));
 assert.ok(point,'a visible detail mesh can be picked');await p.mouse.click(point.x,point.y);assert.equal(await p.locator('#field-note').isVisible(),true);
 assert.equal(await p.locator('#node-dialog').isVisible(),false);
 await p.locator('#process-details-toggle').click();assert.equal(await p.locator('#field-note').isVisible(),false);
 await p.locator('#field-note-toggle').click();assert.equal(await p.locator('#process-details').isVisible(),false);
 await p.locator('#nodes-toggle').click();assert.equal(await p.locator('#field-note').isVisible(),false);await p.locator('#close-browser').click();
 await p.locator('#part-select').selectOption('nucleus');assert.equal(await p.locator('#field-note').isVisible(),true);
 await p.screenshot({path:'test-results/world/nucleus.png'});
 await p.keyboard.press('Escape');assert.equal(await p.locator('#field-note').isVisible(),false);assert.equal(await p.locator('#scene').getAttribute('data-model'),'nucleus');
 await p.keyboard.press('Escape');await p.locator('#scene[data-model="animal-cell"]').waitFor();
 check('Actual mesh picks open one note; notes, process explanations and the Index avoid stacking; Escape closes the note before returning');
 const cases=[
  ['starch','plant-cell',['cellulose','plasmodesmata','cytoplasm']],
  ['starch','leaf',['stomata','vascular','cuticle']],
  ['dna','epithelium',['matrix'],'animal'],
  ['starch','population',['litter','fungi','roots']],
  ['dna','rabbit-population',['litter','fungi','roots'],'animal'],
  ['woodland','tree-population',['litter','fungi','roots']],
  ['woodland','community',['litter','fungi','roots','stream']],
  ['woodland','ecosystem',['litter','fungi','roots','stream']],
 ];
 for(const [path,model,expected,organism='plant'] of cases){
  await go(p,path,model,organism);assert.equal(await p.locator('#field-note').isVisible(),false);
  for(const id of expected){await chooseFeature(p,id);assert.ok((await p.locator('#field-note-text').textContent()).length>30);}
  if(['plant-cell','leaf','community','ecosystem'].includes(model))await p.screenshot({path:`test-results/world/${model}.png`});
 }
 await p.locator('#field-note-close').click();
 await p.locator('#process-range').evaluate(el=>{el.value='.85';el.dispatchEvent(new Event('input',{bubbles:true}));});await frame(p);await p.screenshot({path:'test-results/world/ecosystem-established.png'});
 check('Both cells, leaf layers, epithelial support, populations, community and ecosystem expose their rendered details; succession still changes the woodland');
 await p.close();
 const m=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});observe(m);
 await go(m,'starch','plant-cell');await chooseFeature(m,'plasmodesmata');
 for(const [width,height] of [[390,844],[360,740]]){
  await m.setViewportSize({width,height});await frame(m);
  const note=await m.locator('#field-note').boundingBox(),process=await m.locator('#process-panel').boundingBox(),heading=await m.locator('.model-heading').boundingBox();
  assert.ok(note.x>=0&&note.x+note.width<=width&&note.y>=heading.y+heading.height,'note fits below the model heading');
  assert.ok(note.y+note.height<=process.y,'note leaves playback controls accessible');
  assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),true);
 }
 await m.screenshot({path:'test-results/world/mobile-note.png'});
 await m.locator('#field-note-close').tap();await m.locator('#part-select').selectOption('chloroplast');assert.equal(await m.locator('#field-note').isVisible(),true);
 await m.locator('#process-play').tap();await m.waitForFunction(()=>+document.querySelector('#process-range').value>0);await m.locator('#process-play').tap();
 await m.locator('#process-details-toggle').tap();assert.equal(await m.locator('#field-note').isVisible(),false);
 await m.close();check('Phone and small-phone notes fit without overflow, leave playback accessible, and support touch inspection');
 assert.deepEqual(errors,[]);check('No application or WebGL errors');
 await fs.writeFile('test-results/world/report.json',JSON.stringify({base,checks,errors},null,2));
}finally{await browser.close();}
