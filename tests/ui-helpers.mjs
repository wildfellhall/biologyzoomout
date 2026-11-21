export async function choosePath(page,id){
 await page.locator('#paths-toggle').click();
 await page.locator('#path-select').selectOption(id);
 await page.locator('#explore-path').click();
}
export async function chooseContext(page,id){
 await page.locator('#paths-toggle').click();
 await page.locator('#organism-select').selectOption(id);
 await page.locator('#explore-path').click();
}
export async function showProcessDetails(page){
 if(await page.locator('#process-details').isHidden())await page.locator('#process-details-toggle').click();
}
export async function showLessonDiagram(page,{stages=true}={}){
 await page.locator('#diagram-tab').click();
 if(stages&&!(await page.locator('#lesson-stages').evaluate(el=>el.open)))await page.locator('#lesson-stages summary').click();
}
