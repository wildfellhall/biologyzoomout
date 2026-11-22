export const VISUAL_KEY='biology-zoomout-visual-practice-v1';
export const visualKey=(a,mode)=>`${a.id}@${a.version}/${mode}`;
export function loadVisual(storage){try{const v=JSON.parse(storage?.getItem(VISUAL_KEY)||'null');if(v?.version===1&&v.records&&typeof v.records==='object'&&!Array.isArray(v.records))return v;}catch{}return {version:1,records:{}};}
export function saveVisual(storage,data){try{if(!storage)return false;storage.setItem(VISUAL_KEY,JSON.stringify(data));return true;}catch{return false;}}
export function validPlacement(a,placements={}){
 const result={},used=new Set();for(const s of a.slots){const p=placements?.[s.id];if(a.parts.some(part=>part.id===p)&&!used.has(p)){result[s.id]=p;used.add(p);}}return result;
}
export function visualRecord(data,a,mode){
 const key=visualKey(a,mode);let r=data.records[key];
 if(!r||r.snapshot?.id!==a.id||r.snapshot?.version!==a.version||!Array.isArray(r.attempts))r=data.records[key]={snapshot:structuredClone(a),placements:{},attempts:[],checked:false,assisted:false};
 r.placements=validPlacement(a,r.placements);r.attempts=r.attempts.filter(x=>x&&typeof x==='object'&&x.placements&&Array.isArray(x.correctSlots));
 r.checked=r.checked===true&&a.slots.every(s=>r.placements[s.id])&&r.attempts.length>0;r.assisted=r.assisted===true;return r;
}
export function placePart(a,r,part,slot){
 if(!a.parts.some(p=>p.id===part)||!a.slots.some(s=>s.id===slot))return false;
 for(const key of Object.keys(r.placements))if(r.placements[key]===part)delete r.placements[key];
 r.placements[slot]=part;r.checked=false;return true;
}
export function scorePlacement(a,placements){return a.slots.filter(s=>s.accepts.includes(placements[s.id])).map(s=>s.id);}
export function checkVisual(a,r,now=Date.now()){
 if(r.checked||!a.slots.every(s=>r.placements[s.id]))return false;
 r.attempts.push({at:now,placements:{...r.placements},correctSlots:scorePlacement(a,r.placements),assisted:r.assisted});r.checked=true;return true;
}
export function revealVisual(a,r){
 if(!r.attempts.length)return false;
 // The default construction uses unique part IDs; equivalent alternatives
 // (the two heterozygote pieces) are accepted when assessing student work.
 r.placements=Object.fromEntries(a.slots.map((s,i)=>[s.id,a.parts[i].id]));r.assisted=true;r.checked=false;checkVisual(a,r);return true;
}
