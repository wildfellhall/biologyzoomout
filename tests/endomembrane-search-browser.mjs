import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.BASE_URL||'http://127.0.0.1:5173/';
const errors=[];
const observe=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});};
const scrub=async(p,t)=>{await p.locator('#process-range').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},t);await p.waitForTimeout(500);};
const search=async(p,query,category='models')=>{await p.locator('#search-toggle').click();await p.locator(`[data-search-kind="${category}"]`).first().click();await p.locator('#global-search-input').fill(query);};
const at=async(p,model)=>p.locator(`#scene[data-model="${model}"]`).waitFor();
await fs.mkdir('test-results/endomembrane',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});observe(page);
 await page.goto(`${base}#explore&context=animal`);await page.locator('#start-context').selectOption('animal');
 await search(page,'Golgi bodies');
 assert.equal(await page.locator('#search-results .search-result strong').first().textContent(),'Golgi apparatus');
 await page.locator('#global-search-input').press('ArrowDown');await page.keyboard.press('Enter');await at(page,'golgi');
 assert.match(page.url(),/organism=animal/);assert.equal(await page.locator('#process-select').inputValue(),'golgi-sorting');
 await page.waitForFunction(()=>+document.querySelector('#process-range').value>.015);
 for(const [query,model,process]of [['Golgi','golgi','golgi-sorting'],['RER','rough-er','er-protein'],['SER','smooth-er','er-lipids']]){
  await search(page,query);await page.locator('#search-results a').first().click();await at(page,model);
  assert.equal(await page.locator('#process-select').inputValue(),process);
  await scrub(page,.36);const before=await page.locator('#scene canvas').screenshot();
  await scrub(page,.88);const after=await page.locator('#scene canvas').screenshot();assert.notDeepEqual(before,after,`${model} animation changes geometry`);
  await page.screenshot({path:`test-results/endomembrane/${model}.png`});
  await scrub(page,.36);assert.equal(+await page.locator('#process-range').inputValue(),.36);
 }
 await page.locator('#process-variant').selectOption('er-calcium');await scrub(page,.6);assert.match(await page.locator('#process-caption').textContent(),/release channels/);
 await page.screenshot({path:'test-results/endomembrane/calcium.png'});
 await page.locator('#process-details-toggle').click();await page.locator('#structure-only').click();assert.equal(await page.locator('#process-panel').isHidden(),true);
 await page.locator('#restore-animation').click();assert.equal(await page.locator('#process-select').inputValue(),'er-lipids');
 await search(page,'nonsensezzz');assert.match(await page.locator('#search-results').textContent(),/No matches/);
 await page.locator('#global-search-input').fill('DNA');await page.locator('[data-search-kind="all"]').first().click();await page.screenshot({path:'test-results/endomembrane/search.png'});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#search-dialog').isHidden(),true);
 await page.keyboard.press('Control+k');assert.equal(await page.locator('#search-dialog').isVisible(),true);await page.keyboard.press('Escape');
 await search(page,'2.1','lessons');await page.locator('#search-results a[href="#lesson=topic-2-1"]').click();await page.waitForFunction(()=>document.body.classList.contains('lesson-mode'));
 await search(page,'Golgi','nodes');await page.locator('#search-results a').first().click();await page.locator('#node-dialog').waitFor();assert.match(await page.locator('#node-detail').textContent(),/Golgi/);
 await page.locator('#node-dialog .close-dialog').click();
 // Models still inspect from cells; back returns to the containing cell.
 await page.goto(`${base}#path=dna&organism=animal&at=animal-cell`);await at(page,'animal-cell');
 for(const model of ['rough-er','smooth-er','golgi']){await page.locator('#part-select').selectOption(model);await at(page,model);await page.locator('#structure-back').click();await at(page,'animal-cell');}
 await page.close();
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});observe(mobile);
 await mobile.goto(`${base}#explore`);await search(mobile,'SER');await mobile.screenshot({path:'test-results/endomembrane/search-mobile.png'});await mobile.locator('#search-results a').first().tap();await at(mobile,'smooth-er');
 assert.equal(await mobile.locator('#process-play').getAttribute('aria-label'),'Play animation');
 await mobile.locator('#process-variant').selectOption('er-calcium');await scrub(mobile,.6);
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 for(const id of ['search-toggle','process-panel','process-variant']){const b=await mobile.locator(`#${id}`).boundingBox();assert.ok(b.x>=0&&b.x+b.width<=391,id);}
 await mobile.screenshot({path:'test-results/endomembrane/mobile.png'});
 await mobile.close();assert.deepEqual(errors,[]);
 console.log('PASS: organelle animations, automatic playback, scrubbing, cell inspection, reduced motion, global search/aliases/categories/keyboard/routes, mobile layout; no browser errors.');
}finally{await browser.close();}
