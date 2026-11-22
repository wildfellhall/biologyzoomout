import test from 'node:test';
import assert from 'node:assert/strict';
import {apportion,ecologyDisplay,transportPositions} from '../src/course/visual-state.js';
import {sampleLab,labs} from '../src/course/labs.js';

test('Representative ecology cohorts conserve the displayed total, including rare variants and extinction',()=>{
 for(const n of [0,1,16,30,40])for(const w of [[.25,.5,.25],[.02,.98],[.333,.333,.334],[0,0,1]]){
  const c=apportion(n,w);assert.equal(c.reduce((a,b)=>a+b,0),n);assert.ok(c.every((x,i)=>Number.isInteger(x)&&x>=0&&(!w[i]?x===0:true)));
 }
 assert.deepEqual(ecologyDisplay('resistance',sampleLab('resistance',1,'absent')).counts,[0,30]);
 assert.deepEqual(ecologyDisplay('speciation',sampleLab('speciation',0)).left,[8,8]);
});
test('Ecological conditions change organisms and resources consistently with the existing quantitative models',()=>{
 assert.equal(ecologyDisplay('population-growth',sampleLab('population-growth',0)).rabbits,5);
 assert.ok(ecologyDisplay('logistic',sampleLab('logistic',1)).rabbits>ecologyDisplay('logistic',sampleLab('logistic',1,'habitat-loss')).rabbits);
 assert.deepEqual(ecologyDisplay('community',sampleLab('community',1,'removed')),{rabbits:8,foxes:0,shoots:4});
 assert.ok(ecologyDisplay('disturbance',sampleLab('disturbance',1,'enriched')).oxygen<ecologyDisplay('disturbance',sampleLab('disturbance',1)).oxygen);
});
test('Membrane particles are conserved and condition-dependent net transfer matches displayed counts',()=>{
 for(const kind of ['permeability','active-transport','channel','compartments'])for(const option of labs[kind].options){
  const start=transportPositions(kind,sampleLab(kind,0,option.id));const end=transportPositions(kind,sampleLab(kind,1,option.id));
  assert.equal(start.length,end.length);assert.ok(end.flat().every(Number.isFinite));
 }
 const below=(kind,condition,t=1)=>transportPositions(kind,sampleLab(kind,t,condition)).filter(p=>p[1]<0).length;
 assert.equal(below('channel','normal',0),4);assert.equal(below('channel','normal'),12);assert.equal(below('channel','closed'),4);
 assert.equal(below('active-transport','normal'),36);assert.equal(below('active-transport','no-atp'),24);
 assert.equal(below('permeability','ion'),0);
});
test('Energy-model switches distinguish light availability, carbon supply and oxygen',()=>{
 assert.equal(sampleLab('photosynthesis',1,'dark').energyInput,0);
 assert.equal(sampleLab('photosynthesis',1,'no-carbon').energyInput,1);
 assert.equal(sampleLab('photosynthesis',1,'no-carbon').value,0);
 assert.equal(sampleLab('respiration',1,'ferment').energyInput,0);
 assert.equal(sampleLab('respiration',1,'normal').energyInput,1);
});

test('Transport crosses continuously and an open channel retains balanced exchange at equilibrium',()=>{
 const t=.15+.7/(16*2),positions=transportPositions('permeability',sampleLab('permeability',t));
 assert.ok(Math.abs(positions[0][1])<1e-10,'A crossing tracer must pass through the membrane, not teleport');
 const early=transportPositions('channel',sampleLab('channel',.85)),late=transportPositions('channel',sampleLab('channel',1));
 assert.ok(early[0][1]<0&&late[0][1]>0);assert.ok(early[23][1]>0&&late[23][1]<0);
 assert.equal(early.filter(p=>p[1]<0).length,late.filter(p=>p[1]<0).length);
});
test('Downstream cascade activation follows reception and relay activation, and supports a bypass',()=>{
 assert.equal(sampleLab('cascade',.4).value,0);assert.ok(sampleLab('cascade',.6).value>0);
 assert.equal(sampleLab('cascade',1,'blocked').value,0);assert.equal(sampleLab('cascade',1,'bypass').value,20);
});
