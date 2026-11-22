// Original vector schematics. They also supply extruded geometry in the 3D
// assembly workspace; no external image requests or answer text are embedded.
const c='#557f75',gold='#c2a46a',rose='#a47f9b',blue='#7f9eaf';
const line=(x,y,a,b,color=c,w=5,dash='')=>`<path d="M${x} ${y}L${a} ${b}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
const circle=(x,y,r,color=c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const ellipse=(x,y,rx,ry,color=c)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${color}"/>`;
const box=(x,y,w,h,color=c,r=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${color}"/>`;
const arrow=(x,y,a,b,color=c)=>line(x,y,a,b,color,4)+`<path transform="translate(${a} ${b}) rotate(${Math.atan2(b-y,a-x)*180/Math.PI})" d="M-8 -7L0 0L-8 7" fill="none" stroke="${color}" stroke-width="4"/>`;
const dots=(n,color=c)=>Array.from({length:n},(_,i)=>circle(22+(i%4)*25,24+Math.floor(i/4)*25,8,Array.isArray(color)?color[i%color.length]:color)).join('');
const chromosome=(x,color=c)=>line(x-12,20,x+12,80,color,9)+line(x+12,20,x-12,80,color,9)+circle(x,50,6,gold);
const plant=(x=60)=>line(x,85,x,25,c,5)+`<path d="M${x} 54Q${x-43} 52 ${x-31} 29Q${x} 31 ${x} 54M${x} 68Q${x+43} 65 ${x+31} 42Q${x} 43 ${x} 68" fill="${c}"/>`+circle(x,20,10,gold);
const cell=(x=60,y=50,r=34,color=c)=>ellipse(x,y,r,r*.8,color)+ellipse(x+5,y-2,r*.74,r*.58,'#d9e2ce')+circle(x-6,y-2,r*.25,rose);
const dna=()=>Array.from({length:8},(_,i)=>{const y=10+i*11,x=60+Math.sin(i*.9)*24,a=120-x;return line(x,y,a,y,gold,4)+circle(x,y,4,c)+circle(a,y,4,blue)+(i?line(60+Math.sin((i-1)*.9)*24,y-11,x,y,c,4)+line(60-Math.sin((i-1)*.9)*24,y-11,a,y,blue,4):'');}).join('');
const curve=(path,color=c,w=5)=>`<path d="${path}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
export function glyph(shape){
 if(shape==='water')return line(60,60,32,28,gold)+line(60,60,88,28,gold)+circle(60,60,22,'#b96f61')+circle(32,28,13,'#bfc8bc')+circle(88,28,13,'#bfc8bc');
 if(shape==='oxygen')return circle(60,50,28,'#b96f61');
 if(shape==='hydrogen')return circle(60,50,20,'#bfc8bc');
 if(['ion','ligand','substrate'].includes(shape))return shape==='substrate'?`<path d="M27 65L27 37L55 20L86 39L86 66L55 82Z" fill="${gold}"/>`:circle(60,50,23,shape==='ion'?blue:gold)+circle(54,43,7,'#e6dfba');
 if(['phosphate','amino'].includes(shape))return [line(60,50,30,22),line(60,50,90,22),line(60,50,60,82),circle(60,50,17,shape==='amino'?blue:gold),circle(30,22,12,rose),circle(90,22,12,rose),circle(60,82,12,rose)].join('');
 if(['hexagon','pentagon','base'].includes(shape))return `<path d="${shape==='pentagon'?'M60 14L95 39L82 79H38L25 39Z':shape==='base'?'M25 24H95V76H25Z':'M60 12L94 31V69L60 88L26 69V31Z'}" fill="${shape==='base'?rose:c}"/>`;
 if(['bond','bonds','bridge','broken-bond','dashed'].includes(shape))return circle(22,50,13,c)+circle(98,50,13,shape==='bridge'?gold:blue)+(shape==='broken-bond'?line(35,50,51,50,gold)+line(70,50,85,50,gold):line(35,50,85,50,shape==='bridge'?gold:c,shape==='dashed'?3:6,shape==='dashed'?'5 6':''));
 if(['chain','strand','rna','fragments','exons'].includes(shape))return Array.from({length:7},(_,i)=>{const x=15+i*15,y=50+Math.sin(i*.8)*18;return (i&&!(shape==='fragments'&&i===4)?line(x-15,50+Math.sin((i-1)*.8)*18,x,y,gold,4):'')+circle(x,y,shape==='exons'?9:7,shape==='rna'?(i%2?blue:rose):[c,gold,blue][i%3]);}).join('');
 if(['bases','shifted-bases','base-pair'].includes(shape)){let out='';for(let i=0;i<(shape==='base-pair'?2:6);i++){const x=shape==='base-pair'?30+i*38:10+i*17;out+=box(x,shape==='shifted-bases'&&i>1?46:30,14,24,[c,gold,rose][i%3]);}return out+line(12,69,108,69,blue,3);}
 if(shape==='branched')return curve('M15 80L60 50L105 80M60 50V16M60 50L20 18M60 50L103 18',c,6)+[circle(15,80,8),circle(105,80,8),circle(60,16,8),circle(20,18,8),circle(103,18,8)].join('');
 if(['fibers','cell-wall'].includes(shape))return Array.from({length:5},(_,i)=>curve(`M15 ${20+i*15}Q60 ${35+i*10} 105 ${12+i*15}`,i%2?gold:c,shape==='cell-wall'?8:5)).join('');
 if(shape==='heads')return [24,50,76].map(y=>[25,50,75,100].map(x=>circle(x,y,8,c)).join('')).join('');
 if(['tails','bent-tail'].includes(shape))return [25,50,75,100].map(x=>curve(`M${x} 17L${x} 48L${x+(shape==='bent-tail'?13:3)} 65L${x+2} 88`,gold,6)).join('');
 if(['channel','carrier','receptor'].includes(shape))return box(18,35,84,30,'#d6c69e')+ellipse(47,50,13,39,rose)+ellipse(75,50,13,39,rose)+(shape==='receptor'?curve('M47 14Q60 40 75 14',gold,5):circle(60,50,6,blue));
 if(['protein','enzyme','pocket','complex'].includes(shape)){let out=Array.from({length:7},(_,i)=>ellipse(60+Math.cos(i*.85)*26,50+Math.sin(i*.85)*23,15,17,shape==='complex'&&i>3?gold:c)).join('');if(['enzyme','pocket'].includes(shape))out+=`<path d="M76 22L112 35L95 66L71 53Z" fill="#eeede5"/>`;return out;}
 if(['cell','vesicle','volume','boundary','bacterium','symbiosis'].includes(shape))return shape==='symbiosis'?cell()+ellipse(70,58,15,7,gold):shape==='volume'?ellipse(60,50,42,32,blue):shape==='boundary'?`<ellipse cx="60" cy="50" rx="44" ry="32" fill="none" stroke="${c}" stroke-width="8"/>`:shape==='bacterium'?box(16,30,88,40,c,20)+curve('M30 50Q50 25 75 54T96 50',gold,3):cell();
 if(['two-cells','four-cells','few-cells','variation'].includes(shape)){const n=shape==='two-cells'?2:shape==='few-cells'?3:shape==='four-cells'?4:9;return Array.from({length:n},(_,i)=>cell(n<=4?30+(i%2)*60:20+(i%3)*40,n<=4?(n===2?50:25+Math.floor(i/2)*50):18+Math.floor(i/3)*32,n<=4?20:12,[c,gold,rose][i%3])).join('');}
 if(['docking','fusion'].includes(shape))return curve('M12 76H108',c,7)+cell(60,shape==='fusion'?60:31,23,rose)+(shape==='fusion'?curve('M34 76Q60 15 86 76',c,6):arrow(60,50,60,66,gold));
 if(['er','golgi','folded-membrane','mitochondrion'].includes(shape)){let out=Array.from({length:5},(_,i)=>curve(`M18 ${15+i*16}Q60 ${36+i*11} 102 ${12+i*16}`,shape==='golgi'?rose:c,7)).join('');if(shape==='er')out+=[25,45,65,85].map(x=>circle(x,16,4,rose)).join('');if(shape==='mitochondrion')out+=`<ellipse cx="60" cy="50" rx="51" ry="43" fill="none" stroke="${gold}" stroke-width="5"/>`;return out;}
 if(['gradient','ions'].includes(shape))return line(12,50,108,50,gold,7)+[20,40,60,80,100].map(x=>circle(x,22,6,blue)).join('')+[36,84].map(x=>circle(x,78,6,blue)).join('');
 if(shape==='helix')return curve('M60 7C15 7 15 27 60 27S105 47 60 47S15 67 60 67S105 87 60 93',c,9);
 if(['dna','two-dna'].includes(shape))return shape==='two-dna'?`<g transform="translate(0 15) scale(.6)">${dna()}</g><g transform="translate(50 15) scale(.6)">${dna()}</g>`:dna();
 if(['fork','primers'].includes(shape))return curve('M53 10V36L18 88M67 10V36L102 88',gold,5)+curve('M44 53L26 82M76 53L89 70M94 76L99 84',shape==='primers'?rose:c,5);
 if(shape==='ribosome')return ellipse(60,34,43,26,rose)+ellipse(60,72,33,16,gold)+line(9,57,111,57,blue,4);
 if(shape==='trna')return curve('M50 15V38L22 40V57H45V83H75V57H98V40L70 38V15',c,5)+circle(60,12,9,gold);
 if(['chromosome','homologs','homolog-separation','crossing','separation','spindle'].includes(shape)){
  let out=shape==='chromosome'?chromosome(60):shape==='separation'?line(28,20,28,80,c,9)+line(92,20,92,80,gold,9):chromosome(35)+chromosome(85,gold);
  if(shape==='spindle')out+=curve('M5 50L35 27M5 50L35 73M115 50L85 27M115 50L85 73',blue,2);
  if(shape==='crossing')out+=curve('M26 29L93 71M93 29L26 71',rose,5);
  if(shape==='homolog-separation')out+=line(5,50,20,50,blue,2)+line(100,50,115,50,blue,2);return out;
 }
 if(['pair-aa-upper','pair-aa-lower','pair-hetero'].includes(shape))return line(40,20,40,80,shape==='pair-aa-lower'?gold:c,9)+line(80,20,80,80,shape==='pair-aa-upper'?c:gold,9);
 if(['arrow','arrow-in','arrow-out','arrow-down','opposed-arrows'].includes(shape))return shape==='arrow-down'?curve('M60 15V80M45 65L60 80L75 65',c,6):shape==='arrow-in'?arrow(10,50,100,50):shape==='arrow-out'?`<g transform="translate(120 0) scale(-1 1)">${arrow(10,50,100,50)}</g>`:arrow(10,shape==='opposed-arrows'?30:50,108,shape==='opposed-arrows'?30:50)+(shape==='opposed-arrows'?`<g transform="translate(120 100) scale(-1 -1)">${arrow(10,30,108,30,gold)}</g>`:'');
 if(['stop','barrier'].includes(shape))return shape==='barrier'?box(51,10,18,80,rose):`<path d="M38 12H82L103 33V67L82 88H38L17 67V33Z" fill="${rose}"/>`+line(35,50,85,50,'#f2eddf',6);
 if(shape==='atp')return box(12,35,29,30,blue)+line(38,50,103,50,gold)+[53,76,99].map(x=>circle(x,50,10,gold)).join('');
 if(shape==='cycle')return curve('M29 25Q80 -2 98 43Q114 84 68 90Q12 95 17 50',c,6)+`<path d="M9 57L17 43L28 56" fill="${c}"/>`;
 if(['plant','plants'].includes(shape))return shape==='plants'?`<g transform="translate(-8 20) scale(.7)">${plant()}</g><g transform="translate(40 0) scale(.95)">${plant()}</g>`:plant();
 if(['herbivore','predator'].includes(shape))return ellipse(58,62,34,20,c)+ellipse(91,45,16,15,c)+ellipse(91,21,5,20,c)+ellipse(101,23,4,17,c)+ellipse(35,82,17,7,c)+(shape==='predator'?`<path d="M99 50L110 47L105 59Z" fill="${gold}"/>`:'');
 if(shape==='fungus')return box(53,40,14,49,gold)+`<path d="M12 45Q60 -20 108 45Z" fill="${rose}"/>`+[32,55,80].map(x=>circle(x,28,4,'#ddd7ba')).join('');
 if(['sun','heat','thermometer'].includes(shape)){if(shape==='thermometer')return box(50,12,20,60,blue,9)+circle(60,77,18,rose)+box(57,30,6,45,rose);if(shape==='heat')return [30,60,90].map(x=>curve(`M${x} 85Q${x-16} 65 ${x} 50T${x} 15`,rose,4)).join('');return circle(60,50,23,gold)+Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return line(60+Math.cos(a)*31,50+Math.sin(a)*31,60+Math.cos(a)*44,50+Math.sin(a)*44,gold,4);}).join('');}
 if(['root','branch'].includes(shape))return curve(shape==='root'?'M60 90V55L25 20M60 55L95 20':'M60 90V60L30 35L15 10M30 35L60 10M60 60L100 10',c,5)+circle(shape==='root'?60:30,shape==='root'?55:35,8,gold);
 if(['bars','distribution','directional','stabilizing','disruptive'].includes(shape)){
  if(shape==='bars')return [20,42,64,86].map((x,i)=>box(x,80-[25,55,39,66][i],14,[25,55,39,66][i],[c,gold,rose,blue][i])).join('');
  const d={distribution:'M10 85Q30 85 42 45Q60 0 78 45Q90 85 110 85',directional:'M10 85Q55 85 70 45Q85 0 100 45L112 85',stabilizing:'M10 85H40Q60 -40 80 85H110',disruptive:'M10 85Q28 -35 46 72Q60 95 74 72Q92 -35 110 85'}[shape];return line(10,88,113,88,blue,2)+curve(d,c,5);
 }
 if(shape==='bottleneck')return curve('M15 12L47 42V65L32 89M105 12L73 42V65L88 89',gold,7)+dots(4)+circle(60,55,6,rose)+circle(60,83,7,c);
 if(shape==='selection')return dots(8,[c,gold,rose])+`<circle cx="47" cy="24" r="15" fill="none" stroke="${rose}" stroke-width="3"/>`;
 if(shape==='limb')return line(30,10,55,45,gold,10)+line(55,45,70,73,gold,7)+[60,75,90].map(x=>line(70,73,x,94,gold,5)).join('');
 if(shape==='fossil')return box(10,8,100,84,'#c8bda5',12)+curve('M80 25C20 -5 20 95 78 73C105 55 65 22 50 44C39 65 78 73 72 49',rose,4);
 if(shape==='islands')return ellipse(35,65,28,18,c)+ellipse(91,30,19,15,gold)+curve('M4 90Q35 80 65 90T118 90',blue,3);
 throw new Error(`Missing visual glyph: ${shape}`);
}
export const glyphSVG=shape=>`<svg viewBox="0 0 120 100" aria-hidden="true">${glyph(shape)}</svg>`;
