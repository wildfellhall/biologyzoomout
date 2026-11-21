import {esc} from './node-detail.js';
const option=(id,label)=>({id,label});
export const activities={
 membranes:{prompt:'With the same starting concentrations, what changes if the channel closes?',options:[option('normal','Channel open'),option('closed','Channel closed')],note:'24 particles in equal volumes; an impermeable lipid core is assumed for this solute.',check:{prompt:'A channel makes diffusion possible. What supplies the net driving difference?',answers:['The concentration difference','ATP consumed by the channel','A permanent one-way gate'],correct:0,feedback:'A channel supplies access. The concentration difference gives diffusion a net direction.'}},
 gradient:{prompt:'How will a proton bypass affect ATP production relative to the intact membrane?',options:[option('normal','Intact membrane'),option('leaky','H⁺ bypass')],note:'Illustrative relative ATP index: normal endpoint = 100; the chosen leak leaves 20% coupling. These are assumptions, not ATP counts or measurements.',check:{prompt:'Which path couples H⁺ return to ATP production?',answers:['Across any part of the membrane','Through ATP synthase','Directly into oxygen'],correct:1,feedback:'ATP synthase couples proton return to catalysis. A bypass can dissipate the gradient without producing ATP.'}},
 light:{prompt:'Starting without a stored gradient, what will happen if the light input is removed?',options:[option('normal','Light on'),option('dark','Light off'),option('leaky','Light on · H⁺ bypass')],note:'A qualitative light-reaction model with no initial gradient, cyclic flow or stored energy. ATP index is relative, not a molecule count.',check:{prompt:'Which input supplies the carbon in newly fixed organic molecules?',answers:['Light','Water','Carbon dioxide'],correct:2,feedback:'Carbon dioxide supplies carbon. Light provides energy; water supplies electrons and the oxygen released as O₂.'}},
 selection:{prompt:'Will A become more or less common, or stay constant, under this selection pressure?',options:[option('favor-a','Favor aa'),option('neutral','Equal fitness'),option('favor-A','Favor AA')],note:'Same starting A frequency (0.35) in every run. Random mating, viability selection and an infinite population; no mutation, migration or drift.',check:{prompt:'What evolves in this model?',answers:['An individual’s alleles because it needs them','The population’s allele frequencies','Every rabbit’s genotype at once'],correct:1,feedback:'Selection changes which inherited alleles contribute to later generations. The population’s frequencies change.'}},
 replication:{prompt:'Predict which strands or backbone connections will remain incomplete.',options:[option('normal','All activities working'),option('helicase-off','Block helicase'),option('polymerase-off','Block DNA polymerase'),option('ligase-off','Block ligase')],note:'One fork and 28 displayed positions. Activities are isolated for comparison; in cells the machinery is coordinated. Primer replacement is simplified.',check:{prompt:'Why can two oppositely oriented templates still be copied?',answers:['Polymerase reverses its chemical direction','One new strand uses repeated starts','Ligase synthesizes the second strand'],correct:1,feedback:'Repeated starts let each lagging-strand fragment grow 5′ → 3′ away from the fork. Ligase later seals nicks.'}},
 translation:{prompt:'Predict the amino-acid sequence and whether the product will be shorter.',options:[option('normal','Original message'),option('silent','GCU → GCC · synonymous'),option('missense','UUU → AAA · missense'),option('stop','UUU → UAA · early stop')],note:'An authored six-codon message using the standard genetic code. The resulting short peptide is a teaching example, not a whole functional protein.',check:{prompt:'A stop codon specifies…',answers:['An amino acid named Stop','A new reading frame','Termination through a release factor'],correct:2,feedback:'Stop codons are recognized by release factors. No stop amino acid is added to the chain.'}},
 polypeptide:{prompt:'Can a fourth residue join if the incoming tRNA is uncharged or transfer is blocked?',options:[option('normal','Charged tRNA · transfer active'),option('uncharged','Incoming tRNA uncharged'),option('blocked','Peptide transfer blocked')],note:'Reacting groups and three existing residues are enlarged. Ribosomal transfer uses activated tRNAs; it is not the free-amino-acid dehydration diagram.',check:{prompt:'Which end gains the incoming amino-acid residue?',answers:['The C-terminal end','The original N-terminal end','Either end with equal probability'],correct:0,feedback:'Peptide transfer adds a new residue at the C-terminal end. The original N terminus remains the N terminus.'}},
};
const STORE='biology-zoomout-experiments-v1';
export function loadExperiments(storage){
 const clean={};
 try{const raw=JSON.parse(storage?.getItem(STORE)||'{}');for(const [id,config]of Object.entries(activities)){
  const r=raw[id];if(!r||typeof r!=='object')continue;
  clean[id]={condition:config.options.some(o=>o.id===r.condition)?r.condition:config.options[0].id,prediction:typeof r.prediction==='string'?r.prediction.slice(0,1000):'',runs:Array.isArray(r.runs)?r.runs.filter(run=>config.options.some(o=>o.id===run.condition)&&typeof run.result==='string').slice(-3).map(run=>({condition:run.condition,result:run.result.slice(0,300),prediction:String(run.prediction||'').slice(0,1000)})):[]};
 }}catch{}return clean;
}
export function saveExperiments(storage,data){try{storage?.setItem(STORE,JSON.stringify(data));}catch{}}
export function experimentResult(id,s){
 if(id==='translation')return `${s.chain.join('–')} · ${s.length} residues${s.released?' · released':''}`;
 if(id==='replication')return `${s.leading} leading + ${s.lagging.length} lagging nucleotides; ${s.nicks} unsealed nicks`;
 if(id==='polypeptide')return `${s.residues} residues · ${s.bondCount} peptide bonds`;
 if(id==='selection')return `A = ${(s.p*100).toFixed(1)}% after ${s.generation} generations`;
 if(id==='membranes')return `${s.top} above · ${s.bottom} below`;
 return `ATP index ${s.atpYield.toFixed(0)} (normal = 100)`;
}

