import {showLessonDiagram} from './ui-helpers.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/',errors=[],checks=[];
await mkdir('test-results/course-framing',{recursive:true});
try{
 for(const viewport of [{width:390,height:844},{width:1440,height:1000}]){
  const p=await browser.newPage({viewport,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
  for(const topic of ['1-1','1-5','1-6','5-1','6-2','6-4']){
   await p.goto(`${base}#lesson=topic-${topic}&step=0`);
   await p.locator('#lesson-panel').waitFor();await showLessonDiagram(p);await p.locator('[data-lesson-at]').nth(1).click();
   await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   if(topic==='6-2'){
    const label=p.locator('.view-labels:not([hidden]) .process-label').filter({hasText:'Helicase'});
    assert.equal(await label.isVisible(),true,'The replication fork label must fit inside the canvas');
    const labelBounds=await label.boundingBox(),canvas=await p.locator('#scene canvas').boundingBox();
    assert.ok(labelBounds.y>=canvas.y&&labelBounds.y+labelBounds.height<=canvas.y+canvas.height);
   }
   await showLessonDiagram(p);await p.locator('[data-lesson-at]').nth(2).click();
   await p.screenshot({path:`test-results/course-framing/${topic}-${viewport.width}.png`});
   assert.equal(await p.locator('.webgl-fallback').count(),0);
   checks.push(`${topic}: model fits ${viewport.width}px viewport`);
   if(['1-5','1-6','6-4'].includes(topic)){
    await p.locator('#lesson-exit').click();
    const expected={'1-5':'phospholipid','1-6':'dna','6-4':'ribosome'}[topic];
    assert.equal(await p.locator('#scene').getAttribute('data-model'),expected);
   }
  }
  await p.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS Tall reaction models and wider teaching scenes fit both phone and desktop viewports');
 await writeFile('test-results/course-framing/report.json',JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
