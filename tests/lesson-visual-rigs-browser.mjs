// Runs against the Vite development server to inspect real Three.js objects.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const p=await browser.newPage();
 await p.route('**/model-rig-check',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Model rig checks</title>'}));
 await p.goto((process.env.TEST_DEV_URL||'http://127.0.0.1:5174/')+'model-rig-check');
 const result=await p.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js');
  const {makeCellularLesson}=await import('/src/course/cellular-models.js');
  const {detailedBuilders}=await import('/src/detailed-models.js');
  const {cloneForView}=await import('/src/surfaces.js');
  const {sampleLab}=await import('/src/course/labs.js');
  const owner={...detailedBuilders,root:new THREE.Group(),annotations:[],annotation(text,position,options){this.annotations.push({element:document.createElement('span'),position:new THREE.Vector3(...position),...options});}};
  makeCellularLesson.call(owner,'cascade','signal');
  // Exercise the same material ownership boundary as the real scene cache.
  const copies=new Map();owner.root.traverse(o=>{if(o.material){if(!copies.has(o.material))copies.set(o.material,cloneForView(o.material));o.material=copies.get(o.material);}});
  const molecules=name=>{const all=[];owner.root.traverse(o=>{if(o.name===name)all.push(o)});return all;};
  const colors=()=>molecules('signal-target').map(m=>m.material.color.getHexString());
  owner.processRig.update(sampleLab('cascade',.5));const partial=colors();
  owner.processRig.update(sampleLab('cascade',1,'blocked'));const blocked=colors();
  owner.processRig.update(sampleLab('cascade',1,'bypass'));const bypass=colors(),relays=molecules('signal-relay').map(m=>m.material.color.getHexString());
  owner.processRig.update(sampleLab('cascade',.5));const restored=colors();
  return {partial,blocked,bypass,relays,restored};
 });
 assert.equal(new Set(result.partial).size,2,'Only activated targets should change color');
 assert.equal(result.partial.filter(c=>c==='60b8b9').length,2);
 assert.ok(result.blocked.every(c=>c==='8094a0'));
 assert.ok(result.bypass.every(c=>c==='60b8b9'));
 assert.ok(result.relays.every(c=>c==='8094a0'),'Bypass must not falsely activate blocked relays');
 assert.deepEqual(result.restored,result.partial,'Backward scrubbing restores per-molecule state');
 console.log('PASS Independent target activation survives cached material cloning; blocked and bypass states remain distinct');
}finally{await browser.close()}
