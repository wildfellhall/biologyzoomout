// Stable presentation parts sit over the original six lesson steps. Checkpoint
// IDs, answer histories, old step URLs and review schedules keep their meanings.
const parts=[
 ['overview',0,'read','Explore the idea'],
 ['predict',1,'checkpoint','Make a prediction'],
 ['observe',2,'inspect','Watch the mechanism'],
 ['experiment',2,'experiment','Try a comparison'],
 ['example',3,'read','Work through an example'],
 ['label',3,'label','Label the diagram'],
 ['build',3,'build','Assemble the model'],
 ['practice-1',3,'practice','Review the concept',0],
 ['practice-2',3,'practice','Apply the mechanism',1],
 ['transfer',4,'checkpoint','Apply the idea'],
 ['recall',5,'recall','Explain it from memory'],
];
export function lessonFlow(lesson){return parts.filter(p=>lesson.steps[p[1]]).map(([id,step,kind,title,question])=>({id,step,kind,title,question}));}
export function resolveLessonPart(lesson,{step=null,part=null}={}){
 const flow=lessonFlow(lesson),selected=flow.findIndex(p=>p.id===part&&(step===null||p.step===step));
 if(selected>=0)return selected;
 const base=Math.max(0,Math.min(lesson.steps.length-1,Number.isInteger(step)?step:0));
 return Math.max(0,flow.findIndex(p=>p.step===base));
}
