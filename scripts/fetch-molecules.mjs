/** Fetch source-grounded molecular assets. Run: node scripts/fetch-molecules.mjs [--refresh]
 * Cached final records are reused by default. Network requests are sequential and
 * spaced by at least 600 ms, below PubChem's published 5 requests/second limit.
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/data');
await mkdir(out, {recursive:true});
const refresh = process.argv.includes('--refresh');
const retrievedOn = new Date().toISOString().slice(0,10);
const pubchem = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
let lastRequest = 0;
async function get(url, asText=false) {
  for(let attempt=0;attempt<3;attempt++) {
    await new Promise(r=>setTimeout(r,Math.max(0,600-(Date.now()-lastRequest))));
    lastRequest=Date.now();
    const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
    if(response.status>=500 && attempt<2){await new Promise(r=>setTimeout(r,1500*(attempt+1)));continue;}
    if(!response.ok)throw new Error(`HTTP ${response.status}: ${url}`);
    return asText ? response.text() : response.json();
  }
}
const amino=[
 ['glycine','Glycine','Glycine','A hydrogen side chain makes glycine the smallest standard amino acid.'],
 ['alanine','L-Alanine','L-Alanine','Alanine has a nonpolar methyl side chain.'],
 ['valine','L-Valine','L-Valine','Valine has a branched, nonpolar side chain.'],
 ['leucine','L-Leucine','L-Leucine','Leucine supplies a branched hydrophobic side chain to proteins.'],
 ['isoleucine','L-Isoleucine','L-Isoleucine','Isoleucine has a branched hydrophobic side chain and a second stereocenter.'],
 ['serine','L-Serine','L-Serine','Serine has a hydroxyl-bearing side chain that can participate in hydrogen bonding.'],
 ['threonine','L-Threonine','L-Threonine','Threonine has a hydroxyl-bearing side chain and a second stereocenter.'],
 ['cysteine','L-Cysteine','L-Cysteine','Cysteine thiol groups can be oxidized to form a disulfide link.'],
 ['methionine','L-Methionine','L-Methionine','Methionine has a sulfur-containing thioether side chain.'],
 ['asparagine','L-Asparagine','L-Asparagine','Asparagine has a polar amide side chain.'],
 ['glutamine','L-Glutamine','L-Glutamine','Glutamine has a polar amide side chain with one more methylene group than asparagine.'],
 ['aspartic-acid','L-Aspartic acid','L-Aspartic acid','The side-chain carboxyl group of aspartic acid is commonly deprotonated near physiological pH.'],
 ['glutamic-acid','L-Glutamic acid','L-Glutamic acid','The side-chain carboxyl group of glutamic acid is commonly deprotonated near physiological pH.'],
 ['lysine','L-Lysine','L-Lysine','The terminal amino group in the lysine side chain is commonly protonated near physiological pH.'],
 ['arginine','L-Arginine','L-Arginine','Arginine has a guanidino side chain that is commonly positively charged near physiological pH.'],
 ['histidine','L-Histidine','L-Histidine','The imidazole side chain of histidine can gain or lose a proton in biological environments.'],
 ['phenylalanine','L-Phenylalanine','L-Phenylalanine','Phenylalanine has a nonpolar aromatic side chain.'],
 ['tyrosine','L-Tyrosine','L-Tyrosine','Tyrosine has an aromatic side chain bearing a hydroxyl group.'],
 ['tryptophan','L-Tryptophan','L-Tryptophan','Tryptophan has a large indole-containing aromatic side chain.'],
 ['proline','L-Proline','L-Proline','The proline side chain closes a ring with its amino nitrogen, restricting backbone motion.'],
].map(([id,name,query,description])=>({id,name,query,description,family:'amino-acids'}));
const specs=[
 {id:'water',name:'Water',query:'Water',family:'water',description:'Polar water molecules participate in hydrogen bonding with one another and with suitable solutes.'},
 {id:'glucose',name:'β-D-Glucose',query:'beta-D-glucopyranose',family:'carbohydrates',description:'This six-membered ring is the beta anomer of D-glucose, a monosaccharide used in metabolism and polysaccharides.'},
 {id:'ribose',name:'β-D-Ribose',query:'beta-D-ribofuranose',family:'carbohydrates',description:'The five-membered beta-D-ribose ring provides the sugar framework used in RNA nucleotides.'},
 ...amino,
 {id:'glycerol',name:'Glycerol',query:'Glycerol',family:'lipids',description:'Glycerol provides the three-carbon alcohol backbone of triacylglycerols and many phospholipids.'},
 {id:'palmitic-acid',name:'Palmitic acid',query:'Palmitic acid',family:'lipids',description:'Palmitic acid is a 16-carbon saturated fatty acid with no carbon–carbon double bonds.'},
 {id:'oleic-acid',name:'Oleic acid',query:'Oleic acid',family:'lipids',description:'Oleic acid is an 18-carbon fatty acid with one cis double bond that changes its chain geometry.'},
 {id:'dppc',name:'Dipalmitoylphosphatidylcholine',query:'Dipalmitoylphosphatidylcholine',family:'lipids',description:'DPPC is a phosphatidylcholine with two saturated palmitoyl chains and a polar phosphate-containing headgroup.'},
 {id:'glycerophosphocholine',name:'Glycerophosphocholine',query:'sn-Glycero-3-phosphocholine',family:'lipids',description:'Glycerophosphocholine illustrates the polar glycerol–phosphate–choline portion of phosphatidylcholine; fatty-acid tails are absent.'},
 {id:'atp',name:'ATP',query:'ATP',family:'nucleotides',description:'Adenosine triphosphate couples many cellular processes through reactions involving its phosphate groups.'},
 {id:'adenine',name:'Adenine',query:'Adenine',family:'nucleotides',description:'Adenine is a purine base present in DNA, RNA, and ATP; a base alone is not a nucleotide.'},
];
const symbols={1:'H',6:'C',7:'N',8:'O',9:'F',15:'P',16:'S',17:'Cl',35:'Br',53:'I'};
let cached=[];
if(!refresh){try{cached=JSON.parse(await readFile(path.join(out,'molecules.json'),'utf8'));}catch{}}
const molecules=[];const skipped=[];
function formulaFromAtoms(atoms){
 const counts={};for(const a of atoms)counts[a.element]=(counts[a.element]||0)+1;
 const keys=Object.keys(counts).sort((a,b)=>{const rank=e=>e==='C'?0:e==='H'?1:2;return rank(a)-rank(b)||a.localeCompare(b);});
 return keys.map(k=>k+(counts[k]===1?'':counts[k])).join('');
}
function validate(m){
 if(!m.atoms.length)throw new Error('No atoms');
 const ids=new Set(m.atoms.map(a=>a.id));if(ids.size!==m.atoms.length)throw new Error('Duplicate atom IDs');
 for(const a of m.atoms)if(!a.element||![a.x,a.y,a.z].every(Number.isFinite))throw new Error('Invalid atom');
 for(const b of m.bonds)if(!ids.has(b.a)||!ids.has(b.b)||![1,2,3,4].includes(b.order))throw new Error('Invalid bond');
 const formula=formulaFromAtoms(m.atoms);
 if(formula!==m.formula)throw new Error(`Formula mismatch: atoms ${formula}, property ${m.formula}`);
}
for(const spec of specs){
 try{
  let m=cached.find(m=>m.id===spec.id);
  if(!m){
   const payload=await get(`${pubchem}/compound/name/${encodeURIComponent(spec.query)}/JSON?record_type=3d`);
   const compound=payload.PC_Compounds?.[0];if(!compound)throw new Error('No compound record');
   const cid=compound.id.id.cid;
   const props=await get(`${pubchem}/compound/cid/${cid}/property/MolecularFormula/JSON`);
   const formula=props.PropertyTable.Properties[0].MolecularFormula;
   const coords=compound.coords?.find(c=>c.conformers?.[0]?.z);if(!coords)throw new Error('No source 3D conformer');
   const conformer=coords.conformers[0];
   const elements=new Map(compound.atoms.aid.map((id,i)=>[id,symbols[compound.atoms.element[i]]]));
   const atoms=coords.aid.map((id,i)=>({id,element:elements.get(id),x:conformer.x[i],y:conformer.y[i],z:conformer.z[i]}));
   const bonds=(compound.bonds?.aid1||[]).map((a,i)=>({a,b:compound.bonds.aid2[i],order:compound.bonds.order[i]}));
   m={id:spec.id,name:spec.name,family:spec.family,formula,description:spec.description,atoms,bonds,
    source:{label:`PubChem CID ${cid}`,url:`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`},
    coordinateNote:'PubChem computed 3D conformer; coordinates in ångströms. One representative conformation and protonation form, not a measurement of a molecule in a cell. Hydrogen atoms are included. Physiological protonation may differ.',
    cid,coordinateUrl:`${pubchem}/compound/cid/${cid}/JSON?record_type=3d`,retrievedOn};
  }
  validate(m);molecules.push(m);
  await writeFile(path.join(out,'molecules.json'),JSON.stringify(molecules));
  console.log(`${m.id}: CID ${m.cid}, ${m.formula}, ${m.atoms.length} atoms, ${m.bonds.length} bonds`);
 }catch(error){skipped.push({id:spec.id,name:spec.name,reason:error.message});console.log(`SKIP ${spec.id}: ${error.message}`);}
}
const proteinPath=path.join(out,'protein.json');
let protein;
try{if(!refresh)protein=JSON.parse(await readFile(proteinPath,'utf8'));}catch{}
if(!protein){
 const pdb=await get('https://files.rcsb.org/download/1CRN.pdb',true);
 const atomNames=new Set();const atoms=[];
 for(const line of pdb.split('\n')){
  if(!line.startsWith('ATOM  ')||line[21]!=='A'||![' ','A'].includes(line[16]))continue;
  const residue=Number(line.slice(22,26));const atomName=line.slice(12,16).trim();const key=residue+':'+atomName;
  if(atomNames.has(key))continue;atomNames.add(key);
  atoms.push({id:Number(line.slice(6,11)),element:line.slice(76,78).trim(),x:Number(line.slice(30,38)),y:Number(line.slice(38,46)),z:Number(line.slice(46,54)),residue,residueName:line.slice(17,20).trim(),atomName});
 }
 const backbone=atoms.filter(a=>a.atomName==='CA').map(({x,y,z,residue,residueName})=>({x,y,z,residue,residueName}));
 protein={name:'Crambin',pdb:'1CRN',source:{label:'RCSB PDB 1CRN',url:'https://www.rcsb.org/structure/1CRN'},atoms,backbone,
  coordinateNote:'Experimental X-ray crystallographic model, PDB 1CRN, chain A. Coordinates in ångströms. The backbone traces alpha-carbon positions of 46 residues. Deposited heavy-atom coordinates are shown; absent hydrogen atoms are not reconstructed. A ribbon/tube connecting alpha carbons is an illustrative backbone trace, not a literal bond or measured surface.',
  coordinateUrl:'https://files.rcsb.org/download/1CRN.pdb',retrievedOn};
}
if(protein.backbone.length!==46||protein.atoms.length!==327)throw new Error('Unexpected protein count');
if(protein.atoms.some(a=>![a.x,a.y,a.z].every(Number.isFinite)))throw new Error('Invalid protein coordinates');
await writeFile(proteinPath,JSON.stringify(protein));
const validation={retrievedOn,moleculeCount:molecules.length,aminoAcidCount:molecules.filter(m=>m.family==='amino-acids').length,atoms:molecules.reduce((n,m)=>n+m.atoms.length,0),formulaAndBondChecks:'passed',proteinAtoms:protein.atoms.length,proteinResidues:protein.backbone.length,skipped};
await writeFile(path.join(out,'molecular-sources.json'),JSON.stringify(validation,null,2)+'\n');
console.log(JSON.stringify(validation,null,2));
