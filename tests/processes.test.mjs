import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selectionSeries, predatorSeries, sampleProcess, diffusionPositions, processes } from '../src/processes.js';
import { structureInfo, cellParts, childrenOf } from '../src/structures.js';
import { modelInfo } from '../src/content.js';
import { pathwayInfo } from '../src/pathways.js';
import * as THREE from 'three';
import {replicationHelixPoint,replicationState} from '../src/reaction-state.js';

test('Selection preserves allele and genotype frequencies; environmental reversal changes the direction',()=>{
 for(const environment of ['favor-A','favor-a','neutral']){
  const series=selectionSeries(environment);
  for(const entry of series){
   assert.ok(Math.abs(entry.p+entry.q-1)<1e-12);
   for(const frequencies of [entry.zygotes,entry.survivors]){assert.ok(frequencies.every(f=>f>=0&&f<=1));assert.ok(Math.abs(frequencies.reduce((a,b)=>a+b)-1)<1e-12);}
   if(environment==='neutral')assert.ok(Math.abs(entry.p-.35)<1e-12);
  }
  if(environment==='favor-A')assert.ok(series.at(-1).p>.9);
  if(environment==='favor-a')assert.ok(series.at(-1).p<.02);
 }
});

test('Predator-prey integration stays positive and converges as the time step is halved',()=>{
 const coarse=predatorSeries(30,.025),fine=predatorSeries(30,.0125);
 assert.ok(coarse.every(p=>p.prey>0&&p.predator>0&&Number.isFinite(p.prey+p.predator)));
 assert.ok(Math.abs(coarse.at(-1).prey-fine.at(-1).prey)<.001);
 assert.ok(Math.abs(coarse.at(-1).predator-fine.at(-1).predator)<.001);
 const maximumPrey=coarse.reduce((best,p)=>p.prey>best.prey?p:best);
 const nextPredatorPeak=coarse.find((p,i)=>p.t>maximumPrey.t&&i>0&&i<coarse.length-1&&p.predator>coarse[i-1].predator&&p.predator>coarse[i+1].predator);
 assert.ok(nextPredatorPeak,'predator peak follows the prey peak');
});

test('Diffusion conserves all 24 rendered particles, with both directions of crossing and no leak through the bilayer',()=>{
 for(let i=0;i<=100;i++){
  const s=sampleProcess('diffusion',i/100),positions=diffusionPositions(i/100);
  assert.equal(s.top+s.bottom,24);assert.equal(positions.length,24);
  assert.equal(s.top,positions.filter(p=>p[1]>=0).length);
  for(const [x,y,z]of positions){assert.ok([x,y,z].every(Number.isFinite));if(Math.abs(y)<.8)assert.ok(Math.hypot(x,z)<.01);}
 }
 assert.equal(sampleProcess('diffusion',0).top,20);assert.equal(sampleProcess('diffusion',1).top,12);
 assert.ok(diffusionPositions(0)[22][1]<0&&diffusionPositions(1)[22][1]>0);
});

test('Scrubbing is deterministic in both directions and succession grows from retained soil',()=>{
 for(const id of Object.keys(processes))for(const t of [0,.28,.6,1]){const first=sampleProcess(id,t);sampleProcess(id,1-t);assert.deepEqual(sampleProcess(id,t),first);}
 assert.equal(sampleProcess('succession',0).trees,0);assert.equal(sampleProcess('succession',1).trees,1);
 assert.ok(sampleProcess('succession',.2).grass>sampleProcess('succession',1).grass);
});

test('All inspectable structures and animation models resolve without changing ontology IDs',()=>{
 const nodes=new Set(JSON.parse(fs.readFileSync(new URL('../public/data/ontology.json',import.meta.url))).nodes.map(n=>n.id));
 for(const info of Object.values({...structureInfo,...pathwayInfo}))for(const id of info.nodes)assert.ok(nodes.has(id),id);
 for(const id of [...Object.keys(structureInfo),...Object.keys(cellParts)])for(const child of childrenOf(id))assert.ok(structureInfo[child]||modelInfo[child]||pathwayInfo[child],child);
 for(const process of Object.values(processes))for(const id of process.models)assert.ok(structureInfo[id]||modelInfo[id]||pathwayInfo[id],id);
 assert.ok(cellParts['plant-cell'].includes('mitochondrion'));
 assert.ok(!cellParts['animal-cell'].includes('chloroplast'));
});

test('DNA is right-handed; synthesis follows the fork while fragments extend oppositely',()=>{
 const first=new THREE.Vector3(...replicationHelixPoint(0,0)),next=new THREE.Vector3(...replicationHelixPoint(1,0));
 assert.ok(next.y>first.y);first.y=next.y=0;
 assert.ok(new THREE.Vector3().crossVectors(first,next).y>0);
 for(let i=0;i<=100;i++){
  const s=replicationState(i/100);
  assert.ok(s.leading<=s.unwound);
  assert.ok(s.lagging.every(index=>index<s.unwound));
  for(const f of s.fragments)assert.ok(f.indices.every((index,j)=>!j||index<f.indices[j-1]));
 }
 const complete=replicationState(1);assert.equal(complete.leading,28);assert.equal(complete.lagging.length,28);assert.equal(complete.sealed,true);
});
