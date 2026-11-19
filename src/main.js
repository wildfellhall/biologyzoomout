import './styles.css';
import './lessons.css';
import { BiologyScene, elements } from './scene.js';
import { stages, modelInfo, homeStage, nodesAtStage, formulaHTML } from './content.js';
import { esc, nodeDetail } from './node-detail.js';
import { structureInfo, childrenOf } from './structures.js';
import { processes, processesFor, phaseStarts } from './processes.js';
import {fieldNotes,featureNotes} from './field-notes.js';
import {createLessonUI} from './lesson-ui.js';
import {sampleProcess} from './processes.js';
import { pathways, pathwayInfo, buildPath, routeForModel, pathForMolecule, supportsMolecule, pathStep } from './pathways.js';

const $ = selector => document.querySelector(selector);
const icons = {
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  pause:'<path d="M9 5v14M15 5v14"/>',
  play:'<path d="m8 5 11 7-11 7Z"/>',
  reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  labels:'<path d="m4 19 6-14 6 14M6 14h8M17 10h5m-2.5 0v9"/>',
  plus:'<path d="M5 12h14M12 5v14"/>',
  minus:'<path d="M5 12h14"/>',
  paths:'<path d="M5 19V5m0 8c8 0 4-8 14-8M5 13c8 0 4 6 14 6"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>',
  expand:'<path d="m6 9 6 6 6-6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const fetchJSON = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.json();
};
const families = [['carbohydrates','Carbohydrates'],['amino-acids','Amino acids'],['lipids','Lipids'],['nucleotides','Nucleotides'],['water','Water']];
const state = {
  position:0, target:0, stage:0, molecule:'glucose', pathId:'starch', organism:'plant',
  drawer:false, scope:'stage', query:'', unit:'all', selectedNode:null, history:[],
  paused:matchMedia('(prefers-reduced-motion: reduce)').matches, labels:false, style:'ball', reviewed:new Set(),
  focusStack:[], process:null, autoplay:true, animationPaused:false, noteOpen:false, noteFeature:null, noteTab:'work',
};
try { state.autoplay=localStorage.getItem('biology-zoomout-autoplay')!=='false'; } catch {}
try { state.reviewed = new Set(JSON.parse(localStorage.getItem('biology-zoomout-reviewed') || '[]')); } catch {}

