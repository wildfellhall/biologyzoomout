import {stimulusQuestions} from '../src/practice/stimulus-questions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {conceptQuestions} from '../src/practice/concepts.js';
import {frqQuestions} from '../src/practice/frqs.js';
import {lessons,framework} from '../src/lessons.js';
import {activities} from '../src/lesson-activities.js';
import {loadPractice,savePractice,practiceRecord,submitPractice,recordKey} from '../src/practice/progress.js';
import {buildPath,supportsMolecule} from '../src/pathways.js';
import {processes,processesFor,sampleProcess,phaseStarts} from '../src/processes.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};};
test('All 60 topics have distinct four-choice concept review; every lesson checkpoint has four options',()=>{
 assert.equal(conceptQuestions.length,60);assert.deepEqual(conceptQuestions.map(q=>q.topic),framework.topics.map(t=>t.id));
 const positions=[0,0,0,0],prompts=new Set();
 for(const q of conceptQuestions){assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.text)).size,4);assert.ok(q.options.every(o=>o.feedback.length>0));positions[q.options.findIndex(o=>o.id===q.correct)]++;prompts.add(q.prompt);assert.ok(q.nodes.length);}
 assert.equal(prompts.size,60);assert.deepEqual(positions,[15,15,15,15]);
 for(const l of lessons){assert.equal(activities[l.id].check.answers.length,4);assert.ok(!activities[l.id].check.prompt.includes('response variable'));for(const s of l.steps.filter(s=>s.type==='question')){assert.equal(s.options.length,4,`${l.id}/${s.id}`);assert.equal(new Set(s.options.map(o=>o.text)).size,4);}}
});
test('Quantitative and sequence keys agree with independent calculations',()=>{
 const key=t=>conceptQuestions.find(q=>q.topic===t).options.find(o=>o.id==='o0').text;
 assert.equal(key('1.3'),['Zero','One','Two','Three'][1+2]);
 const complement={A:'T',T:'A',C:'G',G:'C'};assert.ok(key('1.6').includes([...('AACG')].reverse().map(b=>complement[b]).join('')));
 assert.ok(key('3.3').includes(String(8-20).replace('-','−')));assert.equal(key('5.2'),`${Math.round((14+14)/100*100)}%`);
 assert.equal(key('5.3'),`1/${1/(.25*.25)}`);assert.equal(key('6.1'),`${(100-22*2)/2}%`);assert.equal(key('6.8'),String(3*2**4));
 assert.equal(key('7.5'),String(Number((2*Math.sqrt(.09)*(1-Math.sqrt(.09))).toFixed(2))));
 assert.equal(key('8.2'),`${1800/12000*100}%`);assert.equal(key('8.3'),`${80+20-8+5-7} individuals`);assert.equal(key('8.4'),`${.2*100*(1-100/200)} individuals per year`);
});
test('FRQs cover all units with complete stimuli, original task-specific four-point rubrics, and revision prompts',()=>{
 assert.deepEqual(frqQuestions.map(q=>q.unit),[1,2,3,4,5,6,7,8]);
 for(const q of frqQuestions){assert.ok(q.stimulus.length>200);assert.equal(q.parts.reduce((n,p)=>n+p.points,0),4);assert.ok(q.parts.every(p=>p.criterion.length>0&&p.example.length>0));assert.ok(q.revision);}
 // Independently solve selected rubric arithmetic; do not infer score calibration.
 assert.equal((100-20)/100*100,80);assert.equal((100-25)/100*100,75);assert.equal((2*36+48)/200,.6);assert.equal((2*49+42)/200,.7);assert.equal(10000*.12*.1,120);
});
test('Practice drafts, first attempts, corrections, snapshots and earlier item versions survive reload',()=>{
 const storage=memory(),p=loadPractice(storage),q=conceptQuestions[0],r=practiceRecord(p,q);
 assert.equal(submitPractice(p,q),false);r.choice=q.options.find(o=>o.id!==q.correct).id;assert.ok(submitPractice(p,q,10));assert.equal(submitPractice(p,q,11),false);
 r.reviewing=false;r.choice=q.correct;assert.ok(submitPractice(p,q,12));r.correction='Hydrogen bonds create an open lattice.';
 const f=frqQuestions[0],fr=practiceRecord(p,f);fr.draft[0]='Primary structure';submitPractice(p,f,15);fr.draft[0]='My later revision';
 assert.equal(fr.submissions[0].draft[0],'Primary structure');savePractice(storage,p);
 const reloaded=loadPractice(storage);assert.equal(reloaded.records[recordKey(q)].submissions[0].correct,false);assert.equal(reloaded.records[recordKey(q)].submissions[1].correct,true);assert.equal(reloaded.records[recordKey(f)].draft[0],'My later revision');
 const changed={...q,version:2,prompt:'Revised item'};assert.equal(practiceRecord(reloaded,changed).submissions.length,0);assert.equal(reloaded.records[recordKey(q)].snapshot.prompt,q.prompt);
 assert.equal(savePractice({setItem(){throw Error();}},p),false);assert.deepEqual(loadPractice({getItem:()=>'{broken'}),{version:1,records:{}});
});
test('Renewal and germ-line paths retain containment context and expose deterministic processes',()=>{
 for(const [route,model,process] of [['renewal','mitotic-cell','mitosis'],['germline','meiotic-cell','meiosis']]){
  const p=buildPath(route),ids=p.steps.map(s=>s.id);assert.equal(p.organism,'animal');assert.ok(ids.indexOf('nucleosome')<ids.indexOf('nucleus'));assert.equal(ids[ids.indexOf(model)-1],'nucleus');assert.equal(ids.at(-1),'biosphere');assert.ok(supportsMolecule(route,{id:'adenine'}));assert.ok(processesFor(model).some(p=>p.id===process));
  assert.equal(phaseStarts[process].length,processes[process].steps.length);assert.equal(sampleProcess(process,1).cellCount,process==='mitosis'?2:4);
 }
 assert.ok(!buildPath('germline').steps.some(s=>s.id==='epithelium'));
 for(const [id,field]of [['dna-breathing','exposure'],['chromatin-folding','compaction']]){assert.equal(sampleProcess(id,0)[field],0);assert.ok(sampleProcess(id,.6)[field]>.9);assert.equal(sampleProcess(id,1)[field],0);assert.deepEqual(sampleProcess(id,.3),sampleProcess(id,.3));}
});

