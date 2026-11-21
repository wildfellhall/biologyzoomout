const clamp=x=>Math.max(0,Math.min(1,x));
const span=(t,a,b)=>clamp((t-a)/(b-a));
export const REPLICATION_BASES=28;
export const replicationHelixPoint=(i,side)=>{const a=i*.6+side*Math.PI;return [Math.cos(a)*.85,(i-13.5)*.22,-Math.sin(a)*.85];};
export function replicationState(t,{condition='normal'}={}){
 const n=REPLICATION_BASES,unwound=condition==='helicase-off'?0:n*span(t,.02,.68);
 const permitted=condition!=='polymerase-off'&&condition!=='helicase-off';
 const leading=permitted?Math.min(n,Math.floor(n*span(t,.08,.78)),Math.floor(unwound)):0;
 const fragments=Array.from({length:6},(_,block)=>{
  const start=block*5,end=Math.min(n-1,start+4),available=.02+(end+1)/n*.66;
  const count=permitted?Math.min(end-start+1,Math.floor(span(t,available,Math.min(.9,available+.16))*(end-start+1)+1e-8)):0;
  return {start,end,count,indices:Array.from({length:count},(_,i)=>end-i)};
 });
 const lagging=fragments.flatMap(f=>f.indices),sealed=condition!=='ligase-off'&&t>=.94&&leading===n&&lagging.length===n;
 const nicks=sealed?0:[5,10,15,20,25].filter(i=>lagging.includes(i)&&lagging.includes(i-1)).length;
 return {unwound,leading,lagging,fragments,sealed,primersReplaced:t>=.91&&permitted,nicks,condition};
}
const code={AUG:'Met',GCU:'Ala',GCC:'Ala',UUU:'Phe',UUC:'Phe',GAA:'Glu',GGA:'Gly',AAA:'Lys',UAA:'Stop',UAG:'Stop',UGA:'Stop'};
export const sequences={normal:['AUG','GCU','UUU','GAA','GGA','UAA'],silent:['AUG','GCC','UUU','GAA','GGA','UAA'],missense:['AUG','GCU','AAA','GAA','GGA','UAA'],stop:['AUG','GCU','UAA','GAA','GGA','UAA']};
export function translationState(t,{condition='normal'}={}){
 const codons=sequences[condition]||sequences.normal,stop=codons.findIndex(c=>code[c]==='Stop');
 // One initiation segment, four elongation cycles, then termination; the same
 // clock is used for every sequence so premature stops are directly comparable.
 const travel=span(t,.12,.87)*4,cycle=Math.min(3,Math.floor(travel)),local=travel>=4?1:travel-cycle;
 const current=Math.min(stop,1+cycle),termination=t>=.12+(stop-1)/4*.75;
 const released=termination&&t>=.12+(stop-1)/4*.75+.08;
 let length=t<.08?0:1+cycle+(local>=.48?1:0);
 length=Math.min(stop,length);
 const stage=t<.12?'initiation':termination?'termination':local<.22?'pairing':local<.48?'accommodation':local<.72?'peptide transfer':'translocation';
 const chain=codons.slice(0,length).map(c=>code[c]);
 return {codons,aminoAcids:codons.map(c=>code[c]),chain,length,stop,current:termination?stop:t<.12?0:current,cycle,local,stage,released,condition};
}
export function peptideState(t,{condition='normal'}={}){
 const charged=condition!=='uncharged',active=condition!=='blocked',formed=charged&&active&&t>=.55;
 return {charged,formed,transferred:formed&&t>=.72,bondCount:formed?3:2,residues:formed?4:3,approach:span(t,.05,.32),transfer:formed?span(t,.55,.82):0,condition};
}
