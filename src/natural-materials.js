import * as THREE from 'three';
import {surface} from './surfaces.js';

// Unmodified photographic maps, stored locally. See public/textures/natural/sources.json.
const maps=new Map(),materials=new Map(),loader=new THREE.TextureLoader();
function texture(asset,channel,repeat){
 const key=`${asset}:${channel}:${repeat}`;
 if(!maps.has(key)){
  const map=loader.load(`/textures/natural/${asset}_${channel}.jpg`);
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(...repeat);map.anisotropy=8;
  if(channel==='Diffuse')map.colorSpace=THREE.SRGBColorSpace;
  maps.set(key,map);
 }
 return maps.get(key);
}
export function naturalMaterial(kind,{repeat=[1,1],color='#ffffff',vertexColors=false}={}){
 const asset=kind==='bark'?'bark_brown_02':kind==='soil'?'forest_ground_04':'forrest_ground_01',key=`${kind}:${repeat}:${color}:${vertexColors}`;
 if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({
  color,vertexColors,map:texture(asset,'Diffuse',repeat),normalMap:texture(asset,'nor_gl',repeat),
  roughnessMap:texture(asset,'Rough',repeat),roughness:1,normalScale:new THREE.Vector2(kind==='bark'?.65:.4,kind==='bark'?.65:.4),
  side:THREE.DoubleSide,
 }));
 return materials.get(key);
}

// A thin leaf transmits some light from its reverse face. Keep this local to
// botanical surfaces; cell cutaways and molecular materials use their usual BRDF.
export function foliageMaterial(color){
 const key=`foliage:${color}`;
 if(!materials.has(key)){
  const material=surface(color,'foliage',{roughness:.83,bumpScale:.0007,clearcoat:0}).clone();
  material.shadowSide=THREE.FrontSide;
  material.onBeforeCompile=shader=>{
   const physical=THREE.ShaderChunk.lights_physical_pars_fragment.replace(
    'reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );',
    `reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
     float backlight = max(0.0, -dot(geometryNormal, directLight.direction));
     reflectedLight.directDiffuse += 0.24 * backlight * directLight.color * BRDF_Lambert(material.diffuseContribution);`
   );
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',physical);
   shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
    #if NUM_HEMI_LIGHTS > 0
     // Diffuse skylight passing through the opposite side of a thin leaf.
     vec3 leafSky = getHemisphereLightIrradiance(hemisphereLights[0], -geometryNormal);
     reflectedLight.indirectDiffuse += leafSky * BRDF_Lambert(material.diffuseContribution) * 0.55;
    #endif`);
  };
  material.customProgramCacheKey=()=> 'botanical-thin-leaf-v2';
  materials.set(key,material);
 }
 return materials.get(key);
}
