import {writeFile} from 'node:fs/promises';
import {courseLessons,framework} from '../src/course/lessons.js';
import {labs} from '../src/course/labs.js';
const rows=framework.topics.map(topic=>{
 const lesson=courseLessons.find(l=>l.topic===topic.id);
 if(!lesson)throw new Error(`Missing topic lesson ${topic.id}`);
 return {unit:lesson.unitNumber,topic:topic.id,title:topic.title,lesson:lesson.id,status:'lesson_available',model:labs[lesson.labKind].visual,experiment:lesson.labKind,relatedLearningObjectives:topic.objectives,relatedNodes:lesson.nodes,source:lesson.source};
});
const report={course:framework.course,academicYear:framework.year,edition:framework.edition,checkedOn:framework.checkedOn,scope:framework.scope,lessonCount:rows.length,units:framework.units,sources:[framework.source,framework.changes,framework.corrections],topics:rows};
await writeFile('public/data/lesson-coverage.json',JSON.stringify(report,null,2)+'\n');
const fields=['unit','topic','title','lesson','status','model','experiment','relatedLearningObjectives','relatedNodes','source'];
const quote=x=>'"'+String(Array.isArray(x)?x.join('; '):x).replaceAll('"','""')+'"';
await writeFile('public/data/lesson-coverage.csv',[fields.join(','),...rows.map(row=>fields.map(k=>quote(row[k])).join(','))].join('\n')+'\n');
console.log(`Lesson coverage: ${rows.length} topics across ${Object.keys(framework.units).length} units`);
