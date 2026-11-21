import framework from './framework.json' with {type:'json'};
import {courseContent} from './content.js';
import {labs} from './labs.js';
export {framework};
export const topicLessonId=topic=>`topic-${topic.replace('.','-')}`;
const context={1:['water','molecules'],2:['membrane','plant-cell'],3:['respiration','mitochondrion'],4:['dna','plant-cell'],5:['dna','nucleus'],6:['dna','dna'],7:['woodland','tree-population'],8:['woodland','ecosystem']};
// Leaving a teaching model returns to a relevant, already-justified biological path.
const topicContext={
 '1.2':['translation','molecules'],'1.3':['starch','amylose'],'1.4':['starch','amylose'],
 '1.5':['membrane','phospholipid'],'1.6':['dna','dna'],'1.7':['seed-protein','protein'],
 '2.3':['membrane','membrane'],'2.4':['membrane','membrane'],'2.5':['membrane','membrane'],
 '2.6':['membrane','membrane'],'2.7':['membrane','animal-cell','animal'],'2.8':['translation','rough-er'],
 '2.9':['respiration','mitochondrion'],'2.10':['mitochondrial-dna','mitochondrion'],
 '3.1':['enzymes','enzyme'],'3.2':['enzymes','enzyme'],'3.4':['photosynthesis','chloroplast'],
 '4.5':['dna','animal-cell','animal'],'5.1':['dna','animal-cell','animal'],
 '5.5':['photosynthesis','plant'],'6.3':['dna','nucleus'],'6.4':['translation','ribosome'],
 '8.1':['photosynthesis','plant'],'8.3':['woodland','tree-population'],'8.4':['woodland','tree-population'],'8.5':['woodland','community'],
};
function assessment(data,offset){
 const options=[{id:'correct',text:data.answer,feedback:data.reason},...data.distractors.map((d,i)=>({id:`alternative-${i+1}`,...d}))];
 return {prompt:data.prompt,correct:'correct',options:[...options.slice(offset),...options.slice(0,offset)]};
}
export const courseLessons=courseContent.map((c,index)=>{
 const topic=framework.topics.find(t=>t.id===c.topic),unit=Number(c.topic.split('.')[0]),config=labs[c.sim],id=topicLessonId(c.topic),[path,model,organism='plant']=topicContext[c.topic]||context[unit];
 const view=(at=0,animated=true)=>({path,model,organism,lab:c.topic,process:animated?`topic-${c.topic}`:null,at});
 const cues=config.stages||config.beats.map((title,i)=>({at:i/3,title,text:i===0?c.objective:i===3?config.note:config.prompt}));
 return {id,topic:c.topic,unitNumber:unit,title:topic.title,unit:`Unit ${unit}`,minutes:10,objective:c.objective,nodes:topic.nodes,source:`${framework.source}#page=${topic.pdf_page}`,labKind:c.sim,
  steps:[
   {id:'explain',type:'explain',title:topic.title,body:c.explanation,view:view(),cues},
   {id:'predict',type:'question',title:'Make a prediction',...assessment(c.predict,index%3),view:view(.12)},
   {id:'experiment',type:'experiment',title:config.prompt,body:'Record a prediction, run a comparison, and use the observed result to explain the mechanism. Keep the listed assumptions in view when extending your conclusion.',view:view(),cues},
   {id:'example',type:'explain',title:'Work through an example',body:c.example,view:view(.5),cues},
   {id:'transfer',type:'question',title:'Apply the idea in a new case',...assessment(c.transfer,(index+1)%3),view:view(.1)},
   {id:'recall',type:'recall',title:'Reconstruct the explanation',prompt:c.recall,rubric:c.rubric,sample:c.sample,view:view(0,false)},
  ]};
});
export const focusedTopicMap={membranes:['2.4','2.5','2.6'],gradient:['3.5'],light:['3.4'],selection:['7.1','7.2'],replication:['6.2'],translation:['6.4'],polypeptide:['1.7','6.4']};
