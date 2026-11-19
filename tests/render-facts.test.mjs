import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {cloneForView} from '../src/surfaces.js';
import {sampleProcess} from '../src/processes.js';

test('Scene material copies preserve custom shading without sharing fade state',()=>{
 const original=new THREE.MeshPhysicalMaterial({opacity:.8,transparent:true,depthWrite:false});
 original.onBeforeCompile=shader=>{shader.fragmentShader+='\n// botanical transmission';};
 original.customProgramCacheKey=()=> 'botanical-transmission';
 const copy=cloneForView(original),shader={fragmentShader:''};copy.onBeforeCompile(shader);
 assert.match(shader.fragmentShader,/botanical transmission/);assert.equal(copy.customProgramCacheKey(),'botanical-transmission');
 copy.opacity=.2;assert.equal(original.opacity,.8);assert.equal(copy.userData.originalOpacity,.8);assert.equal(copy.userData.originalDepthWrite,false);
});
test('Displayed reaction facts distinguish binding, bond change and proton return',()=>{
 assert.equal(sampleProcess('catalysis',.35).phase,1);
 assert.equal(sampleProcess('catalysis',.55).phase,2);
 assert.equal(sampleProcess('catalysis',.82).phase,3);
 assert.equal(sampleProcess('chemiosmosis',.5).phase,1);
 assert.equal(sampleProcess('chemiosmosis',.65).phase,2);
 assert.equal(sampleProcess('chemiosmosis',.85).phase,3);
});
