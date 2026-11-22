import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,framework} from '../src/lessons.js';
import {extraQuestions,extraByLesson} from '../src/lesson-practice/questions.js';
import {visualActivities} from '../src/lesson-practice/visual-data.js';
import {glyph} from '../src/lesson-practice/glyphs.js';
import {VISUAL_KEY,visualKey,loadVisual,saveVisual,visualRecord,validPlacement,placePart,scorePlacement,checkVisual,revealVisual} from '../src/lesson-practice/progress.js';
import {loadPractice,savePractice,practiceRecord,submitPractice,recordKey} from '../src/practice/progress.js';
import {frqQuestions} from '../src/practice/frqs.js';
import * as THREE from 'three';
import {makeCourseModel} from '../src/course/models.js';
import {sampleLab} from '../src/course/labs.js';
import {makeLessonPuzzle} from '../src/lesson-practice/model.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};};

test('All 67 lessons add an original, mapped question and four-part label/build activities',()=>{
 assert.equal(extraQuestions.length,67);assert.equal(Object.keys(visualActivities).length,67);
 const keys=[0,0,0,0],prompts=new Set(),ids=new Set();
 for(const l of lessons){
  const q=extraByLesson[l.id],a=visualActivities[l.id];assert.ok(q&&a,l.id);
  assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.text)).size,4);
  assert.equal(q.options.filter(o=>o.id===q.correct).length,1);
  assert.ok(q.options.every(o=>o.feedback.length>20));assert.ok(q.version&&a.version);
  keys[q.options.findIndex(o=>o.id===q.correct)]++;prompts.add(q.prompt);ids.add(q.id);
  for(const item of [q,a]){const topic=framework.topics.find(t=>t.id===item.topic);assert.ok(topic);assert.deepEqual(item.nodes,topic.nodes);assert.ok(item.source.endsWith(`#page=${topic.pdf_page}`));}
  assert.equal(a.parts.length,4);assert.equal(a.slots.length,4);
  assert.equal(new Set(a.parts.map(p=>p.id)).size,4);assert.ok(a.parts.every(p=>p.label.length));
  for(const p of a.parts){assert.ok(glyph(p.shape).length>30,`${a.id}: ${p.shape}`);assert.ok(p.role.length>20&&p.explanation.length>20);assert.ok(p.point.every(Number.isFinite));}
  const solution=Object.fromEntries(a.slots.map((s,i)=>[s.id,a.parts[i].id]));assert.equal(scorePlacement(a,solution).length,4);
  assert.ok(a.slots.every(s=>s.accepts.every(id=>a.parts.some(p=>p.id===id))));
 }
 assert.equal(prompts.size,67);assert.equal(ids.size,67);assert.ok(Math.max(...keys)-Math.min(...keys)<=1);
 assert.notEqual(glyph('helix'),glyph('dna'),'protein secondary structure is distinct from paired DNA');
 assert.notEqual(glyph('dna'),glyph('two-dna'));
});

test('New quantitative and sequence answers agree with independent solutions',()=>{
 const key=id=>extraQuestions.find(q=>q.id===`lesson-extra-${id}`).options.find(o=>o.id==='o0').text;
 assert.equal(key('1.3'),['Zero','One','Two','Three','Four','Five','Six'][6-1]);
 const complement={A:'T',T:'A',G:'C',C:'G'};assert.ok(key('1.6').includes([...('AGTC')].reverse().map(x=>complement[x]).join('')));
 assert.equal((4*Math.PI*2**2/(4/3*Math.PI*2**3))/(4*Math.PI/(4/3*Math.PI)),.5);assert.match(key('2.2'),/one-half/);
 assert.equal(key('3.3'),`${12-20} kJ/mol`.replace('-','−'));
 assert.equal(key('4.5'),`${6} chromosomes and ${6*2} DNA molecules`);
 assert.match(key('5.1'),new RegExp(`^${8/2} chromosomes, each still consisting of two sister`));
 assert.equal(key('5.2'),String(2**3));
 const code={AUG:'Met',GCU:'Ala',UAA:null};assert.equal(key('6.4'),['AUG','GCU','UAA'].map(c=>code[c]).filter(Boolean).join('–'));
 assert.equal(key('6.8'),String(3*2**4));assert.equal(key('7.5'),String(Number((2*.2*.8).toFixed(2))));
 assert.match(key('8.2'),new RegExp(String(20000*.1*.2)));assert.match(key('8.3'),new RegExp(String(18-10+7-3)));
 assert.ok(.1*110*(1-110/100)<0);assert.match(key('8.4'),/^Negative/);
 assert.match(key('polypeptide'),/A-site/);assert.match(key('replication'),/one parental strand and one new strand/);
});

test('Placement is one-to-one, supports revision, and accepts equivalent Punnett heterozygotes',()=>{
 const a=visualActivities['topic-2-1'],data=loadVisual(),r=visualRecord(data,a,'build');
 assert.equal(checkVisual(a,r),false);assert.equal(revealVisual(a,r),false);
 assert.equal(placePart(a,r,'unknown','s0'),false);
 placePart(a,r,'p0','s0');placePart(a,r,'p0','s1');assert.deepEqual(r.placements,{s1:'p0'});
 placePart(a,r,'p1','s1');assert.deepEqual(r.placements,{s1:'p1'});
 assert.deepEqual(validPlacement(a,{s0:'p0',s1:'p0',s2:'unknown',other:'p3'}),{s0:'p0'});
 for(const topic of ['5-3','5-4','7-5']){const p=visualActivities[`topic-${topic}`];assert.equal(scorePlacement(p,{s0:'p0',s1:'p2',s2:'p1',s3:'p3'}).length,4);}
});

