import {courseContent} from './course/content.js';
import {labs,sampleLab} from './course/labs.js';
import {replicationState,translationState,peptideState} from './reaction-state.js';
const source=(page)=>page.startsWith('https:')?page:`https://openstax.org/books/biology-2e/pages/${page}`;
const define=(name,models,seconds,steps,page,note)=>({name,models,seconds,steps,source:source(page),note});
export const processes={
 catalysis:define('Enzyme-catalyzed hydrolysis',['enzyme'],16,[
  'A compatible substrate approaches the active site.',
  'Binding changes the fit between enzyme and substrate.',
  'Hydrolysis breaks A–B; water supplies OH to A and H to B.',
  'A–OH and H–B leave; the enzyme can catalyze another reaction.'
 ],'6-5-enzymes','Generic enzyme-catalyzed hydrolysis: A–B + H₂O → A–OH + H–B. Large lobes represent molecular groups, not atoms. Oxygen is red and hydrogen is white. Atom counts are conserved, but this is not a specific enzyme or a molecular-dynamics simulation.'),
 replication:define('DNA replication',['dna'],22,[
  'The parental strands separate, exposing two templates.',
  'Complementary nucleotides join each exposed template.',
  'New strands extend by addition at their 3′ ends.',
  'Each completed daughter duplex contains one parental and one new strand.'
 ],'14-4-dna-replication-in-prokaryotes','One stretched replication fork. Gold is parental DNA, teal is new DNA, and pink marks primers before replacement. Both new strands grow 5′ → 3′; lagging-strand fragments grow away from the advancing fork. Enzyme shapes and rates are illustrative. Topoisomerase, proofreading and the second fork are omitted.'),
 diffusion:define('Facilitated diffusion',['membrane'],18,[
  'More solute particles start above the membrane.',
  'A selective channel permits solute to cross in either direction.',
  'More crossings occur from the higher-concentration side.',
  'Net flux approaches zero as the two concentrations equalize.'
 ],'5-2-passive-transport','Twenty-four particles in equal-volume compartments. Paths are illustrative; the final 12:12 count illustrates equilibrium, not a universal fixed distribution. No ATP input.'),
 chemiosmosis:define('Oxidative phosphorylation',['mitochondrion','atp-synthase'],24,[
  'Electron transfer powers H⁺ pumping from the matrix to the intermembrane space.',
  'H⁺ accumulates outside the inner membrane, storing electrochemical potential.',
  'H⁺ flows back to the matrix through ATP synthase; the rotor turns.',
  'ATP synthase couples proton flow to ADP + Pᵢ → ATP. Oxygen accepts electrons at the chain’s end.'
 ],'7-4-oxidative-phosphorylation','Compartment and coupling demonstration. Proton counts, electron-carrier geometry, and ATP yield are not stoichiometric or kinetic measurements.'),
 light:define('Light reactions',['chloroplast','thylakoid','chloroplast-atp-synthase'],24,[
  'Light excites photosystem II; water supplies replacement electrons and releases O₂.',
  'Electron transfer helps accumulate H⁺ in the thylakoid lumen.',
  'Light re-excites electrons at photosystem I; NADP⁺ is reduced to NADPH.',
  'H⁺ flows from the lumen to the stroma through ATP synthase, supporting ATP production.'
 ],'8-2-the-light-dependent-reactions-of-photosynthesis','Noncyclic electron flow, simplified. ATP and NADPH support the Calvin cycle, which is not animated here. Particle counts and display time do not encode stoichiometry.'),
 secretion:define('Protein secretion',['animal-cell','plant-cell'],24,[
  'A bound ribosome translates a secretory protein into the rough ER.',
  'Cargo leaves the ER inside a transport vesicle.',
  'The Golgi modifies and sorts cargo toward its trans face.',
  'A secretory vesicle fuses with the plasma membrane and releases its cargo.'
 ],'4-4-the-endomembrane-system-and-proteins','Representative secretory route. Compartment colors distinguish ER, Golgi, and plasma membrane; transport is condensed in time.'),
 translation:define('Translation',['ribosome','free-ribosome'],24,[
  'An initiator tRNA positions methionine at the start codon.',
  'A charged tRNA matches the next codon in the A site.',
  'A peptide bond transfers the chain from the P-site tRNA to the A-site amino acid.',
  'Translocation repeats until a stop codon recruits a release factor.'
 ],'15-5-ribosomes-and-protein-synthesis','An authored six-codon message. The 3D view follows nearby codons; the lesson diagram shows the full message. Subunits are opened to expose tRNA traffic and the growing N → C chain. Color identifies residues, not atoms. Factors, energy consumption and timing are simplified; the tiny peptide is not a complete functional protein.'),
 peptide:define('Peptide-bond formation',['polypeptide'],18,[
  'The growing chain is attached to a P-site tRNA; an A-site tRNA carries the next amino acid.',
  'The ribosome brings the incoming amino group near the chain’s carbonyl carbon.',
  'A new C–N peptide bond forms as the chain is transferred off its old tRNA.',
  'The longer chain remains attached to the A-site tRNA, ready for translocation.'
 ],'https://reactome.org/content/detail/R-HSA-5389857','Schematic ribosomal peptidyl transfer, not free-amino-acid dehydration. The activated peptidyl-tRNA ester is replaced by a C–N bond; no water is released by this transfer. Only the reacting groups are atom-colored (C gray, O red, N blue); side chains and tRNA are simplified.'),
 selection:define('Natural selection',['population','rabbit-population'],32,[
  'Inherited variation produces three genotypes at one locus.',
  'Genotype-dependent survival changes the reproductive gene pool.',
  'Random mating forms the next generation from surviving alleles.',
  'Repeated selection changes allele frequencies across generations.'
 ],'19-3-adaptive-evolution','Deterministic diploid viability selection: p′ = (p²wAA + pqwAa) / (p²wAA + 2pqwAa + q²waa). Random mating, infinite population, no mutation, migration, or drift. Organisms are a representative sample; genotype counts are rounded. Display colors mark genotypes. Fitness is a chosen scenario, not a measured effect of flower or fur color.'),
 predation:define('Predator–prey dynamics',['community'],32,[
  'Prey reproduction increases prey abundance.',
  'More prey supports an increase in predators.',
  'Higher predation can reduce prey abundance.',
  'Scarce prey limits predators, allowing prey to recover.'
 ],'45-6-community-ecology','Illustrative Lotka–Volterra model: dN/dt = 0.8N − 0.04NP; dP/dt = 0.02NP − 0.5P. RK4 integration, arbitrary time units, N₀=30, P₀=9. No carrying capacity, spatial effects, or calibration to a species. One animal icon represents approximately three model individuals.'),
 succession:define('Secondary succession',['ecosystem'],28,[
  'Disturbance removes vegetation while soil remains.',
  'Herbaceous plants establish in open soil.',
  'Shrubs and young trees expand as conditions change.',
  'A developing woodland changes shade and habitat structure.'
 ],'45-6-community-ecology','One authored 80-year secondary-succession scenario, not a forecast. Growth curves illustrate turnover; rates, species, and final communities vary with conditions.'),
};
for(const c of courseContent){const lab=labs[c.sim];processes[`topic-${c.topic}`]=define(lab.beats[0],['lesson-lab'],c.sim==='replication'?22:c.sim==='translation'?24:18,lab.beats,'https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf',lab.note);}
export const processesFor=id=>Object.entries(processes).filter(([,p])=>p.models.includes(id)).map(([id,p])=>({id,...p}));
// Match explanatory beats to the rig's binding, reaction and product events.
export const phaseStarts={catalysis:[0,.28,.48,.76],replication:[0,.08,.4,.94],diffusion:[0,.12,.3,.9],chemiosmosis:[0,.3,.58,.74],light:[0,.25,.5,.74],translation:[0,.12,.48,.87],peptide:[0,.32,.55,.82]};
export function phaseAt(id,t){const stops=phaseStarts[id]||[0,.25,.5,.75];return Math.max(0,stops.findLastIndex(start=>t>=start));}
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
export const interval=(t,a,b)=>ease((t-a)/(b-a));

