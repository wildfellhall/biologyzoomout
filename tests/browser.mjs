import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {stages} from '../src/content.js';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
const executablePath=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser=await chromium.launch({executablePath,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
await fs.mkdir('test-results',{recursive:true});
const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
const checks=[];
const check=(label)=>{checks.push(label);console.log('PASS',label)};
try {
 await page.goto(base);await page.locator('.node-card').first().waitFor();
 assert.equal(await page.locator('canvas').count(),1);assert.equal(await page.locator('.webgl-fallback').count(),0);
 await page.locator('#pause-btn').click();await page.locator('#all-scope').click();assert.equal(await page.locator('.node-card').count(),234);check('All 234 original nodes accessible');
 await page.locator('#node-search').fill('APBIO-2.7-02');assert.equal(await page.locator('.node-card').count(),1);await page.locator('.node-card').click();assert.match(await page.locator('#node-title').textContent(),/Water-potential/);await page.locator('[data-open-node="APBIO-F-02"]').click();assert.match(await page.locator('#node-title').textContent(),/Units, ratios/);await page.locator('#node-back').click();assert.match(await page.locator('#node-title').textContent(),/Water-potential/);await page.locator('#review-node').click();assert.match(await page.locator('#review-node').textContent(),/Reviewed/);await page.locator('#node-dialog').screenshot({path:'test-results/node-detail.png'});check('Node detail, prerequisites, history, and reviewed marker');
 await page.reload();await page.locator('#node-dialog[open]').waitFor();assert.match(await page.locator('#review-node').textContent(),/Reviewed/);await page.locator('#go-to-model').click();assert.equal(await page.locator('#scale-range').inputValue(),'2');check('Deep links, local persistence, and return to model');
 await page.locator('[data-stage="0"]').click();await page.locator('[data-family="amino-acids"]').click();assert.equal(await page.locator('#compound-select option').count(),20);await page.locator('#compound-select').selectOption('tyrosine');assert.match(await page.locator('#model-name').textContent(),/Tyrosine/);await page.locator('[data-style="space"]').click();assert.equal(await page.locator('[data-style="space"]').getAttribute('aria-pressed'),'true');check('Twenty amino acids, molecule selector, and space filling');await page.locator('[data-style="ball"]').click();await page.locator('[data-family="carbohydrates"]').click();
 await page.locator('#scene').hover();await page.mouse.wheel(0,500);await page.waitForFunction(()=>document.querySelector('#scale-range').value==='1');check('Scroll changes biological scale');
 for(let i=0;i<stages.length;i++){
  await page.locator(`[data-stage="${i}"]`).click();assert.equal(await page.locator('#stage-title').textContent(),stages[i].title);assert.ok(await page.locator('.node-card').count()>0);await page.locator('#scene-wrap').scrollIntoViewIfNeeded();await page.waitForTimeout(750);await page.locator('#scene-wrap').screenshot({path:`test-results/scale-${i}.png`});
 }
 check('All ten scale scenes render and retain content cards');
 for(const [stage,model] of [[1,'protein'],[1,'amylose'],[3,'chloroplast'],[4,'plant-cell']]){await page.locator(`[data-stage="${stage}"]`).click();await page.locator(`[data-model="${model}"]`).click();await page.waitForTimeout(750);await page.locator('#scene-wrap').screenshot({path:`test-results/model-${model}.png`});}check('Alternate macromolecule, organelle, and cell models');
 await page.locator('#unit-filter').selectOption('7');assert.ok(await page.locator('.node-card').count()>20);const ids=await page.locator('.node-card').evaluateAll(cards=>cards.map(card=>card.dataset.node));assert.ok(ids.every(id=>id.startsWith('APBIO-7.')));await page.locator('#unit-filter').selectOption('practices');assert.equal(await page.locator('.node-card').count(),29);check('Unit and science-practice filters');
 await page.locator('#sources-nav').click();assert.ok(await page.locator('#about-dialog').isVisible());assert.ok(await page.locator('#about-dialog a[href="/data/ontology.json"]').count());await page.locator('#about-dialog .close-dialog').click();check('Source provenance and original ontology download');
 await page.locator('#stage-scope').click();await page.locator('[data-stage="0"]').click();await page.locator('#scene-wrap').scrollIntoViewIfNeeded();await page.waitForTimeout(750);await page.screenshot({path:'test-results/desktop-final.png',fullPage:true});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});mobile.on('pageerror',error=>errors.push(error.message));await mobile.goto(base);await mobile.locator('.node-card').first().waitFor();assert.equal(await mobile.locator('#pause-btn').getAttribute('aria-label'),'Resume rotation and animation');assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mobile.locator('#scene-larger').click();assert.equal(await mobile.locator('#scale-range').inputValue(),'1');await mobile.locator('#scene-smaller').click();await mobile.waitForTimeout(750);await mobile.screenshot({path:'test-results/mobile.png',fullPage:true});await mobile.locator('.node-card').first().click();assert.ok(await mobile.locator('#node-dialog').isVisible());assert.equal(await mobile.evaluate(()=>document.querySelector('#node-dialog').scrollWidth<=document.querySelector('#node-dialog').clientWidth),true);check('Mobile width, accessible scale controls, reduced motion, and dialogs');
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){if(String(type).includes('webgl'))return null;return original.call(this,type,...rest)}});await fallback.goto(base);await fallback.locator('.webgl-fallback').waitFor();await fallback.locator('#all-scope').click();assert.equal(await fallback.locator('.node-card').count(),234);await fallback.locator('#scene-larger').click();assert.equal(await fallback.locator('#scale-range').inputValue(),'1');check('WebGL failure preserves full learning access');
 assert.deepEqual(errors,[]);check('No runtime or console errors in working WebGL paths');
 await fs.writeFile('test-results/browser-report.json',JSON.stringify({base,checks,errors},null,2));
}finally{await browser.close()}
