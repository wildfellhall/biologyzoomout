// Display quantities derive from the lesson's existing quantitative model.
// Representative organisms are not an independent population simulation.
export const clamp=x=>Math.max(0,Math.min(1,x));
export const ramp=(t,a,b)=>clamp((t-a)/(b-a));
export const point=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function apportion(total,weights){
 const sum=weights.reduce((a,b)=>a+b,0);if(!sum)return weights.map(()=>0);
 const exact=weights.map(v=>total*v/sum),counts=exact.map(Math.floor);
 const order=exact.map((v,i)=>({i,rest:v-counts[i]})).sort((a,b)=>b.rest-a.rest||a.i-b.i);
 const remaining=total-counts.reduce((a,b)=>a+b,0);
 for(let j=0;j<remaining;j++)counts[order[j].i]++;
 return counts;
}
export function ecologyDisplay(kind,s){
 if(kind==='population-growth'||kind==='logistic')return {rabbits:Math.min(40,Math.round(s.value/20)),perRabbit:20,capacity:s.capacity??null};
 if(kind==='community')return {rabbits:Math.round(s.herbivore/10),foxes:Math.round(s.predator/5),shoots:Math.round(s.plant/10)};
 if(kind==='disturbance')return {algae:Math.round(s.algae*.4),oxygen:Math.round(s.value*.24),detritus:Math.round(s.decomposition*.24)};
 if(kind==='speciation')return {left:apportion(16,[s.a,1-s.a]),right:apportion(16,[s.b,1-s.b])};
 if(kind==='variation')return {counts:apportion(Math.round(s.value*.3),s.distribution)};
 const weights=s.distribution||(s.p==null?[1]:[s.p,1-s.p]);return {counts:apportion(30,weights)};
}
export function transportPositions(kind,s){
 const total=kind==='channel'||kind==='compartments'?24:kind==='active-transport'?36:20;
 const initial=kind==='channel'?4:kind==='compartments'?3:kind==='active-transport'?24:0;
 const crossed=kind==='compartments'?9*(1-s.value/100):s.blocked?0:(kind==='channel'?8:kind==='active-transport'?12:16)*ramp(s.t,.15,.85);
 return Array.from({length:total},(_,i)=>{
  let u=i<initial?1:clamp(crossed-(i-initial));
  if(kind==='channel'&&!s.blocked&&s.t>.85){if(i===0)u=1-ramp(s.t,.85,1);if(i===total-1)u=ramp(s.t,.85,1);}
  const x=(i%7-3)*.62,z=(Math.floor(i/7)%3-1)*.52;
  const pore=kind==='channel'||kind==='active-transport';
  return [pore?x*Math.abs(1-2*u):x,(1.25+.22*(i%3))*(1-2*u),pore?z*Math.abs(1-2*u):z];
 });
}