export function selectionSeries(environment='favor-a',generations=12) {
 const fitness=environment==='favor-A'?[1,.75,.5]:environment==='neutral'?[1,1,1]:[.5,.75,1];
 const result=[];let p=.35;
 for(let generation=0;generation<=generations;generation++) {
  const q=1-p,zygotes=[p*p,2*p*q,q*q];
  const weighted=zygotes.map((f,i)=>f*fitness[i]),mean=weighted.reduce((a,b)=>a+b,0);
  const survivors=weighted.map(f=>f/mean);
  result.push({generation,p,q,zygotes,survivors,fitness,meanFitness:mean});
  p=survivors[0]+survivors[1]/2;
 }
 return result;
}
const derivative=([n,p])=>[.8*n-.04*n*p,.02*n*p-.5*p];
export function predatorSeries(duration=30,dt=.025) {
 let state=[30,9];const result=[];
 for(let i=0;i<=Math.round(duration/dt);i++) {
  result.push({t:i*dt,prey:state[0],predator:state[1]});
  const k1=derivative(state),k2=derivative(state.map((v,j)=>v+k1[j]*dt/2));
  const k3=derivative(state.map((v,j)=>v+k2[j]*dt/2)),k4=derivative(state.map((v,j)=>v+k3[j]*dt));
  state=state.map((v,j)=>Math.max(0,v+dt*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6));
 }
 return result;
}
const predators=predatorSeries();
const selectionCache=Object.fromEntries(['favor-A','favor-a','neutral'].map(e=>[e,selectionSeries(e)]));
export function diffusionPositions(t) {
 const blend=(a,b,f)=>a.map((v,i)=>v+(b[i]-v)*f);
 return Array.from({length:24},(_,i)=>{
  const from=i<20?1:-1,x=Math.sin(i*2.4)*1.9,z=Math.cos(i*2.4)*1.1,y=from*(1.18+(i%3)*.25);
  let f=0;
  if(i<8)f=interval(t,.12+i*.075,.3+i*.075);
  else if(i===18||i===22)f=interval(t,.3,.8);
  return f<.3?blend([x,y,z],[0,from*1.1,0],f/.3):f<.7?[0,from*(1.1-(f-.3)/.4*2.2),0]:blend([0,-from*1.1,0],[x,-y,z],(f-.7)/.3);
 });
}
export function sampleProcess(id,progress,environment='favor-a',options={}) {
 const t=clamp(progress),process=processes[id];if(!process)return null;
 const phase=phaseAt(id,t),state={id,t,phase,caption:process.steps[phase],time:`${Math.round(t*process.seconds)} / ${process.seconds} s`,metrics:[]};
 if(id.startsWith('topic-')){const c=courseContent.find(c=>c.topic===id.slice(6));return {...state,...sampleLab(c.sim,t,options.condition||'normal'),id};}
 if(id==='selection') {
  const exact=t*12,generation=Math.min(12,Math.floor(exact)),entry=selectionCache[environment][generation];
  Object.assign(state,entry,{cycle:exact-generation,series:selectionCache[environment]});
  state.time=`Generation ${generation} / 12`;state.phase=generation===12?3:Math.min(2,Math.floor(state.cycle*3));
  state.caption=process.steps[state.phase];
  state.metrics=[['A allele',`${(entry.p*100).toFixed(1)}%`],['a allele',`${(entry.q*100).toFixed(1)}%`]];
 } else if(id==='predation') {
  const entry=predators[Math.round(t*(predators.length-1))];Object.assign(state,entry,{t,modelTime:entry.t,series:predators});
  const [dn,dp]=derivative([entry.prey,entry.predator]);
  state.caption=dn>=0?(dp>=0?'Prey and predator populations are both increasing.':'Prey recover as predator abundance falls.'):(dp>=0?'Predators increase while prey decline.':'Both populations decline; prey are scarce.');
  state.time=`Time ${entry.t.toFixed(1)} / 30`;
  state.metrics=[['Prey',entry.prey.toFixed(1)],['Predators',entry.predator.toFixed(1)]];
 } else if(id==='succession') {
  state.years=t*80;state.grass=interval(t,0,.18)*(1-.75*interval(t,.45,1));state.shrubs=interval(t,.15,.5)*(1-.5*interval(t,.65,1));state.trees=interval(t,.25,1);state.time=`Year ${Math.round(state.years)} / 80`;
 } else if(id==='diffusion') {
  state.condition=options.condition||'normal';
  state.positions=diffusionPositions(options.condition==='closed'?0:t);state.top=state.positions.filter(p=>p[1]>=0).length;state.bottom=24-state.top;
  state.metrics=[['Above',String(state.top)],['Below',String(state.bottom)]];
  if(options.condition==='closed')state.caption='The channel is closed: this solute does not cross the lipid core in the model.';
 } else if(id==='replication') {
  Object.assign(state,replicationState(t,options));
  state.metrics=[['Leading',`${state.leading}/28`],['Lagging',`${state.lagging.length}/28`],['Unsealed nicks',String(state.nicks)]];
  if(state.condition==='helicase-off')state.caption='Without unwinding, the templates are not exposed and synthesis cannot advance.';
  else if(state.condition==='polymerase-off')state.caption='The model permits unwinding, but DNA polymerization is blocked. Real fork activities are coordinated.';
  else if(state.nicks)state.caption='The fragments have been copied, but the remaining nicks still require ligase.';
 } else if(id==='translation') {
  Object.assign(state,translationState(t,options));
  state.metrics=[['Codon',state.codons[state.current]],['Chain',state.chain.join('–')||'Not started']];
  state.caption=state.stage==='termination'?'A stop codon recruits a release factor; it does not encode an amino acid.':state.stage==='initiation'?process.steps[0]:state.stage==='peptide transfer'?process.steps[2]:state.stage==='translocation'?'The ribosome advances by one codon; the chain-bearing tRNA moves from A to P.':process.steps[1];
 } else if(id==='peptide') {
  Object.assign(state,peptideState(t,options));
  state.metrics=[['Residues',String(state.residues)],['Peptide bonds',String(state.bondCount)]];
  if(!state.charged)state.caption='An uncharged tRNA supplies no amino acid, so the chain cannot be extended.';
  else if(state.condition==='blocked')state.caption='With peptide transfer blocked, docking alone cannot form the new bond.';
 } else if(id==='chemiosmosis'||id==='light') {
  state.condition=options.condition||'normal';
  state.energyInput=state.condition==='dark'?0:1;
  state.coupling=state.condition==='leaky'?.2:1;
  state.atpYield=100*interval(t,.74,1)*state.energyInput*state.coupling;
  state.metrics=[['ATP index',state.atpYield.toFixed(0)],['Scale','normal endpoint = 100']];
  if(state.condition==='dark')state.caption='Starting without a stored gradient, no light-driven electron flow means no new ATP or NADPH in this model.';
  else if(state.condition==='leaky')state.caption='A proton bypass dissipates most of the gradient; less H⁺ return is coupled through ATP synthase.';
 }
 return state;
}
