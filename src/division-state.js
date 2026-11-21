// A deterministic 2n = 4 teaching model. Display time is not biological time.
// Identity is retained for every homolog, sister and exchanged distal segment.
// Sources: College Board AP Biology CED, topics 4.5 and 5.1;
// https://www.ncbi.nlm.nih.gov/books/NBK430708/ (meiotic chromosome segregation).
const stage=(at,title,text)=>({at,title,text});
export const divisionStages={
 mitosis:[
  stage(0,'Before S phase','Two homologous pairs give this diploid cell four chromosomes. Each chromosome contains one DNA molecule.'),
  stage(.07,'S phase','DNA is copied before mitosis. DNA content rises from 2C to 4C; the four chromosomes acquire sister chromatids.'),
  stage(.18,'Prophase','Duplicated chromosomes condense. The two centrosomes move apart and the spindle begins to form.'),
  stage(.30,'Prometaphase','The nuclear envelope breaks down. Spindle microtubules attach to kinetochores on the sister chromatids.'),
  stage(.43,'Metaphase','Four duplicated chromosomes align individually. Sister kinetochores face opposite spindle poles; homologs do not pair as tetrads.'),
  stage(.56,'Anaphase','Sister chromatids separate and become individual chromosomes. One copy of every chromosome moves toward each pole.'),
  stage(.72,'Telophase','A nuclear envelope reforms around each complete chromosome set. Chromosomes begin to decondense.'),
  stage(.84,'Cytokinesis','An animal-cell cleavage furrow partitions the cytoplasm. Chromosome segregation and cell division are distinct events.'),
  stage(.96,'Two daughter cells','Each daughter has four chromosomes, two homologous sets and 2C DNA. Normal mitosis preserves the starting chromosome complement.'),
 ],
 meiosis:[
  stage(0,'Before S phase','The diploid starting cell has two homologous pairs: 2n = 4. Homologs have corresponding genes but can carry different alleles.'),
  stage(.05,'S phase','DNA is replicated once before meiosis. Four duplicated chromosomes now contain eight chromatids; there is no second S phase between divisions.'),
  stage(.13,'Prophase I','Homologous chromosomes pair. Each bivalent contains two homologs and four chromatids; sister chromatids stay associated.'),
  stage(.24,'Crossing over','During prophase I, corresponding segments exchange between two nonsister chromatids. The swapped colors trace segment origin, not new mutations.'),
  stage(.32,'Metaphase I','Homologous pairs align as bivalents. Each pair can orient independently; sister kinetochores act toward the same pole in this division.'),
  stage(.42,'Anaphase I','Homologous chromosomes separate. Sister chromatids remain joined, so each moving chromosome still contains two DNA molecules.'),
  stage(.54,'Telophase I & cytokinesis','The first division partitions homologous sets into two cells. In the normal run, each cell receives two duplicated chromosomes.'),
  stage(.62,'Interkinesis','Two haploid cells each contain n = 2 duplicated chromosomes and 2C DNA. No DNA replication occurs between meiosis I and II.'),
  stage(.68,'Prophase II','A spindle forms in each cell. The nuclear envelopes shown in this illustrative sequence break down again.'),
  stage(.74,'Metaphase II','Chromosomes align individually in each cell. Sister kinetochores now face opposite poles.'),
  stage(.82,'Anaphase II','Sister chromatids separate. Each becomes a chromosome; the exchanged segments remain attached to their tracked chromatids.'),
  stage(.91,'Telophase II & cytokinesis','Nuclear envelopes reform and both cells divide. DNA is distributed into four products without another replication.'),
  stage(.98,'Four products','Each normal product has n = 2 chromosomes and 1C DNA. Crossing over and the chosen pair orientations determine its allele combinations.'),
 ],
};
const clamp=x=>Math.max(0,Math.min(1,x));
const ramp=(t,a,b)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const fmt=n=>Number.isInteger(n)?String(n):n.toFixed(1);
export function divisionState(kind,time,condition='normal'){
 const t=clamp(time),meiotic=kind==='meiosis',arrested=!meiotic&&condition==='blocked'&&t>=.49,u=arrested?.49:t;
 const stages=divisionStages[kind],phase=Math.max(0,stages.findLastIndex(s=>u>=s.at));
 const replication=ramp(u,meiotic?.05:.07,meiotic?.13:.18),replicated=replication===1;
 const separateI=meiotic?ramp(u,.42,.54):0,separateII=meiotic?ramp(u,.82,.91):ramp(u,.56,.72);
 const firstDone=u>=(meiotic?.62:.96),secondDone=meiotic&&u>=.98;
 const nondisjunction=meiotic&&condition==='nondisjunction',crossing=meiotic&&condition!=='no-crossover'?ramp(u,.24,.31):0;
 const sideFor=(pair,homolog)=>nondisjunction&&pair===0?0:condition==='alternate'&&pair===1?1-homolog:homolog;
 const chromatids=[];
 for(let pair=0;pair<2;pair++)for(let homolog=0;homolog<2;homolog++)for(let sister=0;sister<2;sister++){
  const chromosome=pair*2+homolog,id=chromosome*2+sister,visible=sister===0||replication>0;
  const base=[(homolog-.5)*1.25,(.5-pair)*1.35,.08*Math.sin(id)],sisterOffset=(sister-.5)*.18*replication;
  let position,product,compartment,lean=0;
  if(meiotic){
   const side=sideFor(pair,homolog),rank=nondisjunction?(side===0?(pair===0?homolog:2):0):pair,count=nondisjunction?(side===0?3:1):2;
   const paired=[(homolog-.5)*.6+sisterOffset,(.5-pair)*1.45,0];
   const orientation=condition==='alternate'&&pair===1?1-homolog:homolog;
   const aligned=[(orientation-.5)*.62+sisterOffset,(.5-pair)*1.45,0];
   const inFirstCell=[(side?1.7:-1.7)+(rank-(count-1)/2)*.53+sisterOffset,0,0];
   position=mix(base.map((v,i)=>v+(i===0?sisterOffset:0)),paired,ramp(u,.13,.24));
   position=mix(position,aligned,ramp(u,.32,.41));position=mix(position,inFirstCell,separateI);
   // Rotate the two second-division spindles by 90 degrees. Sisters then
   // separate along y, without any new chromosome synthesis.
   const alignedII=[(side?1.7:-1.7)+(rank-(count-1)/2)*.58,(sister-.5)*.18,0];
   position=mix(position,alignedII,ramp(u,.68,.74));
   const final=[(side?1.7:-1.7)+(rank-(count-1)/2)*.48,sister?-1.22:1.22,0];
   position=mix(position,final,separateII);product=side*2+sister;
   compartment=secondDone?product:firstDone?side:0;
  }else{
   const aligned=[sisterOffset,(1.5-chromosome)*.9,0];
   position=mix(base.map((v,i)=>v+(i===0?sisterOffset:0)),aligned,ramp(u,.22,.43));
   if(condition==='blocked'&&chromosome===3)position[0]+=.5*ramp(u,.30,.43);
   const final=[(sister?1.72:-1.72)+(homolog-.5)*.55,(.5-pair)*.8,0];
   position=mix(position,final,separateII);product=sister;compartment=firstDone?product:0;
   lean=(sister?-1:1)*.22*Math.sin(separateII*Math.PI);
  }
  const exchanged=meiotic&&pair===0&&((homolog===0&&sister===1)||(homolog===1&&sister===0));
  chromatids.push({id,chromosome,pair,homolog,sister,visible,opacity:sister?replication:1,position,product,compartment,
   separated:meiotic?u>=.82:u>=.56,distalOrigin:exchanged&&crossing===1?1-homolog:homolog,
   exchange:exchanged?crossing:0,lean,length:pair===0?.92:.66});
 }
 const divisionCount=meiotic?(secondDone?2:firstDone?1:0):(firstDone?1:0),cellCount=2**divisionCount;
 const cells=Array.from({length:cellCount},(_,i)=>{
  const members=chromatids.filter(c=>c.visible&&c.compartment===i);
  const chromosomes=new Set(members.map(c=>c.separated?c.id:c.chromosome)).size;
  const dna=replicated?members.length:4*(1+replication);
  // Chromosome lengths are not calibrated DNA masses. For aneuploid cells,
  // report DNA-molecule counts rather than inventing fractional C values.
  return {id:i,chromosomes,dna,contentC:nondisjunction&&divisionCount>0?null:dna/2,members:members.map(c=>c.id)};
 });
 const distribution=meiotic?Array.from({length:4},(_,i)=>chromatids.filter(c=>c.product===i).length):[4,4];
 let caption=stages[phase].text;
 if(arrested)caption='One kinetochore remains unattached, and the spindle checkpoint prevents sister separation. Four duplicated chromosomes and 4C DNA remain in one cell; cytokinesis does not proceed.';
 if(meiotic&&condition==='no-crossover'&&phase===3)caption='Crossing over is omitted in this controlled comparison. Chromatids retain their original segment colors; segregation is held normal to isolate the reshuffling effect.';
 if(nondisjunction&&u>=.42)caption=u<.62?'Both homologs of the long pair move to the same pole in meiosis I. Sister chromatids remain joined.':u<.82?'The two cells have three and one duplicated chromosomes. No second DNA replication occurs.':'Sisters separate in meiosis II, but cannot correct the earlier error. Final products receive 3, 3, 1 and 1 chromosomes (n + 1 or n − 1).';
 const chromosomesText=cells.map(c=>c.chromosomes).join(' / '),dnaText=cells.map(c=>c.contentC===null?`${c.dna} molecules`:`${fmt(c.contentC)}C`).join(' / ');
 return {kind,t,condition,phase,stage:stages[phase].title,caption,axis:'Model progress',replication,replicated,separateI,separateII,crossing,arrested,nondisjunction,
  chromatids,cells,cellCount,distribution,divisionCount,divides:!arrested,dna:cells[0].dna,
  value:meiotic?(secondDone?distribution[0]:firstDone?cells[0].chromosomes:4):(firstDone?2:0),
  condensation:ramp(u,meiotic?.13:.18,meiotic?.22:.30)*(1-ramp(u,meiotic?.94:.76,meiotic?1:1)),
  membraneI:ramp(u,meiotic?.54:.84,meiotic?.62:.96),membraneII:meiotic?ramp(u,.91,.98):0,
  envelope:meiotic?(u<.54?1-ramp(u,.25,.32):u<.68?ramp(u,.54,.62):u<.91?1-ramp(u,.68,.74):ramp(u,.91,.98)):(1-ramp(u,.27,.34))+ramp(u,.72,.84),
  spindle:meiotic?(u<.62?ramp(u,.22,.32)*(1-ramp(u,.54,.62)):ramp(u,.68,.74)*(1-ramp(u,.91,.98))):ramp(u,.2,.34)*(1-ramp(u,.72,.84)),
  metrics:[['Stage',arrested?'Metaphase arrest':stages[phase].title],['Cells',String(cellCount)],['Chromosomes per cell',chromosomesText],['DNA per cell',dnaText]],
 };
}