try {
  const [ontology,molecules,protein] = await Promise.all(['/data/ontology.json','/data/molecules.json','/data/protein.json'].map(fetchJSON));
  const nodeMap = new Map(ontology.nodes.map(node=>[node.id,node]));
  const moleculeMap = new Map(molecules.map(molecule=>[molecule.id,molecule]));
  let route=buildPath(state.pathId,state.organism);
  state.reviewed = new Set([...state.reviewed].filter(id=>nodeMap.has(id)));

  $('#app').innerHTML = `
    <header class="topbar">
      <button class="brand" id="home" aria-label="Biology Zoomout, return to the start of this path"><svg class="brand-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="21"/><circle cx="20" cy="24" r="14"/><circle cx="16" cy="24" r="7"/><circle class="brand-core" cx="13" cy="24" r="2.5"/></svg><span class="brand-type"><span>Biology</span><em>zoomout</em></span></button>
      <div class="top-actions"><button id="paths-toggle" aria-haspopup="dialog">${icon('paths')}<span class="path-label">Paths</span><span id="active-path"></span></button><button id="nodes-toggle" aria-expanded="false" aria-controls="node-browser">${icon('search')}<span>Index</span><span class="count" id="nodes-count" hidden></span></button><button id="info-toggle" class="icon-button" aria-label="View settings and model sources" title="Settings & sources">${icon('info')}</button></div>
    </header>

    <main id="viewer">
      <div class="scene" id="scene"></div>
      <div class="model-heading">
        <button id="structure-back" hidden></button>
        <select id="model-select" aria-label="Select 3D model"></select>
        <h1 id="model-name" hidden></h1>
        <div class="model-meta"><span id="model-formula"></span><span id="model-size"></span></div>
        <div class="structure-actions"><select id="part-select" aria-label="Inspect a structure in 3D" hidden></select><button id="field-note-toggle" aria-expanded="false" aria-controls="field-note">Field notes <span>↗</span></button></div>
      </div>
      <section id="field-note" aria-label="Contextual biology explanation" hidden>
        <div class="field-note-heading"><span id="field-note-title"></span><select id="feature-select" aria-label="Explore a visible detail" hidden></select><button id="field-note-close" class="icon-button" aria-label="Close field notes">${icon('close')}</button></div>
        <div class="note-tabs" role="group" aria-label="Explanation type"><button data-note-tab="look" aria-pressed="false">Notice</button><button data-note-tab="work" aria-pressed="true">Function</button><button data-note-tab="context" aria-pressed="false">Context</button></div>
        <p id="field-note-text"></p><div class="field-note-links"><button id="field-note-inspect" hidden></button><button id="field-note-learn">Related AP node ↗</button><a id="field-note-source" target="_blank" rel="noopener">Source ↗</a></div>
      </section>
      <section id="process-panel" class="process-panel" aria-label="Animation controls" hidden>
        <div class="process-toolbar"><button id="process-play" class="icon-button" aria-label="Play animation">${icon('play')}</button><span id="process-name"></span><input id="process-range" type="range" min="0" max="1" step="0.001" value="0" aria-label="Animation progress"><output id="process-time"></output><button id="process-details-toggle" class="icon-button" aria-label="Animation details" aria-expanded="false" aria-controls="process-details">${icon('expand')}</button></div>
        <div class="process-cue"><span id="process-beat"></span><p id="process-caption" aria-live="polite" aria-atomic="true"></p></div>
        <div id="process-details" hidden>
          <div id="process-chapters" class="process-chapters" aria-label="Reaction stages"></div>
          <div class="process-data"><select id="selection-environment" aria-label="Selection pressure" hidden><option value="favor-a">Favor aa</option><option value="favor-A">Favor AA</option><option value="neutral">Equal fitness</option></select><span id="process-metrics"></span><svg id="process-chart" viewBox="0 0 180 32" role="img" aria-label="Simulation history" hidden></svg></div>
          <div class="process-options"><button id="process-restart">${icon('reset')} Replay</button><label>Speed <select id="process-speed" aria-label="Animation speed"><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label><button id="structure-only">View structure</button></div>
        </div>
      </section>
      <button id="restore-animation" class="restore-animation" hidden>${icon('play')}<span>Show process</span></button>
      <div class="atom-popover" id="picked-atom" hidden></div>
      <div class="gesture-hint" id="gesture-hint">Scroll to zoom <span>·</span> Drag to rotate</div>
    </main>

    <section class="node-browser" id="node-browser" aria-label="Ontology nodes" hidden>
      <div class="browser-toolbar">
        <h2>Nodes <span class="count" id="card-count"></span></h2>
        <input id="node-search" type="search" placeholder="Search nodes" aria-label="Search ontology nodes">
        <div class="scope-switch"><button id="stage-scope" aria-pressed="true">This scale</button><button id="all-scope" aria-pressed="false">All 234</button></div>
        <select id="unit-filter" aria-label="Filter by AP Biology unit"><option value="all">All units</option>${Object.entries(ontology.unit_names).map(([id,name])=>`<option value="${id}">${id} · ${esc(name)}</option>`).join('')}<option value="practices">Science practices</option><option value="foundations">Foundations & labs</option></select>
        <button id="close-browser" class="icon-button" aria-label="Close nodes">${icon('close')}</button>
      </div>
      <div class="cards" id="cards"></div>
    </section>

    <nav class="scale-dock" aria-label="Biological zoom pathway">
      <span id="path-next" class="sr-only"></span>
      <button id="zoom-in" class="zoom-button" aria-label="Zoom in to a smaller scale" title="Smaller scale">${icon('plus')}</button>
      <div class="scale-track">
        <div class="scale-readout"><span id="stage-name">Molecules</span><span id="next-scale"></span></div>
        <label class="sr-only" for="scale-range">Biological scale</label><input id="scale-range" type="range" min="0" max="9" step="0.001" value="0">
        <div class="scale-stops"></div>
      </div>
      <button id="zoom-out" class="zoom-button" aria-label="Zoom out to a larger scale" title="Larger scale">${icon('minus')}</button>
    </nav>

    <dialog id="paths-dialog" aria-labelledby="paths-title"><div class="dialog-toolbar"><h2 id="paths-title">Choose a path</h2><button class="close-dialog icon-button" aria-label="Close paths">${icon('close')}</button></div><div class="paths-body"><div class="path-controls"><label>Path<select id="path-select" aria-label="Zoom-out pathway"></select></label><label>Context<select id="organism-select" aria-label="Plant or animal context"></select></label></div><ol id="path-preview"></ol><button id="explore-path">Explore this path <span>↗</span></button></div></dialog>
    <dialog id="node-dialog" aria-labelledby="node-title"><div class="dialog-toolbar"><button id="node-back">← Back</button><button class="close-dialog icon-button" aria-label="Close learning node">${icon('close')}</button></div><div id="node-detail"></div></dialog>
    <dialog id="info-dialog" class="info-dialog" aria-labelledby="info-title"><div class="dialog-toolbar"><h2 id="info-title">Model information</h2><button class="close-dialog icon-button" aria-label="Close model information">${icon('close')}</button></div><div class="info-body"><details class="settings" open><summary>View settings</summary><div class="view-controls" aria-label="3D controls"><button id="pause-btn" aria-label="Pause rotation">${icon('pause')}<span>Rotation</span></button><button id="labels-btn" aria-label="Show model labels" aria-pressed="false">${icon('labels')}<span>Labels</span></button><button id="reset-btn" aria-label="Reset view">${icon('reset')}<span>Reset view</span></button></div><label class="autoplay-setting"><input id="autoplay-setting" type="checkbox"> Play processes automatically</label><select id="process-select" aria-label="Choose an animation" hidden></select><div id="representation-controls"><button data-style="ball" aria-pressed="true">Ball & stick</button><button data-style="space" aria-pressed="false">Space filling</button></div></details><div id="model-information"></div><details><summary>Controls</summary><dl class="shortcuts"><dt>Scroll / pinch</dt><dd>Change scale</dd><dt>Drag</dt><dd>Rotate</dd><dt>← / →</dt><dd>Previous / next scale</dd><dt>Space</dt><dd>Pause / resume</dd><dt>/</dt><dd>Search nodes</dd><dt>Esc</dt><dd>Close</dd></dl></details><details><summary>Framework & sources</summary><p>AP Biology, 2026–27. All 234 original nodes and 496 learning relationships are available. Zoom paths follow biological components, compartments, and ecological membership. They are separate from the ontology’s prerequisite relationships.</p><ul class="source-list">${ontology.sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} ↗</a><small>${esc(source.edition)}</small></li>`).join('')}</ul><p>Each adjacent zoom step has an explicit biological relationship. Building-block and catalytic-binding steps differ from literal containment; the relationship notes below identify these cases. Models use representative dimensions and are not a calibrated reconstruction of one specimen.</p><p>Small molecules use published PubChem coordinates; crambin uses RCSB PDB 1CRN. Cell and organism scenes are procedural cutaways. Earth uses a satellite-derived texture. Colors, abundance, and biochemical playback times are illustrative; animation models and assumptions are documented above.</p><p>Habitat materials use local Poly Haven photographic maps: <a href="https://polyhaven.com/a/bark_brown_02" target="_blank" rel="noopener">Bark Brown 02</a> and <a href="https://polyhaven.com/a/forrest_ground_01" target="_blank" rel="noopener">Forest Ground 01</a> by Rob Tuytel, <a href="https://polyhaven.com/a/forest_ground_04" target="_blank" rel="noopener">Forest Ground 04</a> by Rob Tuytel and Rico Cilliers, and <a href="https://polyhaven.com/a/forest_slope" target="_blank" rel="noopener">Forest Slope</a> HDR lighting by Andreas Mischok. All are <a href="https://polyhaven.com/license" target="_blank" rel="noopener">CC0</a>. Organism shapes remain procedural illustrations, not scanned specimens. <a href="/textures/natural/sources.json" target="_blank" rel="noopener">Asset records ↗</a></p><a href="/data/ontology.json" download="ap-biology-ontology.json">Download ontology ↓</a></details><details><summary>Source qualifications</summary>${ontology.source_issues.map(issue=>`<p><b>${esc(issue.requirement)}</b> ${esc(issue.issue)} ${esc(issue.resolution)}</p>`).join('')}<p>Six classroom and laboratory implementation conditions remain unverified. Reviewed markers are local reading records, not mastery scores.</p></details></div></dialog>`;

  let scene,lessonUI,lessonNavigation=false;
  scene = new BiologyScene($('#scene'), {
    onSelect: selection => {
      if (selection.feature) openFieldNote(selection.feature);
      else if (selection.inspect) focusStructure(selection.inspect);
      else if (selection.node) openNode(selection.node);
      else if (selection.atom) {
        $('#picked-atom').hidden = false;
        $('#picked-atom').innerHTML = `<span class="atom-symbol" style="--atom-color:${elements[selection.atom.element]?.color || '#aaa'}">${esc(selection.atom.element)}</span><div><b>${esc(selection.element)}</b><small>Atom ${esc(selection.atom.id)}</small></div><button class="icon-button" aria-label="Close atom information">${icon('close')}</button>`;
        $('#picked-atom button').onclick = () => $('#picked-atom').hidden = true;
      }
    },
    onPosition: position => updatePosition(position),
    onZoom: delta => moveScale(state.target + delta),
    onProcess: (snapshot,playing) => renderProcessFrame(snapshot,playing),
    onError: () => {
      $('#scene').innerHTML = '<div class="webgl-fallback"><h2>3D unavailable</h2><p>WebGL could not start. The scale controls and all ontology nodes are still available.</p></div>';
      document.body.classList.add('no-webgl');
    },
  });

  const currentStep=()=>route.steps[state.stage]||route.steps[0];
  const currentID=()=>currentStep().id;
  const infoFor=id=>pathwayInfo[id]||structureInfo[id]||modelInfo[id];
  const maxPosition=()=>route.steps.length-1;
  const partsFor=id=>infoFor(id)?.children||childrenOf(id);
  function definitions(){return route.steps.map(step=>({...step,data:step.id==='molecules'?moleculeMap.get(state.molecule):null,protein}));}

  function renderPathControls(){
    $('#path-select').innerHTML=Object.entries(pathways).map(([id,p])=>`<option value="${id}" ${route.id===id?'selected':''}>${esc(p.name)}</option>`).join('')+(pathways[route.id]?'':`<option value="${esc(route.id)}" selected>${esc(infoFor(currentID())?.name||route.name)}</option>`);
    $('#organism-select').innerHTML=route.organisms.map(id=>`<option value="${id}" ${route.organism===id?'selected':''}>${id==='plant'?'Plant':'Animal'}</option>`).join('');
    $('#organism-select').disabled=route.organisms.length===1;
    $('#scale-range').max=maxPosition();
    $('.scale-stops').style.gridTemplateColumns=`repeat(${route.steps.length},minmax(0,1fr))`;
    $('.scale-track').style.setProperty('--stop-inset',`${50/route.steps.length}%`);
    $('.scale-stops').innerHTML=route.steps.map((step,index)=>`<button data-stage="${index}" data-model="${step.id}" aria-label="${esc(step.label)}" title="${esc(index?route.edges[index-1].reason:step.label)}"><i></i><span>${esc(step.label)}</span></button>`).join('');
    $('#scene').dataset.path=route.id;$('#scene').dataset.organism=route.organism;
    $('#active-path').textContent=route.name;
    $('#paths-toggle').setAttribute('aria-label',`Choose a path; current path: ${route.name}`);
    $('#paths-toggle').title=`${route.name} · ${route.organism==='plant'?'Plant':'Animal'}`;
    $('#path-preview').innerHTML=route.steps.map((step,i)=>`<li ${step.id===currentID()?'aria-current=step':''}><span>${String(i+1).padStart(2,'0')}</span>${esc(step.label)}</li>`).join('');
  }

  function setRoute(next,{model=null,index=null,molecule=null,keepHistory=false}={}){
    if(lessonUI?.active&&!lessonNavigation)lessonUI.exit({update:false});
    if(!keepHistory)state.focusStack=[];
    route=next;state.pathId=route.id;state.organism=route.organism;
    if(molecule&&moleculeMap.has(molecule))state.molecule=molecule;
    if(route.molecule&&!supportsMolecule(route.id,moleculeMap.get(state.molecule)))state.molecule=route.molecule;
    let position=index??(model?pathStep(route,model):0);if(!Number.isFinite(position)||position<0)position=0;
    state.target=Math.min(maxPosition(),position);state.stage=Math.round(state.target);state.process=null;
    scene.setProcess(null);renderPathControls();scene.setDefinitions(definitions());scene.seek(state.target,true);renderModelUI();updateHash();
  }

  function switchPath(id,organism=state.organism){
    const current=currentID(),next=buildPath(id,organism);
    let model=next.steps.some(s=>s.id===current)?current:null;
    if(!model&&id===route.id){
      const roles=[['plant-cell','animal-cell'],['leaf','epithelium'],['plant','rabbit'],['population','rabbit-population']];
      const pair=roles.find(pair=>pair.includes(current));if(pair)model=pair.find(m=>next.steps.some(s=>s.id===m));
    }
    setRoute(next,{model});
  }
  function focusStructure(id){
    if(!infoFor(id))return;
    if(id===currentID()){openFieldNote();return;}
    const previous={pathId:route.id,organism:state.organism,molecule:state.molecule,model:currentID()};
    const next=routeForModel(id,state.organism,route.id,currentID());
    state.focusStack.push(previous);setRoute(next,{model:id,keepHistory:true});scene.resetView();openFieldNote();
  }
  function leaveStructure(){
    const previous=state.focusStack.pop();if(!previous)return;
    setRoute(buildPath(previous.pathId,previous.organism),{model:previous.model,molecule:previous.molecule,keepHistory:true});
  }

  function modelData(){
    if(currentID()!=='molecules')return infoFor(currentID());
    const molecule=moleculeMap.get(state.molecule);return {...molecule,summary:molecule.description,note:molecule.coordinateNote};
  }
  function relevantIDs(){
    if(currentID()!=='molecules')return infoFor(currentID()).nodes;
    return {water:['APBIO-1.1-01','APBIO-1.1-02','APBIO-1.1-03'],'amino-acids':['APBIO-1.7-01','APBIO-1.7-05'],lipids:['APBIO-1.5-01','APBIO-1.5-02','APBIO-1.5-03'],nucleotides:['APBIO-1.6-01','APBIO-3.3-02'],carbohydrates:['APBIO-1.4-01','APBIO-1.3-01','APBIO-1.2-01']}[moleculeMap.get(state.molecule).family];
  }
  function contextNodes(){
    const ids=new Set([...nodesAtStage(ontology,currentStep().stage).map(n=>n.id),...relevantIDs()]);
    return ontology.nodes.filter(n=>ids.has(n.id));
  }

  function renderModelUI(){
    closeFieldNote();
    const id=currentID(),info=modelData(),isMolecule=id==='molecules',select=$('#model-select');
    select.hidden=!isMolecule;$('#model-name').hidden=isMolecule;$('#model-name').textContent=info.name;
    select.innerHTML=isMolecule?families.map(([family,label])=>`<optgroup label="${label}">${molecules.filter(m=>m.family===family).map(m=>`<option value="${m.id}" ${m.id===state.molecule?'selected':''}>${esc(m.name)}</option>`).join('')}</optgroup>`).join(''):'';
    $('#model-formula').innerHTML=isMolecule?formulaHTML(esc(info.formula)):id==='protein'?'46 residues':'';
    $('#model-size').textContent=currentStep().size;
    const previous=state.focusStack.at(-1);$('#structure-back').hidden=!previous;
    $('#structure-back').textContent=previous?`← ${infoFor(previous.model)?.name||'Previous view'}`:'';
    const parts=partsFor(id);$('#part-select').hidden=!parts.length;
    $('#part-select').innerHTML=`<option value="">Inspect structure…</option>${parts.map(part=>`<option value="${part}">${esc(infoFor(part)?.name||part)}</option>`).join('')}`;
    const animations=processesFor(id);$('#process-select').hidden=!animations.length;
    $('#process-select').innerHTML=`<option value="">Structure only</option>${animations.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}`;
    $('#process-details').hidden=true;$('#process-details-toggle').setAttribute('aria-expanded','false');
    activateProcess(animations[0]?.id||null);
    $('#nodes-count').textContent=contextNodes().length;$('#stage-scope').textContent='This structure';$('#picked-atom').hidden=true;
    renderCards();if($('#info-dialog').open)renderInformation();
  }
  function closeFieldNote(){
    state.noteOpen=false;state.noteFeature=null;$('#field-note').hidden=true;$('#field-note-toggle').setAttribute('aria-expanded','false');
  }
  function openFieldNote(feature=null){
    state.noteOpen=true;state.noteFeature=feature;state.noteTab='work';
    $('#gesture-hint').classList.add('dismissed');scene.clearHover();
    $('#process-details').hidden=true;$('#process-details-toggle').setAttribute('aria-expanded','false');
    $('#picked-atom').hidden=true;renderFieldNote();
  }
  function renderFieldNote(){
    const data=modelData(),feature=featureNotes[state.noteFeature],note=feature||fieldNotes[currentID()]||{look:data.note,work:data.summary,source:data.source?.url};
    const next=route.steps[state.stage+1],edge=route.edges[state.stage];
    $('#field-note').hidden=!state.noteOpen;$('#field-note-toggle').setAttribute('aria-expanded',String(state.noteOpen));
    $('#field-note-title').textContent=feature?.name||data.name;
    const features=scene.activeView?.features||[];
    $('#feature-select').hidden=!features.length;$('#field-note-title').hidden=!!features.length;
    $('#feature-select').innerHTML=`<option value="">${esc(data.name)}</option>`+features.map(id=>`<option value="${esc(id)}" ${id===state.noteFeature?'selected':''}>${esc(featureNotes[id].name)}</option>`).join('');
    const context=feature?`This detail is part of the ${data.name.toLowerCase()} view. ${feature.target&&feature.target!==currentID()?`Inspect ${infoFor(feature.target)?.name.toLowerCase()} to follow its biological connections.`:''}`:edge?`${next.label}: ${edge.reason}`:'This view brings the local ecosystem into the global biosphere.';
    $('#field-note-text').textContent=state.noteTab==='context'?context:note[state.noteTab]||data.summary;
    for(const button of document.querySelectorAll('[data-note-tab]'))button.setAttribute('aria-pressed',String(button.dataset.noteTab===state.noteTab));
    const source=state.noteTab==='context'&&!feature&&edge?edge.source:note.source;
    $('#field-note-source').hidden=!source;$('#field-note-source').href=source||'#';
    const target=feature?.target;$('#field-note-inspect').hidden=!target||target===currentID();
    $('#field-note-inspect').textContent=target?`Inspect ${infoFor(target)?.name} ↗`:'';
    $('#field-note-inspect').onclick=()=>{if(target)focusStructure(target);};
    const nodeId=feature?.node||relevantIDs()[0];$('#field-note-learn').title=nodeMap.get(nodeId)?.label||'';
    $('#field-note-learn').textContent=`AP Biology · ${nodeMap.get(nodeId)?.label||'Related skill'} ↗`;
    $('#field-note-source').textContent='Biology reference ↗';
    $('#field-note-learn').onclick=()=>openNode(nodeId);
  }
  function activateProcess(id){
    state.process=id;$('#process-select').value=id||'';
    $('#restore-animation').hidden=!!id||!processesFor(currentID()).length||!scene.renderer;
    scene.setProcess(id);
    if(id&&state.autoplay&&!state.animationPaused&&!scene.reducedMotion)scene.playProcess(true);
  }
  function updatePosition(position){
    state.position=position;const index=Math.max(0,Math.min(maxPosition(),Math.round(position))),step=route.steps[index];
    $('#scale-range').value=position;$('#scale-range').style.setProperty('--progress',`${position/maxPosition()*100}%`);
    $('#scale-range').setAttribute('aria-valuetext',`${step.label}, ${step.size}, ${route.name} path`);
    $('#stage-name').textContent=step.label;$('#next-scale').textContent=route.steps[index+1]?`${route.steps[index+1].label} →`:'';
    $('#zoom-in').disabled=state.target<=0;$('#zoom-out').disabled=state.target>=maxPosition();
    const next=route.steps[index+1];$('#path-next').textContent=next?`Next: ${next.label}`:'Biosphere';$('#path-next').title=route.edges[index]?.reason||'';
    for(const button of document.querySelectorAll('[data-stage]'))button.setAttribute('aria-current',+button.dataset.stage===index?'step':'false');
    if(index!==state.stage){state.stage=index;renderModelUI();}
  }
  let hashTimer;
  function moveScale(position,immediate=false){
    if(lessonUI?.active)return;
    state.target=Math.max(0,Math.min(maxPosition(),position));scene.seek(state.target,immediate);
    $('#gesture-hint').classList.add('dismissed');clearTimeout(hashTimer);hashTimer=setTimeout(updateHash,180);
  }
  function updateHash(){
    const index=Math.round(state.target),parameters=new URLSearchParams({path:route.id,organism:state.organism,at:route.steps[index].key});
    if(route.steps[0].id==='molecules')parameters.set('molecule',state.molecule);
    if(Math.abs(state.target-index)>.001)parameters.set('zoom',state.target.toFixed(3));
    if(state.selectedNode)parameters.set('node',state.selectedNode);
    if(lessonUI?.active&&lessonUI.active!=='review'){parameters.set('lesson',lessonUI.active);parameters.set('step',lessonUI.stepIndex);}
    history.replaceState(null,'',`#${parameters}`);
  }
  function readHash(){
    clearTimeout(hashTimer);const parameters=new URLSearchParams(location.hash.slice(1));state.focusStack=[];
    if(lessonUI?.has(parameters.get('lesson'))){lessonUI.start(parameters.get('lesson'),{step:parameters.has('step')?Number(parameters.get('step')):null});if(nodeMap.has(parameters.get('node')))openNode(parameters.get('node'));return;}
    if(lessonUI?.active)lessonUI.exit({update:false});
    const requestedMolecule=moleculeMap.get(parameters.get('molecule')),organism=parameters.get('organism')==='animal'?'animal':'plant';
    let next=buildPath('starch',organism),model=null,index=null;
    if(parameters.has('path')){
      try{next=buildPath(parameters.get('path'),organism);}catch{}
      model=parameters.get('at');
      const raw=Number(parameters.get('zoom'));if(parameters.has('zoom')&&Number.isFinite(raw))index=Math.max(0,Math.min(next.steps.length-1,raw));
    }else if(parameters.has('scale')||parameters.has('focus')){
      const stage=stages.find(s=>s.id===parameters.get('scale'))||stages[0];
      model=parameters.get('focus')||(stage.models.includes(parameters.get('model'))?parameters.get('model'):stage.models[0]);
      if(model==='molecules'){next=buildPath(requestedMolecule?pathForMolecule(requestedMolecule):'starch',organism);}
      else if(infoFor(model))next=routeForModel(model,model==='animal-cell'?'animal':organism,'starch');
    }else if(requestedMolecule)next=buildPath(pathForMolecule(requestedMolecule),organism);
    setRoute(next,{model,index,molecule:requestedMolecule?.id});
    const id=parameters.get('node');if(nodeMap.has(id))openNode(id);else if($('#node-dialog').open)$('#node-dialog').close();
  }
  function showNodeModel(node){
    const entry=Object.entries({...modelInfo,...structureInfo,...pathwayInfo}).find(([,info])=>info.nodes.includes(node.id));
    const defaults=['molecules','dna','membrane','mitochondrion','nucleus','plant','population','community','ecosystem','biosphere'];
    const model=entry?.[0]||defaults[homeStage(node)];
    if(model==='molecules')setRoute(buildPath(node.id.startsWith('APBIO-1.1')?'water':'starch',state.organism));
    else setRoute(routeForModel(model,state.organism,route.id),{model});
  }

  function toggleBrowser(open, focusSearch = false) {
    state.drawer = open;if(open)closeFieldNote();
    document.body.classList.toggle('nodes-open',open);
    $('#node-browser').hidden = !open;
    $('#nodes-toggle').setAttribute('aria-expanded',String(open));
    if (open) { renderCards();if(focusSearch) $('#node-search').focus(); }
    else $('#nodes-toggle').focus({preventScroll:true});
  }

  function renderCards() {
    if (!state.drawer) return;
    const query = state.query.toLowerCase().trim();
    const all = state.scope==='all'||query||state.unit!=='all';
    let nodes = all ? ontology.nodes : contextNodes();
    if (query) nodes=nodes.filter(node=>`${node.id} ${node.label} ${node.outcome} ${node.official_codes.join(' ')}`.toLowerCase().includes(query));
    if (state.unit!=='all') nodes=nodes.filter(node=>state.unit==='practices'?node.id.startsWith('APBIO-P'):state.unit==='foundations'?/^APBIO-[FL]-/.test(node.id):node.id.startsWith(`APBIO-${state.unit}.`));
    const relevant = new Set(relevantIDs());
    nodes=[...nodes].sort((a,b)=>(+relevant.has(b.id)-+relevant.has(a.id))||a.id.localeCompare(b.id,undefined,{numeric:true}));
    $('#card-count').textContent=nodes.length;
    $('#stage-scope').setAttribute('aria-pressed',String(!all));
    $('#all-scope').setAttribute('aria-pressed',String(!!all));
    $('#cards').innerHTML=nodes.length ? nodes.map(node=>`<button class="node-card" data-node="${node.id}"><span class="card-meta">${esc(node.id)}<span>${state.reviewed.has(node.id)?'✓':esc(node.kind)}</span></span><h3>${esc(node.label)}</h3><p>${esc(node.outcome)}</p><span class="card-footer">${node.prerequisite_ids.length?`${node.prerequisite_ids.length} prerequisite${node.prerequisite_ids.length===1?'':'s'}`:'No hard prerequisite'}<span aria-hidden="true">↗</span></span></button>`).join('') : '<div class="empty-state">No matching nodes. <button id="clear-filters">Clear filters</button></div>';
  }

  function openNode(id,{addHistory=true}={}) {
    const node = nodeMap.get(id);
    if (!node) return;
    if (addHistory&&state.selectedNode&&state.selectedNode!==id) state.history.push(state.selectedNode);
    state.selectedNode=id;
    $('#node-detail').innerHTML=nodeDetail(ontology,node,state.reviewed.has(id));
    $('#node-back').disabled=!state.history.length;
    if (!$('#node-dialog').open) $('#node-dialog').showModal();
    $('#node-dialog').scrollTop=0;
    scene.setPaused(true);
    $('#review-node').onclick=()=>{
      if(state.reviewed.has(id))state.reviewed.delete(id);else state.reviewed.add(id);
      try {localStorage.setItem('biology-zoomout-reviewed',JSON.stringify([...state.reviewed]));}catch{}
      openNode(id,{addHistory:false});renderCards();
    };
    $('#go-to-model').onclick=()=>{ $('#node-dialog').close();toggleBrowser(false);showNodeModel(node); };
    updateHash();
  }

  function renderInformation() {
    const info=modelData();
    const isMolecule=currentID()==='molecules';
    const source=info.source||(currentID()==='protein'?protein.source:null);
    let legend=info.legend||[];
    if(isMolecule){const counts={};for(const atom of info.atoms)counts[atom.element]=(counts[atom.element]||0)+1;legend=Object.entries(counts).map(([element,count])=>[elements[element]?.color||'#aaa',`${element} · ${count}`]);}
    $('#model-information').innerHTML=`<h3>${esc(info.name)}</h3><p>${esc(info.summary)}</p><div class="model-legend">${legend.map(([color,label])=>`<span><i style="background:${color}"></i>${esc(label)}</span>`).join('')}</div><p class="method-note">${esc(info.note)}</p>${source?`<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.label)} ↗</a>`:''}`;
    const animations=processesFor(currentID());
    if(animations.length)$('#model-information').insertAdjacentHTML('beforeend',`<h3>Animation models</h3>${animations.map(p=>`<p><b>${esc(p.name)}</b> ${esc(p.note)} <a href="${esc(p.source)}" target="_blank" rel="noopener">Biology reference ↗</a></p>`).join('')}`);
    $('#model-information').insertAdjacentHTML('beforeend',`<details class="path-reasons"><summary>${esc(route.name)} · biological connections</summary><ol>${route.edges.map((edge,i)=>`<li><b>${esc(route.steps[i].id==='molecules'?moleculeMap.get(state.molecule).name:route.steps[i].label)} → ${esc(route.steps[i+1].label)}</b><small>${esc(edge.relation)}</small><p>${esc(edge.reason)} <a href="${esc(edge.source)}" target="_blank" rel="noopener">Reference ↗</a></p></li>`).join('')}</ol></details>`);
    $('#representation-controls').hidden=!isMolecule;
    for(const button of document.querySelectorAll('[data-style]'))button.setAttribute('aria-pressed',String(button.dataset.style===state.style));
  }

  function renderProcessFrame(snapshot,playing) {
    lessonUI?.onFrame(snapshot);
    const visible=!!snapshot&&!!scene?.renderer;
    $('#process-panel').hidden=!visible;document.body.classList.toggle('process-active',visible);
    if(!visible)return;
    $('#process-name').textContent=processes[snapshot.id].name;
    $('#process-panel').dataset.playing=String(playing);
    $('#process-range').value=snapshot.t;
    $('#process-range').setAttribute('aria-valuetext',snapshot.time);
    $('#process-time').textContent=snapshot.time;
    if($('#process-caption').textContent!==snapshot.caption)$('#process-caption').textContent=snapshot.caption;
    $('#process-beat').textContent=['selection','predation','succession'].includes(snapshot.id)?'Now':`${snapshot.phase+1} / 4`;
    const chapterKey=`${snapshot.id}:${snapshot.phase}`;
    if($('#process-chapters').dataset.key!==chapterKey){
      $('#process-chapters').dataset.key=chapterKey;
      $('#process-chapters').innerHTML=(phaseStarts[snapshot.id]||[]).map((t,i)=>`<button data-process-at="${t}" aria-label="${esc(processes[snapshot.id].steps[i])}" aria-pressed="${i===snapshot.phase}">${i+1}</button>`).join('');
    }
    $('#process-play').innerHTML=icon(playing?'pause':'play');
    $('#process-play').setAttribute('aria-label',playing?'Pause animation':'Play animation');
    $('#selection-environment').hidden=snapshot.id!=='selection';
    $('#process-metrics').innerHTML=snapshot.metrics.map(([label,value])=>`<span>${esc(label)} <b>${esc(value)}</b></span>`).join('');
    const chart=$('#process-chart');chart.toggleAttribute('hidden',!['selection','predation'].includes(snapshot.id));
    if(!chart.hasAttribute('hidden')){
      const selection=snapshot.id==='selection',series=snapshot.series,limit=selection?snapshot.generation:Math.floor(snapshot.t*(series.length-1));
      const keys=selection?['p','q']:['prey','predator'],max=selection?1:Math.max(...series.flatMap(p=>[p.prey,p.predator]));
      chart.innerHTML=keys.map((key,index)=>`<path d="${series.slice(0,limit+1).filter((_,i)=>selection||i%10===0||i===limit).map((p,i,points)=>`${i?'L':'M'}${2+(selection?p.generation/12:p.t/30)*176},${30-p[key]/max*27}`).join(' ')}" stroke="${index?'#b64f32':'#385943'}" stroke-width="1.5" fill="none"/>`).join('');
      chart.setAttribute('aria-label',selection?'Allele frequencies across generations: A in green, a in rust':'Population history: prey in green, predators in rust');
    }
  }

  function setPaused() {
    state.paused=!state.paused;
    scene.setPaused(state.paused);
    updatePause();
  }
  function updatePause() {
    $('#pause-btn').innerHTML=icon(state.paused?'play':'pause')+`<span>${state.paused?'Resume rotation':'Pause rotation'}</span>`;
    $('#pause-btn').setAttribute('aria-label',state.paused?'Resume rotation':'Pause rotation');
    $('#pause-btn').title=state.paused?'Resume rotation':'Pause rotation';
  }
  function clearFilters() {
    state.scope='stage';state.query='';state.unit='all';$('#node-search').value='';$('#unit-filter').value='all';renderCards();
  }

  $('#field-note-toggle').onclick=()=>state.noteOpen?closeFieldNote():openFieldNote();
  $('#field-note-close').onclick=closeFieldNote;
  $('#feature-select').onchange=event=>{state.noteFeature=event.target.value||null;renderFieldNote();};
  for(const button of document.querySelectorAll('[data-note-tab]'))button.onclick=()=>{state.noteTab=button.dataset.noteTab;renderFieldNote();};
  $('#home').onclick=()=>{lessonUI?.exit();moveScale(0);};
  $('#paths-toggle').onclick=()=>{renderPathControls();$('#paths-dialog').showModal();};
  $('#explore-path').onclick=()=>$('#paths-dialog').close();
  $('#autoplay-setting').checked=state.autoplay;
  $('#autoplay-setting').onchange=event=>{state.autoplay=event.target.checked;state.animationPaused=false;try{localStorage.setItem('biology-zoomout-autoplay',String(state.autoplay));}catch{}scene.playProcess(state.autoplay&&!scene.reducedMotion);};
  $('#process-details-toggle').onclick=()=>{const open=$('#process-details').hidden;if(open)closeFieldNote();$('#process-details').hidden=!open;$('#process-details-toggle').setAttribute('aria-expanded',String(open));};
  $('#structure-only').onclick=()=>activateProcess(null);
  $('#restore-animation').onclick=()=>activateProcess(processesFor(currentID())[0]?.id||null);
  $('#path-select').onchange=event=>switchPath(event.target.value);
  $('#organism-select').onchange=event=>switchPath(route.id,event.target.value);
  $('#structure-back').onclick=()=>leaveStructure();
  $('#part-select').onchange=event=>{if(event.target.value)focusStructure(event.target.value);};
  $('#process-select').onchange=event=>activateProcess(event.target.value||null);
  $('#process-play').onclick=()=>{state.animationPaused=scene.processPlaying;scene.playProcess(!scene.processPlaying);};
  $('#process-restart').onclick=()=>{state.animationPaused=false;scene.seekProcess(0);scene.playProcess(state.autoplay&&!scene.reducedMotion);};
  $('#process-range').oninput=event=>{const value=Number(event.target.value);state.animationPaused=true;scene.playProcess(false);scene.seekProcess(value);};
  $('#process-chapters').onclick=event=>{const button=event.target.closest('[data-process-at]');if(button){state.animationPaused=true;scene.playProcess(false);scene.seekProcess(Number(button.dataset.processAt));}};
  $('#process-speed').onchange=event=>scene.processRate=Number(event.target.value);
  $('#selection-environment').onchange=event=>{scene.setEnvironment(event.target.value);scene.playProcess(state.autoplay&&!state.animationPaused&&!scene.reducedMotion);};
  $('#nodes-toggle').onclick=()=>toggleBrowser(!state.drawer);
  $('#close-browser').onclick=()=>toggleBrowser(false);
  $('#node-search').oninput=event=>{state.query=event.target.value;renderCards();};
  $('#unit-filter').onchange=event=>{state.unit=event.target.value;renderCards();};
  $('#stage-scope').onclick=clearFilters;
  $('#all-scope').onclick=()=>{state.scope='all';renderCards();};
  $('#cards').onclick=event=>{const card=event.target.closest('[data-node]');if(card)openNode(card.dataset.node);if(event.target.id==='clear-filters')clearFilters();};
  $('#node-detail').onclick=event=>{const button=event.target.closest('[data-open-node]');if(button)openNode(button.dataset.openNode);};
  $('#node-back').onclick=()=>{const id=state.history.pop();if(id)openNode(id,{addHistory:false});};
  $('#model-select').onchange=event=>{
    const molecule=moleculeMap.get(event.target.value);setRoute(buildPath(pathForMolecule(molecule,route.id),state.organism),{model:'molecules',molecule:molecule.id});
  };
  $('#scale-range').oninput=event=>moveScale(Number(event.target.value),true);
  $('#scale-range').onkeydown=event=>{
    const actions={ArrowRight:Math.floor(state.target+.001)+1,ArrowUp:Math.floor(state.target+.001)+1,ArrowLeft:Math.ceil(state.target-.001)-1,ArrowDown:Math.ceil(state.target-.001)-1,Home:0,End:maxPosition()};
    if(event.key in actions){event.preventDefault();moveScale(actions[event.key],true);}
  };
  $('.scale-stops').onclick=event=>{const button=event.target.closest('[data-stage]');if(button)moveScale(Number(button.dataset.stage));};
  $('#zoom-in').onclick=()=>moveScale(Math.ceil(state.target-.001)-1);
  $('#zoom-out').onclick=()=>moveScale(Math.floor(state.target+.001)+1);
  $('#pause-btn').onclick=setPaused;
  $('#labels-btn').onclick=()=>{state.labels=!state.labels;scene.setLabels(state.labels);$('#labels-btn').setAttribute('aria-pressed',String(state.labels));};
  $('#reset-btn').onclick=()=>scene.resetView();
  $('#info-toggle').onclick=()=>{renderInformation();$('#info-dialog').showModal();scene.setPaused(true);};
  $('#representation-controls').onclick=event=>{const button=event.target.closest('[data-style]');if(button){state.style=button.dataset.style;scene.setStyle(state.style);renderInformation();}};
  $('#scene').addEventListener('wheel',event=>{
    event.preventDefault();
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?600:1);
    moveScale(state.target+Math.max(-.65,Math.min(.65,delta*.0018)));
  },{passive:false});
  $('#scene').addEventListener('pointerdown',()=>$('#gesture-hint').classList.add('dismissed'));
  for(const button of document.querySelectorAll('.close-dialog'))button.onclick=()=>button.closest('dialog').close();
  for(const dialog of document.querySelectorAll('dialog')){
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
    dialog.addEventListener('close',()=>{scene.setPaused(lessonUI?.active?true:state.paused);});
  }
  $('#node-dialog').addEventListener('close',()=>{state.selectedNode=null;state.history=[];updateHash();});
  document.addEventListener('keydown',event=>{
    if($('dialog[open]'))return;
    if(event.key==='Escape'&&state.noteOpen){closeFieldNote();return;}
    if(event.key==='Escape'&&state.drawer){toggleBrowser(false);return;}
    if(event.key==='Escape'&&state.focusStack.length){leaveStructure();return;}
    if(event.target.matches('input,select,textarea'))return;
    if(lessonUI?.active){
      if(event.key==='Escape'){lessonUI.exit();return;}
      if(event.key==='ArrowRight'){event.preventDefault();lessonUI.next();return;}
      if(event.key==='ArrowLeft'){event.preventDefault();lessonUI.back();return;}
      if(event.code==='Space'&&event.target===document.body){event.preventDefault();if(lessonUI.canPlay())$('#process-play').click();return;}
    }
    if(event.key==='/'){event.preventDefault();toggleBrowser(true,true);}
    if(event.key==='ArrowRight'){event.preventDefault();$('#zoom-out').click();}
    if(event.key==='ArrowLeft'){event.preventDefault();$('#zoom-in').click();}
    if(event.code==='Space'&&event.target===document.body){event.preventDefault();state.process?$('#process-play').click():setPaused();}
  });
  if(matchMedia('(pointer: coarse)').matches)$('#gesture-hint').textContent='Pinch to zoom · Drag to rotate';
  setTimeout(()=>$('#gesture-hint').classList.add('dismissed'),6500);
  const processResize=new ResizeObserver(()=>{
    if(!$('#process-panel').hidden)document.body.style.setProperty('--process-clearance',`${$('#process-panel').offsetHeight+30}px`);
  });processResize.observe($('#process-panel'));
  $('.top-actions').insertAdjacentHTML('afterbegin','<button id="learn-toggle" aria-haspopup="dialog" aria-controls="lesson-dialog">Learn</button>');
  lessonUI=createLessonUI({scene,
    navigate(view){
      lessonNavigation=true;
      try{setRoute(buildPath(view.path,view.organism),{model:view.model});}finally{lessonNavigation=false;}
      activateProcess(view.process);scene.setEnvironment(view.environment||'favor-a');$('#selection-environment').value=view.environment||'favor-a';
      scene.playProcess(false);scene.seekProcess(view.at||0);
      if(view.autoplay&&state.autoplay&&!state.animationPaused&&!scene.reducedMotion)scene.playProcess(true);
    },
    canAutoplay:()=>state.autoplay&&!scene.reducedMotion,
    snapshot:()=>sampleProcess(scene.process,scene.processProgress,scene.environment),
    nodeLabel:id=>nodeMap.get(id)?.label||id,openNode,
    closeOverlays(){closeFieldNote();if(state.drawer)toggleBrowser(false);$('#process-details').hidden=true;$('#process-details-toggle').setAttribute('aria-expanded','false');$('#picked-atom').hidden=true;},
    onChange(){updateHash();$('#learn-toggle').classList.toggle('active',!!lessonUI?.active);},
    onExit(){scene.setPaused(state.paused);$('#learn-toggle').classList.remove('active');},
  });
  $('#learn-toggle').onclick=()=>lessonUI.openCatalog();
  updatePause();readHash();
  window.addEventListener('hashchange',readHash);
} catch(error) {
  console.error(error);
  $('#app').innerHTML='<div class="boot"><h1>Biology Zoomout</h1><p>Unable to load model data.</p><button onclick="location.reload()">Reload</button></div>';
}
