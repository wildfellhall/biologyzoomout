export async function choosePath(page,id){
 await page.locator('#paths-toggle').click();
 await page.locator('#path-select').selectOption(id);
 await page.locator('#explore-path').click();
}
export async function waitForOffline(page){
 await page.waitForFunction(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  if(!registration?.active)return false;
  return new Promise(resolve=>{
   const channel=new MessageChannel();
   const timer=setTimeout(()=>{channel.port1.close();resolve(false);},2000);
   channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data.ready===true);};
   registration.active.postMessage({type:'OFFLINE_STATUS'},[channel.port2]);
  });
 },null,{timeout:45000});
}
export async function chooseContext(page,id){
 await page.locator('#paths-toggle').click();
 await page.locator('#organism-select').selectOption(id);
 await page.locator('#explore-path').click();
}
export async function showProcessDetails(page){
 if(await page.locator('#process-details').isHidden())await page.locator('#process-details-toggle').click();
}
// Direct part links exercise the compatibility route. Adjacent moves use the
// visible controls, retaining animation position and experiment conditions.
export async function showLessonPart(page,part){
 const ids=['overview','predict','observe','experiment','example','label','build','practice-1','practice-2','transfer','recall'];
 const steps=[0,1,2,2,3,3,3,3,3,4,5],target=ids.indexOf(part);
 if(target<0)throw new Error(`Unknown lesson part: ${part}`);
 const current=ids.indexOf(await page.locator('#lesson-panel').getAttribute('data-part'));
 if(current===target)return;
 if(current===target+1)await page.locator('#lesson-back').click();
 else if(current===target-1&&await page.locator('#lesson-next').isEnabled()&&!(await page.locator('#lesson-next').textContent()).includes('Check'))await page.locator('#lesson-next').click();
 else await page.evaluate(({part,step})=>{const params=new URLSearchParams(location.hash.slice(1));params.set('part',part);params.set('step',step);location.hash=params.toString();},{part,step:steps[target]});
 await page.waitForFunction(part=>document.querySelector('#lesson-panel')?.dataset.part===part,part);
}
export async function showLessonDiagram(page,{stages=true}={}){
 await showLessonPart(page,'observe');
 if(stages&&!(await page.locator('#lesson-stages').evaluate(el=>el.open)))await page.locator('#lesson-stages summary').click();
}
