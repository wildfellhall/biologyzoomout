export const PRACTICE_KEY='biology-zoomout-practice-v1';
export const recordKey=q=>`${q.id}@${q.version}`;
export function loadPractice(storage){
 try{const p=JSON.parse(storage?.getItem(PRACTICE_KEY)||'null');if(p?.version===1&&p.records&&typeof p.records==='object'&&!Array.isArray(p.records))return p;}catch{}
 return {version:1,records:{}};
}
export function practiceRecord(progress,q){
 const key=recordKey(q),old=progress.records[key];
 if(old?.snapshot?.id===q.id&&old.snapshot.version===q.version&&Array.isArray(old.submissions)&&old.draft&&typeof old.draft==='object'&&!Array.isArray(old.draft)){
  old.choice=q.kind==='mcq'&&q.options.some(o=>o.id===old.choice)?old.choice:null;
  old.draft=Object.fromEntries(Object.entries(old.draft).filter(([key,value])=>/^[0-3]$/.test(key)&&typeof value==='string').map(([key,value])=>[key,value.slice(0,6000)]));
  old.correction=typeof old.correction==='string'?old.correction.slice(0,4000):'';
  old.ratings=Array.isArray(old.ratings)?[...new Set(old.ratings.filter(n=>Number.isInteger(n)&&n>=0&&n<4))]:[];
  old.submissions=old.submissions.filter(s=>s&&typeof s==='object'&&(q.kind==='mcq'?q.options.some(o=>o.id===s.choice):s.draft&&typeof s.draft==='object'&&!Array.isArray(s.draft)));
  for(const entry of old.submissions)if(q.kind==='frq'){entry.draft=Object.fromEntries(Object.entries(entry.draft).filter(([k,v])=>/^[0-3]$/.test(k)&&typeof v==='string'));entry.ratings=Array.isArray(entry.ratings)?entry.ratings.filter(n=>Number.isInteger(n)&&n>=0&&n<4):[];}
  old.reviewing=old.reviewing===true&&old.submissions.length>0&&(q.kind!=='mcq'||!!old.choice);
  return old;
 }
 // An item revision gets a separate key; previous versions are never reinterpreted.
 return progress.records[key]={snapshot:structuredClone(q),choice:null,draft:{},correction:'',ratings:[],submissions:[],reviewing:false};
}
export function savePractice(storage,progress){try{if(!storage)return false;storage.setItem(PRACTICE_KEY,JSON.stringify(progress));return true;}catch{return false;}}
export function submitPractice(progress,q,now=Date.now()){
 const r=practiceRecord(progress,q);
 if(q.kind==='mcq'){
  if(!q.options.some(o=>o.id===r.choice)||r.reviewing)return false;
  r.submissions.push({at:now,choice:r.choice,correct:r.choice===q.correct});
 }else{
  if(!Object.values(r.draft).some(text=>String(text).trim())||r.reviewing)return false;
  r.submissions.push({at:now,draft:structuredClone(r.draft),ratings:[]});
 }
 r.reviewing=true;return true;
}