// Inline SVG schematics share the animation's state, rather than playing an
// unrelated decorative loop. Buttons below the diagram select the same moments.
export function diagramSVG(id,s){
 const color='#557966',warm='#bd9c68',accent='#b95c43';
 const text=(x,y,value,fill='#273d32')=>`<text x="${x}" y="${y}" fill="${fill}">${esc(value)}</text>`;
 const line=(x,y,x2,y2,c=color,dash='')=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="${c}" stroke-width="3" ${dash?'stroke-dasharray="5 4"':''}/>`;
 let shape='';
 if(id==='replication'){
  const open=(s?.unwound||0)>0,leading=(s?.leading||0)/28,lagging=(s?.lagging?.length||0)/28;
  shape=line(280,25,280,44,warm)+line(292,25,292,44,warm);
  if(open){
   shape+=line(280,44,160,92,warm)+line(292,44,410,92,warm)+text(250,75,'Fork ↑');
   if(leading)shape+=line(172,92,172+103*leading,92-41*leading,color);
   if(lagging)shape+=line(398,92,398-96*lagging,92-41*lagging,color,!s.sealed);
  }else shape+=line(280,44,280,92,warm)+line(292,44,292,92,warm)+text(325,68,'Paired templates');
  shape+=text(220,15,'Parental DNA')+text(72,108,`Leading: ${s?.leading||0}/28`)+text(360,108,`Lagging: ${s?.lagging?.length||0}/28`);
 }else if(id==='translation'){
  const codons=s?.codons||['AUG','GCU','UUU','GAA','GGA','UAA'];
  shape+=text(8,34,'5′')+text(560,34,'3′');
  codons.forEach((codon,i)=>{const x=35+i*85;shape+=`<rect x="${x}" y="12" width="73" height="34" rx="4" fill="${i===s?.current?'#dce6d6':'#ecece2'}" stroke="${i===s?.current?color:'#d6dacc'}"/>`+text(x+19,34,codon);});
  shape+=line(45,62,540,62)+text(45,92,s?.chain?.length?`N → ${s.chain.join(' – ')} → C`:'No residues yet')+text(400,112,s?.released?'Released':s?.stage||'initiation',accent);
 }else if(id==='polypeptide'){
  const charged=s?.charged!==false;
  shape+=text(25,24,s?.formed?'Chain transferred to A-site tRNA':'Chain on P-site tRNA')+text(354,24,charged?'Incoming residue':'Uncharged tRNA');
  shape+=text(100,62,'C = O');
  if(charged){shape+=text(350,62,'N – Cα')+line(142,58,345,58,s?.formed?color:'#b6b9ad',!s?.formed)+line(412,68,412,99,warm);}
  shape+=text(206,45,s?.formed?'C–N formed':!charged?'No amino acid':s?.condition==='blocked'?'Transfer blocked':'approach',accent);
  if(!s?.formed)shape+=line(100,68,100,99,warm);
  shape+=text(55,119,'P-site tRNA')+text(370,119,'A-site tRNA');
 }else if(id==='membranes'){
  shape+=`<rect x="70" y="51" width="460" height="18" rx="6" fill="#c8b88d"/><rect x="269" y="43" width="42" height="34" rx="9" fill="#879db0"/>`;
  shape+=text(76,25,`Above: ${s?.top??20}`)+text(76,103,`Below: ${s?.bottom??4}`)+text(343,104,s?.top===20?'Concentration difference':'Both directions');
  for(let i=0;i<24;i++){const above=i<(s?.top??20);shape+=`<circle cx="${160+(i%10)*31}" cy="${above?24+(i%2)*13:90+(i%2)*13}" r="4" fill="${color}"/>`;}
 }else if(id==='selection'){
  const p=s?.p??.35;shape+=text(45,25,'A allele')+text(410,25,'a allele');
  shape+=`<rect x="45" y="39" width="490" height="26" rx="4" fill="#d8bb98"/><rect x="45" y="39" width="${490*p}" height="26" rx="4" fill="${color}"/>`;
  shape+=text(45,94,`${(p*100).toFixed(1)}% A`)+text(370,94,`Generation ${s?.generation||0}`);
 }else{
  const light=id==='light';shape+=text(25,23,light?(s?.energyInput===0?'Light off':'Light'):'Electron transfer')+text(230,23,'H⁺ gradient')+text(436,23,'ATP synthase');
  shape+=line(120,49,225,49)+line(335,49,436,49)+`<circle cx="285" cy="49" r="30" fill="#ece4c7"/>`+text(269,54,'H⁺');
  const yieldValue=s?.atpYield||0;shape+=`<rect x="436" y="43" width="${yieldValue}" height="12" rx="3" fill="${color}"/>`+text(426,94,`ATP index: ${yieldValue.toFixed(0)}`);
  shape+=text(25,112,light?'H⁺ returns to the stroma':'H⁺ returns to the matrix');
 }
 return `<svg class="lesson-diagram" viewBox="0 0 590 130" role="img" aria-label="${esc(id)} process diagram">${shape}</svg>`;
}

export function activityMarkup(id,saved){
 const c=activities[id];if(!c)return '';
 return `<div class="activity-tabs" role="tablist" aria-label="Explore the explanation"><button role="tab" id="diagram-tab" aria-controls="diagram-pane" aria-selected="true" data-activity-tab="diagram">Diagram</button><button role="tab" id="experiment-tab" aria-controls="experiment-pane" aria-selected="false" tabindex="-1" data-activity-tab="experiment">Experiment</button><button role="tab" id="check-tab" aria-controls="check-pane" aria-selected="false" tabindex="-1" data-activity-tab="check">Quick question</button></div>
 <div id="diagram-pane" role="tabpanel" aria-labelledby="diagram-tab"><div id="lesson-diagram"></div><div id="lesson-cues"></div><p id="lesson-cue-text" aria-live="polite" aria-atomic="true"></p></div>
 <div id="experiment-pane" role="tabpanel" aria-labelledby="experiment-tab" hidden><p class="experiment-question">${esc(c.prompt)}</p><label class="experiment-condition">Condition<select id="experiment-condition">${c.options.map(o=>`<option value="${o.id}" ${o.id===saved.condition?'selected':''}>${esc(o.label)}</option>`).join('')}</select></label><label class="experiment-predict">Your prediction<textarea id="experiment-prediction" rows="2" maxlength="1000" placeholder="What will change, and why?">${esc(saved.prediction)}</textarea></label><div class="experiment-actions"><button id="experiment-run">Run experiment ▶</button><button id="experiment-reset">Reset model</button></div><p id="experiment-status" role="status"></p><div id="experiment-history"></div><details class="experiment-assumptions"><summary>Model assumptions</summary><p>${esc(c.note)}</p></details></div>
 <div id="check-pane" role="tabpanel" aria-labelledby="check-tab" hidden><p>${esc(c.check.prompt)}</p><div class="quick-choices">${c.check.answers.map((a,i)=>`<button data-quick-choice="${i}" aria-pressed="false">${esc(a)}</button>`).join('')}</div><p id="quick-feedback" role="status" hidden></p></div>
 <output id="lesson-live-metrics"></output>`;
}
