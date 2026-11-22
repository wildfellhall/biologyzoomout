const clamp=t=>Math.max(0,Math.min(1,t));
const span=(t,a,b)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x);};
export const endomembranePhases={'er-protein':[0,.12,.52,.76],'golgi-sorting':[0,.22,.68,.82],'er-lipids':[0,.25,.5,.74],'er-calcium':[0,.18,.48,.72]};
// Deterministic schematic states: replay and reverse scrubbing never integrate
// a previous frame. Display time does not represent measured reaction rates.
export function endomembraneState(id,t){
 t=clamp(t);
 if(id==='er-protein')return {residues:Math.round(18*span(t,.12,.52)),fold:span(t,.52,.72),export:span(t,.76,1),dock:span(t,0,.12)};
 if(id==='golgi-sorting')return {arrival:span(t,0,.22),maturation:span(t,.22,.68),sort:span(t,.68,.82),departure:span(t,.82,1),glycans:Math.floor(3*span(t,.27,.65))};
 if(id==='er-lipids')return {assembly:span(t,.08,.48),insert:span(t,.5,.72),redistribute:span(t,.74,1)};
 if(id==='er-calcium'){
  const phase=t<.48?0:t<.72?1:2;
  const transferred=phase===0?Math.round(12*span(t,.18,.48)):phase===1?12-Math.round(8*span(t,.48,.72)):4+Math.round(8*span(t,.72,1));
  return {calciumPhase:phase,stored:transferred,cytosolic:12-transferred,pump:phase===0?span(t,.18,.48):span(t,.72,1),release:span(t,.48,.72)};
 }
 return null;
}
