import {choosePath,chooseContext,showProcessDetails} from './ui-helpers.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathways,buildPath} from '../src/pathways.js';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
await fs.mkdir('test-results/pathways',{recursive:true});
const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1,reducedMotion:'reduce'});
const errors=[],checks=[];
const observe=tab=>{tab.on('pageerror',e=>errors.push(e.message));tab.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};observe(page);
const check=label=>{checks.push(label);console.log('PASS',label);};
const settled=async(tab,value)=>tab.waitForFunction(target=>Math.abs(Number(document.querySelector('#scale-range').value)-target)<.002,value);
const at=async(tab,model)=>{await tab.locator(`.scale-stops [data-model="${model}"]`).click();await tab.locator(`#scene[data-model="${model}"]`).waitFor();};
const range=async(tab,value)=>{await tab.locator('#scale-range').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},String(value));await settled(tab,value);};
const ids=tab=>tab.locator('.scale-stops button').evaluateAll(buttons=>buttons.map(b=>b.dataset.model));
try {
 await page.goto(`${base}#path=starch&at=molecules`);await page.locator('#scene[data-model="molecules"]').waitFor();
 assert.equal(await page.locator('#node-browser').isVisible(),false);
 const canvas=await page.locator('canvas').boundingBox();assert.ok(canvas.width>=1438&&canvas.height>960*.77);
 assert.equal(await page.locator('aside, footer, .stage-copy, .learning-panel').count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),true);
 await page.locator('#scene').hover();await page.mouse.wheel(0,180);await settled(page,.324);await page.mouse.wheel(0,-180);await settled(page,0);
 check('Uncluttered canvas and continuous, reversible wheel zoom');
 assert.equal(await page.locator('#model-select optgroup[label="Amino acids"] option').count(),20);assert.equal(await page.locator('#model-select option').count(),29);
 for(const [molecule,path]of [['tyrosine','translation'],['ribose','rna'],['adenine','rna'],['glycerophosphocholine','membrane'],['water','water'],['atp','respiration'],['glucose','starch']]){await page.locator('#model-select').selectOption(molecule);assert.equal(await page.locator('#path-select').inputValue(),path);}
 await page.locator('#info-toggle').click();await page.locator('[data-style="space"]').click();assert.equal(await page.locator('[data-style="space"]').getAttribute('aria-pressed'),'true');
 assert.ok(await page.locator('#model-information a[href*="pubchem"]').count());await page.locator('[data-style="ball"]').click();await page.locator('#info-dialog .close-dialog').click();
 check('All 29 molecules remain available and choose compatible paths');
 const visited=new Set();
 for(const id of Object.keys(pathways)){
  await choosePath(page,id);const expected=buildPath(id,'plant');assert.deepEqual(await ids(page),expected.steps.map(s=>s.id));assert.equal(Number(await page.locator('#scale-range').getAttribute('max')),expected.steps.length-1);
  for(const step of expected.steps){if(visited.has(step.id))continue;await at(page,step.id);visited.add(step.id);assert.ok(Number(await page.locator('#nodes-count').textContent())>0);if(['chromatin','chromosome','phospholipid','photosystem','thylakoid','seed'].includes(step.id))await page.screenshot({path:`test-results/pathways/${step.id}.png`});}
 }
 check(`All ${Object.keys(pathways).length} named routes and ${visited.size} distinct plant/shared models render`);
 await choosePath(page,'dna');await at(page,'dna');await page.locator('#zoom-out').click();await page.locator('#scene[data-model="chromatin"]').waitFor();assert.ok(!(await ids(page)).includes('membrane'));
 await page.locator('#zoom-in').click();await page.locator('#scene[data-model="dna"]').waitFor();
 await at(page,'plant-cell');await choosePath(page,'membrane');assert.equal(await page.locator('#scene').getAttribute('data-model'),'plant-cell');
 await at(page,'membrane');await choosePath(page,'dna');assert.equal(await page.locator('#scene').getAttribute('data-model'),'molecules');
 check('DNA zooms to chromatin; path switching preserves shared structures and resets incompatible ones');
 await at(page,'plant-cell');await chooseContext(page,'animal');assert.equal(await page.locator('#scene').getAttribute('data-model'),'animal-cell');assert.deepEqual((await ids(page)).slice(-7),['animal-cell','epithelium','rabbit','rabbit-population','community','ecosystem','biosphere']);
 for(const model of ['epithelium','rabbit','rabbit-population']){await at(page,model);await page.screenshot({path:`test-results/pathways/${model}.png`});}
 await chooseContext(page,'plant');assert.equal(await page.locator('#scene').getAttribute('data-model'),'population');
 await page.locator('#scale-range').focus();await page.keyboard.press('End');await settled(page,11);assert.equal(await page.locator('#zoom-out').isDisabled(),true);await page.keyboard.press('Home');await settled(page,0);await page.keyboard.press('ArrowRight');await settled(page,1);await page.keyboard.press('ArrowLeft');await settled(page,0);
 check('Animal branches retain tissue, organism, and population context; keyboard endpoints match path length');
 await page.locator('#nodes-toggle').click();await page.locator('#all-scope').click();assert.equal(await page.locator('.node-card').count(),234);
 await page.locator('#node-search').fill('APBIO-2.7-02');assert.equal(await page.locator('.node-card').count(),1);await page.locator('.node-card').click();assert.match(await page.locator('#node-title').textContent(),/Water-potential/);
 await page.locator('[data-open-node="APBIO-F-02"]').click();assert.match(await page.locator('#node-title').textContent(),/Units, ratios/);await page.locator('#node-back').click();await page.locator('#review-node').click();
 await page.reload();await page.locator('#node-dialog[open]').waitFor();assert.equal(await page.locator('#review-node').getAttribute('aria-pressed'),'true');await page.locator('#go-to-model').click();assert.equal(await page.locator('#scene').getAttribute('data-model'),'membrane');assert.equal(await page.locator('#path-select').inputValue(),'membrane');
 await page.locator('#nodes-toggle').click();await page.locator('#unit-filter').selectOption('7');assert.ok(await page.locator('.node-card').count()>20);await page.locator('#unit-filter').selectOption('practices');assert.equal(await page.locator('.node-card').count(),29);await page.locator('#stage-scope').click();await page.locator('#close-browser').click();await page.keyboard.press('/');assert.equal(await page.locator('#global-search-input').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#search-dialog').isVisible(),false);
 check('All original nodes, prerequisites, filters, review state, deep links, and model connections');
 await choosePath(page,'dna');await chooseContext(page,'animal');await at(page,'chromatin');await range(page,2.25);await page.waitForFunction(()=>new URLSearchParams(location.hash.slice(1)).get('zoom')==='2.250');await page.reload();await settled(page,2.25);assert.equal(await page.locator('#organism-select').inputValue(),'animal');assert.equal(await page.locator('#path-select').inputValue(),'dna');
 await page.goto(`${base}#scale=cells&model=plant-cell`);await page.locator('#scene[data-model="plant-cell"]').waitFor();check('Route/context/fractional deep links and legacy cell URLs restore valid paths');
 await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});observe(mobile);await mobile.goto(`${base}#path=starch&at=molecules`);await mobile.locator('#scene[data-model="molecules"]').waitFor({timeout:60000});assert.equal(await mobile.locator('#pause-btn').getAttribute('aria-label'),'Resume rotation');assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),true);
 await choosePath(mobile,'dna');await chooseContext(mobile,'animal');await mobile.locator('#zoom-out').tap();await settled(mobile,1);
 const cdp=await mobile.context().newCDPSession(mobile);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:145,y:390,id:0},{x:245,y:390,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:115,y:390,id:0},{x:275,y:390,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(Number(await mobile.locator('#scale-range').inputValue())<.9);
 await range(mobile,4);await mobile.waitForTimeout(500);await mobile.screenshot({path:'test-results/pathways/mobile.png'});await mobile.locator('#nodes-toggle').tap();await mobile.locator('.node-card').first().tap();assert.equal(await mobile.locator('#node-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),true);check('Phone path selection, pinch zoom, reduced motion, and node dialogs without overflow');await mobile.close();
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:original.call(this,type,...args);};});await fallback.goto(`${base}#path=starch&at=molecules`);await fallback.locator('.webgl-fallback').waitFor();await choosePath(fallback,'dna');await fallback.locator('#nodes-toggle').click();await fallback.locator('#all-scope').click();assert.equal(await fallback.locator('.node-card').count(),234);await fallback.locator('#zoom-out').click();await settled(fallback,1);
 check('WebGL fallback retains paths and the complete ontology');assert.deepEqual(errors,[]);check('No application or shader errors');await fs.writeFile('test-results/pathways/browser-report.json',JSON.stringify({base,checks,models:[...visited],errors},null,2));
}catch(error){console.error('Browser errors:',errors);for(const context of browser.contexts())for(const tab of context.pages())console.error(await tab.locator('body').innerText());throw error;}finally{await browser.close();}