test('First visual attempts, assisted solutions, drafts and earlier versions survive reload independently',()=>{
 const storage=memory(),data=loadVisual(storage),a=visualActivities.replication,r=visualRecord(data,a,'label');
 for(let i=0;i<4;i++)placePart(a,r,`p${(i+1)%4}`,`s${i}`);
 assert.ok(checkVisual(a,r,10));assert.equal(checkVisual(a,r,11),false);assert.equal(r.attempts[0].correctSlots.length,0);
 const first=structuredClone(r.attempts[0]);
 for(let i=0;i<4;i++)placePart(a,r,`p${i}`,`s${i}`);
 assert.ok(checkVisual(a,r,12));assert.equal(r.attempts[1].correctSlots.length,4);assert.deepEqual(r.attempts[0],first);
 assert.ok(revealVisual(a,r));assert.equal(r.attempts[2].assisted,true);assert.equal(r.attempts[0].assisted,false);
 const build=visualRecord(data,a,'build');placePart(a,build,'p2','s0');assert.equal(build.attempts.length,0);
 const changed={...a,version:2,title:'A revised representation'};assert.equal(visualRecord(data,changed,'label').attempts.length,0);
 saveVisual(storage,data);const loaded=loadVisual(storage);
 assert.deepEqual(loaded.records[visualKey(a,'label')].attempts[0],first);
 assert.equal(loaded.records[visualKey(a,'build')].placements.s0,'p2');assert.equal(loaded.records[visualKey(a,'label')].snapshot.title,a.title);
 assert.equal(saveVisual({setItem(){throw Error('blocked');}},data),false);
 for(const raw of ['{invalid','null','[]','{"version":1,"records":[]}'])assert.deepEqual(loadVisual({getItem:()=>raw}),{version:1,records:{}});
 storage.setItem(VISUAL_KEY,JSON.stringify({version:1,records:{[visualKey(a,'label')]:{snapshot:a,placements:{s0:'p0',s1:'p0'},attempts:[null,{}],checked:true}}}));
 const repaired=visualRecord(loadVisual(storage),a,'label');assert.deepEqual(repaired.placements,{s0:'p0'});assert.equal(repaired.checked,false);
});

test('Additional MCQ attempts coexist with existing FRQ drafts and preserve original mistakes',()=>{
 const storage=memory(),data=loadPractice(storage),q=extraByLesson.replication,f=frqQuestions[0];
 const fr=practiceRecord(data,f);fr.draft[0]='My existing response';
 const r=practiceRecord(data,q);r.choice=q.options.find(o=>o.id!==q.correct).id;assert.ok(submitPractice(data,q,10));r.reviewing=false;r.choice=q.correct;assert.ok(submitPractice(data,q,20));
 savePractice(storage,data);const saved=loadPractice(storage);assert.equal(saved.records[recordKey(f)].draft[0],'My existing response');assert.deepEqual(saved.records[recordKey(q)].submissions.map(s=>s.correct),[false,true]);
});

test('A cached phylogeny keeps its own moving labels when another model replaces builder state',()=>{
 const host={root:new THREE.Group(),annotations:[],annotation(text,point){this.annotations.push({element:{textContent:text},position:new THREE.Vector3(...point)});}};
 makeCourseModel.call(host,{topic:'7.9'});const rig=host.processRig,labels=host.annotations;
 host.annotations=[]; // A puzzle or another lesson is now the most recently built view.
 rig.update(sampleLab('phylogeny',1,'rotated'));
 assert.ok(Math.abs(labels.find(x=>x.element.textContent==='A').position.x-(-.1))<1e-12);
 assert.ok(Math.abs(labels.find(x=>x.element.textContent==='B').position.x-(-2))<1e-12);
 rig.update(sampleLab('phylogeny',0,'normal'));
 assert.equal(labels.find(x=>x.element.textContent==='A').position.x,-2);
});

test('Selecting one 3D piece and marking one correct target do not recolor their neighbors',()=>{
 const a=visualActivities['topic-2-1'],activity={...a,sequence:false,parts:a.parts.map(p=>({...p,shape:'water'}))};
 const host={root:new THREE.Group(),annotation(){}};makeLessonPuzzle.call(host,{activity});
 host.processRig.place({s0:'p0'},'p0',['s0']);const pieces=[],rings=[];
 host.root.traverse(o=>{if(o.userData.lessonPiece)pieces.push(o);if(o.geometry?.type==='TorusGeometry')rings.push(o);});
 assert.ok(pieces.filter(p=>p.userData.lessonPiece==='p0').every(p=>p.material.emissive.getHexString()==='456f50'));
 assert.ok(pieces.filter(p=>p.userData.lessonPiece!=='p0').every(p=>p.material.emissive.getHexString()==='000000'));
 assert.equal(rings.find(p=>p.userData.lessonSlot==='s0').material.color.getHexString(),'507c57');
 assert.ok(rings.filter(p=>p.userData.lessonSlot!=='s0').every(p=>p.material.color.getHexString()==='b35d40'));
 host.processRig.place({},null,null);assert.ok(rings.every(p=>p.material.color.getHexString()==='99aa99'));
});