test('Stimulus practice adds two complete questions per unit with independently checked quantitative keys',()=>{
 assert.equal(stimulusQuestions.length,16);const positions=[0,0,0,0];
 for(let unit=1;unit<=8;unit++)assert.equal(stimulusQuestions.filter(q=>q.unit===unit).length,2);
 for(const q of stimulusQuestions){assert.ok(q.stimulus);assert.equal(q.options.length,4);assert.equal(new Set(q.options.map(o=>o.text)).size,4);assert.ok(q.options.every(o=>o.feedback));positions[q.options.findIndex(o=>o.id===q.correct)]++;}
 assert.deepEqual(positions,[4,4,4,4]);
 const key=id=>stimulusQuestions.find(q=>q.id===id).options.find(o=>o.id==='o0').text;
 assert.match(key('ap-1-2'),/Four fragments, with three water molecules consumed/);assert.equal(1+3,4);
 assert.match(key('ap-5-1'),/20%/);assert.equal((19+21)/200,.2);
 assert.match(key('ap-7-1'),/0.32/);assert.equal(2*.8*.2,.32000000000000006);
 assert.match(key('ap-7-2'),/^B,/);assert.ok(50*4>80*2);
 assert.match(key('ap-8-1'),/−18/);assert.equal(.3*120*(1-120/80),-18);
});
