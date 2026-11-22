import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/',dir='test-results/lesson-quality';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],checks=[];
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});};
const frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const seek=async(p,t)=>{await p.locator('#process-range').evaluate((e,t)=>{e.value=String(t);e.dispatchEvent(new Event('input',{bubbles:true}));},t);await frame(p);};
const cases=[['2-1','cellular-organelles','blocked'],['2-4','cellular-permeability','ion'],['2-7','cellular-osmosis','hypotonic'],['3-1','cellular-enzyme','high'],['3-4','cellular-photosynthesis','no-carbon'],['3-5','cellular-respiration','ferment'],['4-3','cellular-cascade','bypass'],['7-1','ecology-selection','neutral'],['7-10','ecology-speciation','migration'],['8-1','ecology-response','uniform'],['8-2','ecology-energy-flow','efficient'],['8-3','ecology-population-growth','slow'],['8-4','ecology-logistic','habitat-loss'],['8-5','ecology-community','removed'],['8-6','ecology-biodiversity','single'],['8-7','ecology-disturbance','enriched']];
cases.push(['1-5','cellular-lipid','unsaturated'],['2-2','cellular-cell-size','large'],['2-3','cellular-membrane-fluidity','unsaturated'],['2-5','cellular-active-transport','no-atp'],['2-6','cellular-channel','closed'],['2-8','cellular-vesicles','endocytosis'],['2-9','cellular-compartments','leaky'],['2-10','cellular-endosymbiosis','shape'],['3-2','cellular-enzyme-environment','acid'],['3-3','cellular-coupling','uncoupled'],['4-1','cellular-communication','local'],['4-2','cellular-reception','constitutive'],['5-5','ecology-reaction-norm','interaction'],['7-2','ecology-selection-shape','directional'],['7-3','ecology-artificial-selection','selected'],['7-4','ecology-drift','large'],['7-8','ecology-resistance','absent'],['7-11','ecology-variation','uniform']);
const selected=process.env.TOPICS?cases.filter(c=>process.env.TOPICS.split(',').includes(c[0])):cases;
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});watch(p);
 p.setDefaultTimeout(60000);
 for(const [topic,family,condition]of selected){
  await p.goto(`${base}#lesson=topic-${topic}&part=observe`);await p.locator(`#scene[data-lesson-visual="${family}"]`).waitFor();
  await seek(p,.02);const initial=await p.locator('#scene canvas').screenshot();await seek(p,.78);const later=await p.locator('#scene canvas').screenshot();assert.notDeepEqual(initial,later,`${topic}: time must change the visible mechanism`);
  await p.screenshot({path:`${dir}/${topic}-desktop.png`});
  await p.locator('#lesson-next').click();await p.locator('#experiment-condition').selectOption(condition);await p.locator('#experiment-run').click();await seek(p,1);
  await p.screenshot({path:`${dir}/${topic}-condition.png`});
  assert.equal(await p.locator('.webgl-fallback').count(),0);assert.equal(await p.locator('#scene').getAttribute('data-lighting'),family.startsWith('ecology')?'habitat':'scientific');
  checks.push(`${topic}: detailed model, timeline and ${condition} comparison`);console.log('PASS',checks.at(-1));
 }
 await p.close();
 const m=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block',isMobile:true,hasTouch:true});watch(m);
 m.setDefaultTimeout(60000);
 for(const topic of (process.env.SKIP_PHONE?[]:process.env.PHONE_TOPICS?.split(',')||['2-1','2-7','3-4','4-3','8-1','8-3','8-5','8-7'])){
  await m.goto(`${base}#lesson=topic-${topic}&part=observe`);await m.locator('#lesson-panel').waitFor();await seek(m,.68);
  assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await m.screenshot({path:`${dir}/${topic}-phone.png`});
  checks.push(`${topic}: phone layout`);console.log('PASS',checks.at(-1));
 }
 await m.close();assert.deepEqual(errors,[]);await writeFile(`${dir}/${process.env.REPORT_NAME||'report'}.json`,JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
