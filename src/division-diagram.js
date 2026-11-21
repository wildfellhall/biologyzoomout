import {esc} from './node-detail.js';
export function divisionDiagram(s){
 const rows=s.cellCount===4?2:1,height=rows===2?300:194,columns=Math.min(2,s.cellCount),width=550/columns;
 const text=(x,y,value,extra='')=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#273d32" ${extra}>${esc(value)}</text>`;
 let drawing=text(295,20,s.arrested?'Metaphase arrest':s.stage);
 for(const cell of s.cells){
  const column=rows===2?Math.floor(cell.id/2):cell.id%columns,row=rows===2?cell.id%2:0;
  const x=20+column*width,y=36+row*110,center=x+width/2;
  drawing+=`<rect x="${x+5}" y="${y}" width="${width-10}" height="98" rx="30" fill="#e3e9dd" stroke="#a4b49a"/>`;
  const members=cell.members.map(id=>s.chromatids[id]),span=Math.min(width-80,members.length*23);
  members.forEach((c,i)=>{
   const cx=center+(i-(members.length-1)/2)*span/Math.max(1,members.length),length=c.pair===0?28:20,base=c.homolog?'#bb7765':'#4a8a82',tip=c.distalOrigin?'#bb7765':'#4a8a82';
   drawing+=`<path d="M${cx} ${y+48}v-${length}" stroke="${base}" stroke-width="6" stroke-linecap="round" opacity="${c.opacity}"/><path d="M${cx} ${y+48-length}v7" stroke="${tip}" stroke-width="6" stroke-linecap="round" opacity="${c.opacity}"/>`;
   if(!c.separated&&c.sister===0&&s.replicated)drawing+=`<path d="M${cx} ${y+38}h${span/members.length}" stroke="#9987a7" stroke-width="2"/>`;
  });
  drawing+=text(center,y+70,`${cell.chromosomes} chromosomes`)+text(center,y+88,cell.contentC===null?`${cell.dna} DNA molecules`:`${Number(cell.contentC.toFixed(1))}C DNA`);
 }
 drawing+=text(295,height-31,'Teal / coral: homolog origin · long / short: chromosome pair')+text(295,height-11,'1C = DNA in one unreplicated haploid genome');
 return `<svg class="lesson-diagram" viewBox="0 0 590 ${height}" role="img" aria-label="${esc(s.stage)}: ${esc(s.metrics.map(m=>m.join(': ')).join('; '))}">${drawing}</svg>`;
}
