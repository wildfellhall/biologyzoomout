import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks=[],errors=[];
await mkdir('test-results/lesson-layout',{recursive:true});
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
const geometry=p=>p.evaluate(()=>{
 const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 const read=document.querySelector('.lesson-scroll');
 return {canvas:rect('#scene canvas'),panel:rect('#lesson-panel'),controls:rect('#lesson-player-slot'),footer:rect('.lesson-footer'),read:rect('.lesson-scroll'),overflow:read.scrollHeight-read.clientHeight,font:parseFloat(getComputedStyle(document.querySelector('#lesson-content')).fontSize),width:innerWidth,height:innerHeight,fits:document.documentElement.scrollWidth<=innerWidth};
});
const check=message=>{checks.push(message);console.log('PASS',message);};
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(base+'#lesson=topic-6-2');await p.locator('#lesson-content').waitFor();await settle(p);
 for(const [width,height,split]of [[1440,1000,true],[1920,1080,true],[2560,1440,true],[1024,768,true],[768,1024,false],[390,844,false],[320,568,false],[844,390,true],[667,375,true]]){
  await p.setViewportSize({width,height});await settle(p);const g=await geometry(p);
  assert.equal(g.fits,true);assert.ok(g.canvas.width>250&&g.canvas.height>120);
  assert.equal(g.panel.bottom,height);assert.ok(g.read.height>100);assert.ok(g.font>=16);
  if(split){
   assert.ok(g.canvas.right<=g.panel.x+.5,'Model and reader do not overlap');
   assert.ok(g.canvas.width>=width*.38,'Model uses the available screen width');
   assert.ok(g.panel.height>=height*.8,'Reader uses the screen height');
   assert.ok(g.canvas.bottom<=g.controls.y,'Playback sits below the model');
   assert.ok(g.controls.right<=g.panel.x,'Playback stays with the model');
  }else{
   assert.ok(g.canvas.bottom<=g.controls.y+.5);assert.ok(g.controls.bottom<=g.panel.y+.5);
   assert.equal(g.panel.width,width);assert.ok(g.read.width>=width-1);
  }
  if(width>=1440)assert.equal(g.overflow,0,'Explanation fits without an artificial half-height limit');
  if(width<640){
   const navigation=await p.locator('.lesson-topline').boundingBox(),install=await p.locator('#install-toggle').boundingBox();
   assert.ok(navigation.y+navigation.height<=g.canvas.y,'Phone navigation shares the top bar');
   assert.ok(navigation.x+navigation.width<=install.x,'Navigation leaves room for app controls');
   assert.ok(g.read.height>=g.panel.height-80,'Phone reading area only reserves room for the footer');
  }
  await p.screenshot({path:`test-results/lesson-layout/read-${width}x${height}.png`});
 }
 check('Full-height desktop, portrait tablet/phone and short landscape layouts use available space without overlap');
 await p.setViewportSize({width:1920,height:1080});await settle(p);await p.locator('#diagram-tab').click();
 assert.ok((await p.locator('.lesson-diagram').boundingBox()).height>200,'Diagrams grow on a wide screen');
 await p.screenshot({path:'test-results/lesson-layout/diagram-wide.png'});
 await p.locator('#experiment-tab').click();await p.locator('#experiment-condition').selectOption('ligase-off');
 await p.locator('#experiment-prediction').fill('DNA synthesis can continue, but the new strands retain unsealed nicks.');
 await p.locator('#experiment-run').click();assert.match(await p.locator('#experiment-status').textContent(),/Unsealed nicks: 5/);
 await p.screenshot({path:'test-results/lesson-layout/experiment-wide.png'});
 for(const [width,height]of [[390,844],[844,390],[1440,1000]]){
  await p.setViewportSize({width,height});await settle(p);
  assert.equal(await p.locator('#experiment-tab').getAttribute('aria-selected'),'true');
  assert.equal(await p.locator('#experiment-condition').inputValue(),'ligase-off');
  assert.match(await p.locator('#experiment-prediction').inputValue(),/unsealed nicks/);
  assert.equal(await p.locator('.experiment-results tbody tr').count(),1);
  assert.equal(await p.locator('#process-range').inputValue(),'1','Resizing preserves the animation position');
  await p.locator('#process-range').focus();await p.keyboard.press('Home');assert.equal(await p.locator('#process-range').inputValue(),'0');
  await p.keyboard.press('End');assert.equal(await p.locator('#process-range').inputValue(),'1');
 }
 check('Large diagrams and experiments remain interactive; rotating/resizing preserves conditions, predictions and results');
 await p.locator('#lesson-next').click();assert.equal(await p.locator('#lesson-next').isDisabled(),true);
 await settle(p);assert.equal(await p.locator('#lesson-player-slot').isHidden(),true);
 const question=await geometry(p);assert.ok(question.canvas.right<=question.panel.x);
 assert.equal(question.canvas.bottom,question.height,'Question models reclaim the playback area');
 await p.screenshot({path:'test-results/lesson-layout/question-wide.png'});
 await p.locator('[data-answer="correct"]').click();assert.equal(await p.locator('#lesson-next').isEnabled(),true);
 await p.goto(base+'#lesson=topic-6-2&step=5');await p.locator('#lesson-response').fill('Each parental strand serves as the template for a newly synthesized complementary strand.');
 await p.setViewportSize({width:390,height:844});await settle(p);await p.locator('#lesson-reveal').click();
 await p.locator('[data-rating="ready"]').click();assert.equal(await p.locator('#lesson-next').isEnabled(),true);
 await p.locator('#lesson-response').scrollIntoViewIfNeeded();await p.screenshot({path:'test-results/lesson-layout/recall-phone.png'});
 await p.locator('#lesson-exit').click();assert.equal(await p.locator('#lesson-panel').isHidden(),true);
 assert.equal(await p.locator('#process-panel').evaluate(el=>el.parentElement.id),'viewer');
 check('Question gating and written recall work at both sizes; leaving lessons restores the explorer controls');
 assert.deepEqual(errors,[]);await writeFile('test-results/lesson-layout/report.json',JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
