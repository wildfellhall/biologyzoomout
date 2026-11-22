import {makeLessonPuzzle} from './lesson-practice/model.js';
import {makeCourseModel} from './course/models.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ModelBuilders, disposeModel } from './model-builders.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { detailedBuilders } from './detailed-models.js';
import { landscapeBuilders } from './landscapes.js';
import { structureInfo } from './structures.js';
import {featureNotes,hoverExplanation} from './field-notes.js';
import {cloneForView} from './surfaces.js';
import { processes, sampleProcess } from './processes.js';
import { pathwayBuilders, makeThylakoid, makeCircularDNA } from './pathway-models.js';
export { elements } from './model-builders.js';
Object.assign(ModelBuilders.prototype,detailedBuilders,landscapeBuilders);
ModelBuilders.prototype.makeCircularDNA=makeCircularDNA;

const clamp = (value,max) => Math.max(0, Math.min(max, value));
const smooth = (a, b, value) => THREE.MathUtils.smoothstep(value, a, b);

export class BiologyScene extends ModelBuilders {
  constructor(container, { onSelect, onPosition, onZoom, onError, onProcess }) {
    super();
    Object.assign(this, { container, onSelect, onPosition, views: new Map(), definitions: [], position: 0, targetPosition: 0, elapsed: 0, labelsVisible: false, flowVisible: false, molecularStyle: 'ball' });
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.paused = this.reducedMotion;
    this.onProcess=onProcess;this.process=null;this.processProgress=0;this.processPlaying=false;this.environment='favor-a';this.processRate=1;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, .08, 180);
    this.camera.position.set(3, 2, 12);
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (error) { onError(error); return; }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.05;
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const environment=new RoomEnvironment();
    const generator=new THREE.PMREMGenerator(this.renderer);
    this.environmentMap=generator.fromScene(environment,.04);
    this.scene.environment=this.environmentMap.texture;this.scene.environmentIntensity=.32;
    environment.dispose();generator.dispose();
    const canvas = this.renderer.domElement;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '3D biology model. Drag to rotate; scroll or pinch to change scale.');
    container.prepend(canvas);
    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'model-labels';
    this.labelLayer.hidden = true;
    container.append(this.labelLayer);
    this.hoverLabel=document.createElement('div');this.hoverLabel.className='hover-label';this.hoverLabel.hidden=true;container.append(this.hoverLabel);
    this.skyLight=new THREE.HemisphereLight('#c8dcf2', '#1e242a', .68);this.scene.add(this.skyLight);this.directionalLights=[];
    for (const [color, intensity, position] of [['#ffe9d2', 3.5, [-4,7,7]], ['#86bdd7',2.4,[5,2,-5]], ['#b1cbd7',.55,[4,-2,5]]]) {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(...position);
      if(intensity===3.5){light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:30});light.shadow.bias=-.00025;light.shadow.normalBias=.018;light.shadow.radius=2;}
      this.scene.add(light);
      this.directionalLights.push(light);
    }
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: .07, enablePan: false, enableZoom: false, autoRotate: !this.paused, autoRotateSpeed: .3 });
    this.controls.touches.TWO = THREE.TOUCH.PAN;
    this.raycaster = new THREE.Raycaster();
    let pointerStart, pinchDistance = null, wasPinch = false;
    canvas.addEventListener('pointerdown', event => { pointerStart = [event.clientX, event.clientY]; if (event.pointerType !== 'touch') wasPinch = false; });
    canvas.addEventListener('pointerup', event => {
      if (wasPinch || !pointerStart || Math.hypot(event.clientX-pointerStart[0],event.clientY-pointerStart[1]) > 5 || !this.activeView) return;
      const hit=this.pick(event);
      if (hit) onSelect(hit.object.userData);
    });
    canvas.addEventListener('pointermove',event=>{
      if(event.buttons||event.pointerType==='touch') {this.clearHover();return;}
      const hit=this.pick(event);this.clearHover();
      if(!hit)return;
      const data=hit.object.userData;
      if(data.inspect||data.feature||data.lessonPiece||data.lessonSlot){
        this.hovered=hit.object;const material=hit.object.material;
        if(material.emissive){this.hoverEmissive=material.emissive.clone();material.emissive.set('#61784c');material.emissiveIntensity=.2;}
        this.hoverLabel.replaceChildren();const name=document.createElement('strong'),explanation=document.createElement('span');
        name.textContent=`${featureNotes[data.feature]?.name||data.label||data.inspect} ↗`;explanation.textContent=hoverExplanation(data);
        this.hoverLabel.append(name);if(explanation.textContent)this.hoverLabel.append(explanation);
        this.hoverLabel.style.left=`${Math.max(10,Math.min(event.clientX+16,innerWidth-275))}px`;
        this.hoverLabel.style.top=`${Math.max(5,Math.min(event.clientY-container.getBoundingClientRect().top+16,container.clientHeight-100))}px`;
        this.hoverLabel.hidden=false;canvas.style.cursor='pointer';
      }
    });
    canvas.addEventListener('pointerleave',()=>this.clearHover());
    canvas.addEventListener('touchstart', event => {
      if (event.touches.length === 1) wasPinch = false;
      if (event.touches.length === 2) { wasPinch = true; pinchDistance = this.touchDistance(event); }
    }, { passive: true });
    canvas.addEventListener('touchmove', event => {
      if (event.touches.length !== 2 || pinchDistance === null) return;
      event.preventDefault();
      const next = this.touchDistance(event);
      onZoom(Math.log(pinchDistance/next)*1.8);
      pinchDistance = next;
    }, { passive: false });
    canvas.addEventListener('touchend', () => { pinchDistance = null; });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
    this.previous = performance.now();
    this.frame();
  }

  pick(event) {
    if(!this.activeView)return null;
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),this.camera);
    return this.raycaster.intersectObjects(this.activeView.root.children,true).find(item=>{
      let o=item.object;while(o){if(!o.visible)return false;o=o.parent;}
      return item.object.userData.lessonPiece||item.object.userData.lessonSlot||item.object.userData.feature||item.object.userData.inspect||item.object.userData.node||item.object.userData.atom;
    });
  }
  clearHover(){if(this.hovered?.material.emissive&&this.hoverEmissive)this.hovered.material.emissive.copy(this.hoverEmissive);this.hovered=null;if(this.hoverLabel)this.hoverLabel.hidden=true;if(this.renderer)this.renderer.domElement.style.cursor='grab';}
  focus(definition){this.clearHover();this.focusDefinition=definition;this.setProcess(null);if(this.renderer){this.renderJourney();this.resetView();}}
  setProcess(id){this.process=id;this.experimentOptions={};this.processProgress=0;this.processPlaying=false;this.applyProcess();}
  setExperiment(options={}){this.experimentOptions={...options};this.processProgress=0;this.applyProcess();}
  seekProcess(t){this.processProgress=Math.max(0,Math.min(1,t));this.applyProcess();}
  playProcess(value){if(value&&this.processProgress>=1)this.processProgress=0;this.processPlaying=value;this.applyProcess();}
  setEnvironment(value){this.environment=value;this.processProgress=0;this.applyProcess();}
  applyProcess(){
    const snapshot=this.process?sampleProcess(this.process,this.processProgress,this.environment,this.experimentOptions):null;
    this.processSnapshot=snapshot;
    this.activeView?.processRig?.update(snapshot);
    const view=this.activeView;
    if(view){const bounds=snapshot?view.processBounds:view.baseBounds;view.content.position.copy(bounds.center).negate();view.normalized.scale.setScalar(3.1/bounds.radius);}
    if(this.focusDefinition?.id==='lesson-lab'||['nucleosome','chromatin','mitotic-cell','meiotic-cell','rough-er','smooth-er','golgi'].includes(this.activeView?.id))this.fitCamera();
    if(this.controls)this.controls.autoRotate=!this.paused&&!this.process&&!this.labelsVisible;
    this.onProcess?.(snapshot,this.processPlaying);
    if(this.labelLayer)this.labelLayer.hidden=!(this.labelsVisible||snapshot);
  }

  touchDistance(event) {
    return Math.hypot(event.touches[0].clientX-event.touches[1].clientX,event.touches[0].clientY-event.touches[1].clientY);
  }

  updateLighting(){
    const habitat=this.activeView?.processRig?.lighting==='habitat'||['plant','rabbit','tree','population','rabbit-population','tree-population','community','ecosystem'].includes(this.activeView?.id);
    this.container.dataset.lighting=habitat?'habitat':'scientific';
    this.scene.environment=habitat&&this.outdoorEnvironment?this.outdoorEnvironment.texture:this.environmentMap.texture;
    this.scene.environmentIntensity=habitat?.55:.32;
    this.skyLight.color.set(habitat?'#e7eadf':'#c8dcf2');this.skyLight.groundColor.set(habitat?'#74644c':'#1e242a');this.skyLight.intensity=habitat?.8:.68;
    this.directionalLights.forEach((light,i)=>light.intensity=(habitat?[2.3,.65,.4]:[3.5,2.4,.55])[i]);
    const shadow=this.directionalLights[0].shadow;shadow.normalBias=habitat?.01:.018;shadow.bias=habitat?-.0001:-.00025;
    if(habitat&&!this.outdoorLoading){
      this.outdoorLoading=true;
      new HDRLoader().load('/textures/natural/forest_slope_hdri.hdr',texture=>{
        if(this.disposed){texture.dispose();return;}
        const generator=new THREE.PMREMGenerator(this.renderer);this.outdoorEnvironment=generator.fromEquirectangular(texture);generator.dispose();texture.dispose();this.updateLighting();
      });
    }
  }

  resize() {
    if (!this.renderer) return;
    const {width,height} = this.container.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width,height);
    this.camera.aspect = width/height;
    this.camera.updateProjectionMatrix();
    this.fitCamera();
    this.controls?.update();
  }

  fitCamera() {
    // A narrow, upright plant does not need the wide-scene clearance used by cells and terrain.
    const lower=Math.floor(this.position),fraction=this.focusDefinition?0:this.position-lower;
    const first=this.focusDefinition||this.definitions[lower],next=this.definitions[lower+1]||first;
    const width=id=>id==='plant'?.7:1;
    const widthFraction=THREE.MathUtils.lerp(width(first?.id),width(next?.id),smooth(0,1,fraction));
    const bounds=this.process?this.activeView?.processBounds:this.activeView?.baseBounds;
    const extent=bounds?.size?.clone().multiplyScalar(3.1/bounds.radius);
    const detailed=['nucleosome','chromatin','mitotic-cell','meiotic-cell','rough-er','smooth-er','golgi'].includes(first?.id);
    const distance=(['lesson-lab','lesson-puzzle'].includes(first?.id)||detailed)&&extent
      ?8*(this.activeView?.processRig?.cameraScale||1)*Math.max(1,(extent.y+.2*extent.z)/4.5,(extent.x+.2*extent.z)/(4.5*this.camera.aspect))
      :11.5*Math.max(1,widthFraction/this.camera.aspect);
    this.camera.position.normalize().multiplyScalar(distance);
  }

  setDefinitions(definitions) {
    this.definitions=definitions;this.focusDefinition=null;
    this.position=clamp(this.position,definitions.length-1);this.targetPosition=clamp(this.targetPosition,definitions.length-1);
    if(this.renderer)this.renderJourney();
  }

  seek(position, immediate = false) {
    this.targetPosition = clamp(position,this.definitions.length-1);
    if (immediate || this.reducedMotion || !this.renderer) {
      this.position = this.targetPosition;
      if (this.renderer) this.renderJourney();
      this.onPosition(this.position);
    }
  }

  resetView() {
    if (!this.renderer) return;
    this.camera.position.set(3,2,12);
    this.controls.target.set(0,0,0);
    this.resize();
  }
  setPaused(value) { this.paused=value; if (this.controls) this.controls.autoRotate=!value&&!this.process&&!this.labelsVisible; }
  setLabels(value) {
    this.labelsVisible=value;if(this.labelLayer)this.labelLayer.hidden=!(value||this.process);
    if(this.controls){this.controls.autoRotate=!this.paused&&!this.process&&!value;if(value){this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=true;}}
  }
  setFlow(value) { this.flowVisible=value; for (const view of this.views.values()) for (const flow of view.flows) flow.visible=value; }
  setStyle(value) { this.molecularStyle=value; if (this.renderer) this.renderJourney(); }

  annotation(text,position,node) {
    const selection=typeof node==='object'?node:{node};
    const element=document.createElement(selection.processOnly?'span':'button');
    element.className='hotspot'; element.type='button'; element.textContent=text;
    if(selection.processOnly)element.classList.add('process-label');
    if(!selection.processOnly)element.setAttribute('aria-label',selection.lessonSlot?`Place selected piece at position ${text}`:`${text}: ${selection.inspect?'inspect in 3D':'open learning node'}`);
    element.onclick=()=>this.onSelect(selection);
    this.buildLabelLayer.append(element);
    this.annotations.push({element,position:new THREE.Vector3(...position),processOnly:selection.processOnly,after:selection.after||0,visibleWhen:selection.visibleWhen});
  }

  getView({id,data,protein}) {
    const key=`${id}:${data?.id||''}:${id==='molecules'?this.molecularStyle:''}`;
    if (this.views.has(key)) return this.views.get(key);
    this.root=new THREE.Group(); this.annotations=[]; this.movers=[]; this.flows=[];this.processRig=null;
    this.buildLabelLayer=document.createElement('div');
    this.buildLabelLayer.className='view-labels';
    this.labelLayer.append(this.buildLabelLayer);
    if(id==='lesson-puzzle')makeLessonPuzzle.call(this,data);
    else if(id==='lesson-lab')makeCourseModel.call(this,data);
    else if (pathwayBuilders[id]) pathwayBuilders[id].call(this);
    else if (id==='thylakoid') makeThylakoid.call(this);
    else if (id==='molecules') this.makeMolecule(data);
    else if (id==='dna') this.makeDNA();
    else if (id==='protein') this.makeProtein(protein);
    else if (id==='amylose') this.makeAmylose();
    else if (id==='membrane') this.makeMembrane();
    else if (['mitochondrion','chloroplast'].includes(id)) this.makeOrganelle(id);
    else if (id==='animal-cell'||id==='plant-cell') this.makeCell(id);
    else if (structureInfo[id]) this.makeStructure(id);
    else if (id==='plant') this.makePlantScene();
    else if (['population','community','ecosystem'].includes(id)) this.makeLandscape(id);
    else if(id==='biosphere') this.makeEarth();
    else throw new Error(`No 3D builder for ${id}`);

    this.processRig?.update(null);
    const content=this.root;
    content.updateMatrixWorld(true);
    const baseBounds=new THREE.Box3();
    content.traverse(object=>{
      if(!object.isMesh)return;
      let parent=object;while(parent){if(!parent.visible)return;parent=parent.parent;}
      if(object.isInstancedMesh){object.computeBoundingBox();baseBounds.union(object.boundingBox.clone().applyMatrix4(object.matrixWorld));}
      else{object.geometry.computeBoundingBox();baseBounds.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));}
    });
    const bounds=this.processRig?.bounds?.clone()||new THREE.Box3().setFromObject(content);
    const center=bounds.getCenter(new THREE.Vector3());
    const size=bounds.getSize(new THREE.Vector3());
    const radius=Math.max(size.x,size.y,size.z)/2||1;
    content.position.copy(center).negate();
    const normalized=new THREE.Group();
    normalized.scale.setScalar(3.1/radius);
    normalized.add(content);
    const root=new THREE.Group(); root.add(normalized);
    if (['population','rabbit-population','tree-population','community','ecosystem','epithelium'].includes(id)) root.rotation.set(.35,-.32,0);
    const materialCopies=new Map(),features=new Set(),ambient=[];
    content.traverse(object=>{
      if(object.userData.animate)ambient.push(object.userData.animate);
      if(object.userData.feature)features.add(object.userData.feature);
      if (!object.material) return;
      const copy=original=>{
        if (!materialCopies.has(original)) {
          const clone=cloneForView(original);
          materialCopies.set(original,clone);
        }
        return materialCopies.get(original);
      };
      object.material=Array.isArray(object.material)?object.material.map(copy):copy(object.material);
    });
    const baseSize=baseBounds.getSize(new THREE.Vector3());
    const view={id,key,root,content,normalized,ambient,features:[...features],baseBounds:{center:baseBounds.getCenter(new THREE.Vector3()),size:baseSize,radius:Math.max(baseSize.x,baseSize.y,baseSize.z)/2||1},processBounds:{center,radius,size},labels:this.buildLabelLayer,annotations:this.annotations,movers:this.movers,flows:this.flows,processRig:this.processRig,materials:[...materialCopies.values()],opacity:1};
    this.scene.add(root);this.views.set(key,view);
    for (const flow of view.flows) flow.visible=this.flowVisible;
    return view;
  }

  setViewAppearance(view,scale,opacity) {
    view.root.visible=opacity>.005; view.root.scale.setScalar(scale); view.opacity=opacity;
    for (const material of view.materials) {
      const translucent=opacity<.995;
      const transparent=translucent||material.userData.originalTransparent;
      if (material.transparent!==transparent) {material.transparent=transparent;material.needsUpdate=true;}
      material.opacity=material.userData.originalOpacity*opacity;
      material.depthWrite=!translucent&&material.userData.originalDepthWrite;
    }
  }

  renderJourney() {
    if (!this.definitions.length) return;
    const lower=Math.floor(this.position),fraction=this.focusDefinition?0:this.position-lower;
    for (const view of this.views.values()) {view.root.visible=false;view.labels.hidden=true;}
    const first=this.getView(this.focusDefinition||this.definitions[lower]);
    const second=fraction>.001&&lower<this.definitions.length-1?this.getView(this.definitions[lower+1]):null;
    this.setViewAppearance(first,Math.pow(.16,fraction),1-smooth(.1,.85,fraction));
    if (second) this.setViewAppearance(second,Math.pow(2.8,1-fraction),smooth(.2,.95,fraction));
    const previous=this.activeView;
    this.activeView=fraction<.5||!second?first:second;
    if(previous!==this.activeView)this.updateLighting();
    // A process belongs to its structure. Clear it before applying a new model's rig.
    if(previous!==this.activeView){this.process=null;this.processProgress=0;this.processPlaying=false;}
    first.labels.hidden=first!==this.activeView;
    if (second) second.labels.hidden=second!==this.activeView;
    this.activeView.labels.hidden=false;
    this.container.dataset.model=this.activeView.id;
    this.container.dataset.lessonVisual=this.activeView.processRig?.visualFamily||'';
    this.applyProcess();
    this.fitCamera();
    for (const [key,view] of this.views) {
      if (this.views.size<=12) break;
      if (view===first||view===second) continue;
      this.scene.remove(view.root);view.labels.remove();disposeModel(view.root);this.views.delete(key);
    }
  }

  frame() {
    this.raf=requestAnimationFrame(()=>this.frame());
    const now=performance.now(),dt=Math.min(.05,(now-this.previous)/1000);this.previous=now;
    if (document.hidden || this.active === false) return;
    if (!this.paused) this.elapsed+=dt;
    if(this.process&&this.processPlaying&&!document.querySelector('dialog[open]')){
      this.processProgress=Math.min(1,this.processProgress+dt*this.processRate/processes[this.process].seconds);
      if(this.processProgress===1)this.processPlaying=false;
      this.applyProcess();
    }
    const difference=this.targetPosition-this.position;
    if (Math.abs(difference)>.0001) {
      this.position+=difference*(1-Math.exp(-dt*11));
      if (Math.abs(this.targetPosition-this.position)<.0008) this.position=this.targetPosition;
      this.renderJourney();this.onPosition(this.position);
    }
    for (const view of this.views.values()) {
      if (!view.root.visible) continue;
      const ambientTime=this.process&&view===this.activeView?this.processProgress*processes[this.process].seconds:this.elapsed;
      for(const animate of view.ambient)animate(ambientTime);
      for (const mover of view.movers) {
        const t=(this.elapsed*.11+mover.phase)%1;
        if (mover.kind==='channel') mover.mesh.position.set(Math.sin(mover.phase*9)*.2,(t-.5)*4,Math.cos(mover.phase*7)*.2);
        else mover.mesh.position.set(Math.cos(t*Math.PI*2)*2.8,Math.sin(t*Math.PI*2)*.85,Math.cos(t*Math.PI*4)*.9);
      }
    }
    this.controls.update(dt);this.scene.updateMatrixWorld();
    if ((this.labelsVisible||this.process)&&this.activeView) for (const annotation of this.activeView.annotations) {
      annotation.element.hidden=!(annotation.processOnly?this.process&&this.processProgress>=annotation.after&&(!annotation.visibleWhen||annotation.visibleWhen(this.processSnapshot)):this.labelsVisible);
      const p=annotation.position.clone().applyMatrix4(this.activeView.content.matrixWorld).project(this.camera);
      annotation.element.style.left=`${(p.x*.5+.5)*100}%`;
      annotation.element.style.top=`${(.5-p.y*.5)*100}%`;
      annotation.element.style.visibility=p.z>1||Math.abs(p.x)>.9||Math.abs(p.y)>.9?'hidden':'visible';
    }
    this.renderer.render(this.scene,this.camera);
  }

  destroy() {
    this.disposed=true;
    cancelAnimationFrame(this.raf);this.observer?.disconnect();this.controls?.dispose();
    for (const view of this.views.values()) disposeModel(view.root);
    this.renderer?.dispose();
    this.environmentMap?.dispose();
    this.outdoorEnvironment?.dispose();
  }
}
