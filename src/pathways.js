// Spatial/assembly relationships for exploration, separate from curriculum prerequisites.
export const pathSources={
 crambin:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5536114/',
 cell:'https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells',
 dna:'https://www.genome.gov/genetics-glossary/Chromatin',
 nucleosome:'https://www.genome.gov/genetics-glossary/Nucleosome',
 division:'https://www.ncbi.nlm.nih.gov/books/NBK430708/',
 lipid:'https://openstax.org/books/biology-2e/pages/5-1-components-and-structure',
 sugar:'https://openstax.org/books/biology-2e/pages/3-2-carbohydrates',
 protein:'https://openstax.org/books/biology-2e/pages/15-5-ribosomes-and-protein-synthesis',
 light:'https://openstax.org/books/biology-2e/pages/8-2-the-light-dependent-reactions-of-photosynthesis',
 energy:'https://openstax.org/books/biology-2e/pages/7-4-oxidative-phosphorylation',
 levels:'https://openstax.org/books/biology-2e/pages/1-1-the-science-of-biology',
};
const info=(name,summary,node,children=[],source='cell',note='Procedural scientific illustration. Shapes, colors, and dimensions are representative.')=>({name,summary,nodes:[node],children,source:{label:'Biological reference',url:pathSources[source]},note,formula:'',legend:[]});
export const pathwayInfo={
 'free-ribosome':info('Free ribosome','A cytosolic ribosome translates a protein without attachment to the ER.','APBIO-6.4-01',['polypeptide'],'protein'),
 tonoplast:info('Tonoplast','A selectively permeable membrane encloses the central vacuole.','APBIO-2.1-08',['phospholipid']),
 tree:info('Woodland tree','One tree is a member of a population of the same species.','APBIO-8.3-01',[],'levels','Representative woodland tree; species-specific anatomy is not modeled.'),
 'tree-population':info('Tree population','Trees of one species form one population within the woodland community.','APBIO-8.3-01',['tree'],'levels'),
 nucleosome:info('Nucleosome','DNA wraps around a core of histone proteins. Local unwrapping can expose DNA without changing its sequence.','APBIO-6.1-01',['dna'],'nucleosome','Schematic histone octamer and approximately 1.65 DNA turns. Crossbars sample the duplex; they do not count base pairs. Breathing is an illustrative motion, not measured dynamics.'),
 'mitotic-cell':info('Dividing epithelial cell','One DNA replication precedes sister separation and division into two cells with the same chromosome complement.','APBIO-4.5-01',['nucleus'],'division','A generic animal cell in a renewing epithelium. The teaching model uses 2n = 4, not the chromosome count of a rabbit. Times and dimensions are illustrative.'),
 'meiotic-cell':info('Meiotic germ cell','One replication precedes two divisions: homologs separate first, then sisters.','APBIO-5.1-01',['nucleus'],'division','A representative male germ-cell context. Four products are shown with 2n = 4 initially; this is not the chromosome count or detailed gamete maturation of a rabbit.'),
 chromatin:info('Chromatin','DNA winds around histone proteins to form nucleosomes within chromatin.','APBIO-6.1-01',['nucleosome'],'dna','Nucleosome-chain folding is schematic. Chromatin does not have a single universal regular 30-nm fiber geometry.'),
 chromosome:info('Interphase chromosome','One chromosome occupies a region of the nucleus as folded chromatin.','APBIO-6.1-01',['chromatin'],'dna','A chromosome territory in interphase, not a condensed mitotic X. The territory has no enclosing membrane.'),
 phospholipid:info('Phospholipid','A polar head group and two nonpolar fatty-acid tails make an amphipathic membrane lipid.','APBIO-1.5-03',[],'lipid','Schematic glycerophospholipid with one bent unsaturated tail. Groups represent many atoms; this is not a published conformer.'),
 'starch-granule':info('Starch granule','Amylose and branched amylopectin are stored together in a starch granule.','APBIO-1.4-01',['amylose'],'sugar','Representative transient starch granule in a leaf chloroplast; storage starch also occurs in other plastids.'),
 polypeptide:info('Nascent polypeptide','An elongating amino-acid chain emerges from a translating ribosome.','APBIO-6.4-01',[],'protein','Schematic nascent chain on a translating ribosome. This is not the experimentally measured crambin structure.'),
 rrna:info('Ribosomal RNA','Folded rRNA forms much of the ribosome and participates in protein synthesis.','APBIO-6.3-01',[],'protein','Representative RNA stem-loops, not a specific atomic structure or sequence.'),
 'mitochondrial-dna':info('Mitochondrial DNA','Mitochondria contain their own genome in the matrix.','APBIO-2.1-10',[],'cell','Representative circular genome diagram; organellar genome sizes, topology, and organization vary.'),
 'chloroplast-dna':info('Chloroplast DNA','Chloroplast DNA is located in the stroma.','APBIO-2.1-09',[],'cell','Representative circular genome diagram; organellar genome organization varies.'),
 'chloroplast-atp-synthase':info('Chloroplast ATP synthase','ATP synthase in a thylakoid membrane uses proton flow from the lumen to the stroma.','APBIO-3.4-02',[],'light'),
 chlorophyll:info('Chlorophyll','A magnesium-containing pigment absorbs light within photosynthetic protein complexes.','APBIO-3.4-02',[],'light','Schematic pigment: central magnesium, nitrogen-containing ring system, and hydrophobic tail. Side groups are omitted.'),
 photosystem:info('Photosystem II','Pigments held by proteins collect light energy in the thylakoid membrane.','APBIO-3.4-02',['chlorophyll'],'light','Conceptual pigment–protein complex, not a measured PSII structure.'),
 cytosol:info('Cytosol','Water, dissolved solutes, and proteins occupy the fluid portion of the cytoplasm.','APBIO-2.1-04',['enzyme']),
 epithelium:info('Epithelial tissue','Adjacent animal cells form a tissue layer supported by a basement membrane.','APBIO-2.1-04',['animal-cell'],'levels','Generic epithelium in the rabbit context; cell counts and relative sizes are illustrative.'),
 rabbit:info('Rabbit','Cells and tissues contribute to the body of one animal.','APBIO-8.1-01',['epithelium'],'levels','Representative rabbit; this is not a species-specific anatomical reconstruction.'),
 'rabbit-population':info('Rabbit population','Individuals of one species occupy a shared area.','APBIO-8.3-01',['rabbit'],'levels','Illustrative population in the woodland community. Display colors mark assumed AA, Aa, and aa genotypes. Fitness differences are chosen scenarios, not measured effects of fur color.'),
 seed:info('Seed','A seed contains an embryo, stored reserves, and a protective coat.','APBIO-5.5-01',['protein'],'levels','Generic seed cutaway provides the seed-protein context for crambin; internal location and abundance of crambin are not specified.'),
};

const step=(model,label,size,stage)=>({key:model,id:model,label,size,stage});
const catalog={
 'free-ribosome':step('free-ribosome','Free ribosome','~25 nm',3),tonoplast:step('tonoplast','Tonoplast','~5–10 nm thick',2),
 tree:step('tree','Tree','~10 m',5),'tree-population':step('tree-population','Tree population','~100 m',6),
 molecules:step('molecules','Molecule','~1 nm',0),
 nucleosome:step('nucleosome','Nucleosome','~11 nm across',1),'mitotic-cell':step('mitotic-cell','Dividing cell','~10–30 μm',4),'meiotic-cell':step('meiotic-cell','Germ cell','~10–30 μm',4),
 dna:step('dna','DNA','~2 nm across',1),chromatin:step('chromatin','Chromatin','~10–100 nm',1),chromosome:step('chromosome','Chromosome','~1–5 μm region',1),nucleus:step('nucleus','Nucleus','~5 μm',4),
 phospholipid:step('phospholipid','Phospholipid','~2 nm',0),membrane:step('membrane','Bilayer','~5–10 nm thick',2),
 amylose:step('amylose','Amylose','~10 nm segment',1),'starch-granule':step('starch-granule','Starch granule','~1 μm',3),
 polypeptide:step('polypeptide','Polypeptide','~10 nm',1),ribosome:step('ribosome','Ribosome','~25 nm',3),'rough-er':step('rough-er','Rough ER','~1 μm region',3),rrna:step('rrna','rRNA','~10 nm region',1),
 chlorophyll:step('chlorophyll','Chlorophyll','~1–2 nm',0),photosystem:step('photosystem','Photosystem II','~20 nm',1),thylakoid:step('thylakoid','Thylakoid','~0.5 μm',3),chloroplast:step('chloroplast','Chloroplast','~5 μm',3),
 'atp-synthase':step('atp-synthase','ATP synthase','~10 nm',1),mitochondrion:step('mitochondrion','Mitochondrion','~1–5 μm',3),
 enzyme:step('enzyme','Enzyme','~10 nm',1),cytosol:step('cytosol','Cytosol','~1–10 μm region',4),vacuole:step('vacuole','Vacuole','~10–50 μm',3),
 'plant-cell':step('plant-cell','Leaf cell','~50 μm',4),leaf:step('leaf','Leaf','~1 mm section',5),plant:step('plant','Plant','~1 m',5),population:step('population','Plant population','~100 m',6),
 'animal-cell':step('animal-cell','Animal cell','~10–30 μm',4),epithelium:step('epithelium','Tissue','~1 mm section',5),rabbit:step('rabbit','Rabbit','~0.5 m',5),'rabbit-population':step('rabbit-population','Rabbit population','~100 m',6),
 community:step('community','Community','~1 km',7),ecosystem:step('ecosystem','Ecosystem','~10 km',8),biosphere:step('biosphere','Biosphere','~10,000 km',9),
 protein:step('protein','Crambin','~3 nm',1),seed:step('seed','Seed','~1–10 mm',5),
 'mitochondrial-dna':step('mitochondrial-dna','Mitochondrial DNA','~0.5 μm region',1),'chloroplast-dna':step('chloroplast-dna','Chloroplast DNA','~0.5 μm region',1),
 'chloroplast-atp-synthase':step('chloroplast-atp-synthase','ATP synthase','~10 nm',1),nucleolus:step('nucleolus','Nucleolus','~1 μm',3),
};
export const pathways={
 renewal:{name:'Cell renewal',molecule:'adenine',organisms:['animal'],models:['molecules','dna','nucleosome','chromatin','chromosome','nucleus','mitotic-cell'],suffix:'renewal'},
 germline:{name:'Germ line & meiosis',molecule:'adenine',organisms:['animal'],models:['molecules','dna','nucleosome','chromatin','chromosome','nucleus','meiotic-cell'],suffix:'germline'},
 woodland:{name:'Woodland trees',organisms:['plant'],models:['tree','tree-population'],suffix:'woodland'},
 starch:{name:'Starch',molecule:'glucose',organisms:['plant'],models:['molecules','amylose','starch-granule','chloroplast']},
 dna:{name:'DNA',molecule:'adenine',organisms:['plant','animal'],models:['molecules','dna','nucleosome','chromatin','chromosome','nucleus']},
 membrane:{name:'Membrane lipids',molecule:'glycerophosphocholine',organisms:['plant','animal'],models:['molecules','phospholipid','membrane']},
 translation:{name:'ER protein synthesis',molecule:'glycine',organisms:['plant','animal'],models:['molecules','polypeptide','ribosome','rough-er']},
 'free-translation':{name:'Cytosolic protein synthesis',molecule:'glycine',organisms:['plant','animal'],models:['molecules','polypeptide','free-ribosome','cytosol']},
 tonoplast:{name:'Vacuole membrane',molecule:'glycerophosphocholine',organisms:['plant'],models:['molecules','phospholipid','tonoplast','vacuole']},
 rna:{name:'Ribosomal RNA',molecule:'ribose',organisms:['plant','animal'],models:['molecules','rrna','ribosome','rough-er']},
 'nucleolar-rna':{name:'RNA in the nucleolus',molecule:'ribose',organisms:['plant','animal'],models:['molecules','rrna','nucleolus','nucleus']},
 'mitochondrial-dna':{name:'Mitochondrial DNA',molecule:'adenine',organisms:['plant','animal'],models:['molecules','mitochondrial-dna','mitochondrion']},
 'chloroplast-dna':{name:'Chloroplast DNA',molecule:'adenine',organisms:['plant'],models:['molecules','chloroplast-dna','chloroplast']},
 respiration:{name:'Cellular respiration',molecule:'atp',organisms:['plant','animal'],models:['molecules','atp-synthase','mitochondrion']},
 'chloroplast-atp':{name:'Chloroplast ATP',molecule:'atp',organisms:['plant'],models:['molecules','chloroplast-atp-synthase','thylakoid','chloroplast']},
 photosynthesis:{name:'Photosynthesis',organisms:['plant'],models:['chlorophyll','photosystem','thylakoid','chloroplast']},
 water:{name:'Cell water',molecule:'water',organisms:['plant','animal'],models:['molecules']},
 enzymes:{name:'Cytosolic enzymes',molecule:'alanine',organisms:['plant','animal'],models:['molecules','enzyme','cytosol']},
 'seed-protein':{name:'Seed protein',organisms:['plant'],models:['protein','seed'],suffix:'seed'},
};

const suffixes={
 renewal:['epithelium','rabbit','rabbit-population','community','ecosystem','biosphere'],
 germline:['rabbit','rabbit-population','community','ecosystem','biosphere'],
 woodland:['community','ecosystem','biosphere'],
 plant:['plant-cell','leaf','plant','population','community','ecosystem','biosphere'],
 animal:['animal-cell','epithelium','rabbit','rabbit-population','community','ecosystem','biosphere'],
 seed:['plant','population','community','ecosystem','biosphere'],
};
const relations=new Map();
function edge(from,to,relation,reason,source='cell') {relations.set(`${from}>${to}`,{from,to,relation,reason,source:pathSources[source]});}
edge('molecules','amylose','building block','Glucose-derived residues form amylose. The stored free-glucose conformer is the beta anomer; the polymer contains alpha-linked residues.','sugar');
edge('molecules','dna','component','Adenine is one of the nitrogenous bases in DNA. This is a component relationship, not a reaction animation.','dna');
edge('dna','nucleosome','wrapped around histones in','The selected DNA segment is packaged around a histone core.','nucleosome');
edge('nucleosome','chromatin','repeating subunit of','Nucleosomes and linker DNA form a chromatin chain.','nucleosome');
edge('nucleus','mitotic-cell','compartment of','This route follows the nucleus of a renewing epithelial cell before nuclear-envelope breakdown.','division');
edge('nucleus','meiotic-cell','compartment of','This route follows the nucleus of a diploid germ cell before meiotic nuclear-envelope breakdown.','division');
edge('mitotic-cell','epithelium','cell of','Divisions of appropriate epithelial cells contribute to tissue renewal. The timing animation and scale change are separate.','cell');
edge('meiotic-cell','rabbit','cell within','This route locates a representative male germ cell within the animal reproductive system; intervening tissue and organ scales are omitted.','division');
edge('dna','chromatin','packaged in','DNA wraps around histones within chromatin.','dna');
edge('chromatin','chromosome','organized into','Chromatin makes up an interphase chromosome.','dna');
edge('chromosome','nucleus','contained in','Interphase chromosomes occupy territories inside the nucleus.','dna');
edge('molecules','phospholipid','component','The selected molecule represents a head-group, glycerol-backbone, or fatty-acid component of a glycerophospholipid.','lipid');
edge('phospholipid','membrane','assembled into','Amphipathic phospholipids assemble into a membrane bilayer.','lipid');
edge('molecules','polypeptide','building block','Amino-acid residues are linked into a nascent polypeptide.','protein');
edge('polypeptide','ribosome','emerges from','The selected nascent chain is attached to a translating ribosome.','protein');
edge('polypeptide','free-ribosome','emerges from','This nascent chain is attached to a ribosome translating freely in the cytosol.','protein');
edge('free-ribosome','cytosol','located in','This ribosome is free in the cytosol, not bound to rough ER.','protein');
edge('phospholipid','tonoplast','component','The tonoplast contains a phospholipid bilayer.','lipid');
edge('tonoplast','vacuole','encloses','The tonoplast is the boundary membrane of the central vacuole.');
edge('molecules','rrna','component','Ribose is the sugar in RNA nucleotides; adenine can also be a base in RNA.','protein');
edge('rrna','ribosome','component','Ribosomal RNA is a structural and catalytic component of a ribosome.','protein');
edge('ribosome','rough-er','bound to','This path follows a ribosome bound to the cytosolic face of rough ER. Free ribosomes also exist.','protein');
edge('molecules','atp-synthase','binds at','ATP occupies a catalytic site during the ATP-synthase catalytic cycle. The ATP molecule is not a permanent structural subunit.','energy');
edge('atp-synthase','mitochondrion','embedded in','This route follows ATP synthase embedded in the mitochondrial inner membrane.','energy');
edge('molecules','chloroplast-atp-synthase','binds at','ATP occupies a catalytic site during the chloroplast ATP-synthase cycle.','light');
edge('chloroplast-atp-synthase','thylakoid','embedded in','Chloroplast ATP synthase spans a thylakoid membrane.','light');
for(const [dna,organelle] of [['mitochondrial-dna','mitochondrion'],['chloroplast-dna','chloroplast']]){
 edge('molecules',dna,'component','Adenine is a nitrogenous base in this organellar DNA.','dna');
 edge(dna,organelle,'contained in',`This genome is inside the ${organelle}.`);
}
edge('chlorophyll','photosystem','bound within','Chlorophyll molecules are held within a pigment–protein complex.','light');
edge('photosystem','thylakoid','embedded in','Photosystem II is embedded in a thylakoid membrane.','light');
edge('thylakoid','chloroplast','contained in','Thylakoids occupy the interior of a chloroplast.','light');
edge('amylose','starch-granule','component','Amylose contributes to starch granules together with amylopectin.','sugar');
edge('starch-granule','chloroplast','contained in','This route follows transient starch stored inside a leaf chloroplast.','cell');
edge('molecules','vacuole','contained in','Water is a major component of the solution enclosed by the tonoplast.');
edge('molecules','cytosol','contained in','Water is the solvent of the cytosol.');
edge('molecules','enzyme','building block','Amino-acid residues make up an enzyme protein.','protein');
edge('enzyme','cytosol','located in','This route follows a representative cytosolic enzyme. Other enzymes have different locations.');
edge('protein','seed','found in','Crambin was isolated from Crambe seeds. This jump identifies its source tissue; a subcellular location is not asserted.','crambin');
edge('seed','plant','part of','A seed is a reproductive structure produced by a flowering plant.','levels');
for(const model of ['nucleus','membrane','rough-er','mitochondrion','cytosol','smooth-er','golgi','ribosome','peroxisome','vesicle','cytoskeleton'])for(const cell of ['plant-cell','animal-cell'])edge(model,cell,'part of',`${model.replaceAll('-',' ')} is a component or compartment of the selected eukaryotic cell.`);
for(const model of ['chloroplast','vacuole','cell-wall'])edge(model,'plant-cell','part of',`${model.replaceAll('-',' ')} is part of this representative leaf cell.`);
for(const model of ['lysosome','centrosome'])edge(model,'animal-cell','part of',`${model} is part of this representative animal cell.`);
edge('nucleolus','nucleus','contained in','The nucleolus is a region inside the nucleus.');
edge('nuclear-pore','nucleus','part of','A nuclear-pore complex spans the nuclear envelope.');
edge('rrna','nucleolus','produced in','rRNA is produced and assembled with proteins in the nucleolus before subunit export.');
edge('dna','nucleus','contained in','The selected DNA is nuclear DNA. Other DNA occurs in mitochondria and chloroplasts.');
edge('plant-cell','leaf','part of','This cell is a mesophyll cell within a leaf.','levels');
edge('leaf','plant','part of','A leaf is an organ of the flowering plant.','levels');
edge('animal-cell','epithelium','part of','This animal-cell context represents a cell within epithelial tissue.','levels');
edge('epithelium','rabbit','part of','Epithelial tissue forms coverings and linings in the rabbit.','levels');
edge('plant','population','member of','One flowering plant belongs to a population of the same species.','levels');
edge('rabbit','rabbit-population','member of','One rabbit belongs to a rabbit population in this area.','levels');
edge('tree','tree-population','member of','One woodland tree belongs to a population of trees of the same species.','levels');
for(const population of ['population','rabbit-population','tree-population'])edge(population,'community','member of','This population is one of the interacting populations in the woodland community.','levels');
edge('community','ecosystem','biotic component of','The community combines with its physical environment to form the ecosystem.','levels');
edge('ecosystem','biosphere','part of','This ecosystem is part of the global biosphere.','levels');

const specialParents={nucleolus:['nucleus'], 'nuclear-pore':['nucleus'],lysosome:[],centrosome:[],vacuole:[],'cell-wall':[],golgi:[],'smooth-er':[],peroxisome:[],vesicle:[],cytoskeleton:[]};
export function pathForMolecule(molecule,current='starch') {
 if(molecule.id==='water')return 'water';if(molecule.id==='atp')return current==='chloroplast-atp'?'chloroplast-atp':'respiration';if(molecule.id==='adenine')return ['renewal','germline','rna','nucleolar-rna','mitochondrial-dna','chloroplast-dna'].includes(current)?current:'dna';if(molecule.id==='ribose')return current==='nucleolar-rna'?'nucleolar-rna':'rna';
 if(molecule.family==='amino-acids')return ['enzymes','free-translation'].includes(current)?current:'translation';if(molecule.family==='lipids')return current==='tonoplast'?'tonoplast':'membrane';return 'starch';
}
export function supportsMolecule(pathId,molecule){return !!molecule&&pathForMolecule(molecule,pathId)===pathId;}
export function buildPath(pathId='starch',organism='plant') {
 let definition=pathways[pathId],models;
 if(!definition){
  const id=pathId.replace(/^inspect:/,'');
  if(!(id in specialParents))throw new Error(`Unknown zoom pathway: ${pathId}`);
  const onlyAnimal=['lysosome','centrosome'].includes(id),onlyPlant=['vacuole','cell-wall'].includes(id);
  definition={name:id.replaceAll('-',' '),organisms:onlyAnimal?['animal']:onlyPlant?['plant']:['plant','animal'],models:[id,...specialParents[id]]};
 }
 if(!definition.organisms.includes(organism))organism=definition.organisms[0];
 models=[...definition.models];
 if(pathId==='water')models.push(organism==='plant'?'vacuole':'cytosol');
 models.push(...suffixes[definition.suffix||organism]);
 const steps=models.map(id=>catalog[id]||step(id,id.replaceAll('-',' '),'~1 μm',3));
 const edges=steps.slice(1).map((s,i)=>{
  const relation=relations.get(`${steps[i].id}>${s.id}`);
  if(!relation)throw new Error(`Unjustified zoom transition: ${steps[i].id} → ${s.id}`);
  return relation;
 });
 return {id:pathId,name:definition.name,organism,organisms:definition.organisms,molecule:definition.molecule,steps,edges};
}
export function routeForModel(model,organism='plant',preferred='starch',container=null) {
 if(model==='polypeptide'&&container==='free-ribosome')return buildPath('free-translation',organism);
 if(model==='rrna'&&container==='nucleolus')return buildPath('nucleolar-rna',organism);
 const current=buildPath(preferred,organism);
 if(current.steps.some(s=>s.id===model))return current;
 if(['animal-cell','epithelium','rabbit','rabbit-population','lysosome','centrosome'].includes(model))organism='animal';
 if(['plant-cell','leaf','plant','population','chloroplast','thylakoid','photosystem','chlorophyll','vacuole','cell-wall','seed','protein'].includes(model))organism='plant';
 const preferredRoutes={dna:'dna',nucleus:'dna',chromatin:'dna',chromosome:'dna',membrane:'membrane',phospholipid:'membrane',ribosome:'translation','rough-er':'translation',rrna:'rna',mitochondrion:'respiration','atp-synthase':'respiration',chloroplast:'photosynthesis',thylakoid:'photosynthesis',chlorophyll:'photosynthesis',photosystem:'photosynthesis',amylose:'starch','starch-granule':'starch',protein:'seed-protein',seed:'seed-protein',enzyme:'enzymes',cytosol:'enzymes'};
 const extra={nucleosome:'dna','mitotic-cell':'renewal','meiotic-cell':'germline',polypeptide:'translation','free-ribosome':'free-translation',tonoplast:'tonoplast',tree:'woodland','tree-population':'woodland','chloroplast-atp-synthase':'chloroplast-atp','mitochondrial-dna':'mitochondrial-dna','chloroplast-dna':'chloroplast-dna'};
 const id=extra[model]||preferredRoutes[model]||(model in specialParents?`inspect:${model}`:'dna');
 const route=buildPath(id,organism);
 if(!route.steps.some(s=>s.id===model))throw new Error(`No zoom context for ${model}`);
 return route;
}
export const pathStep=(route,model)=>route.steps.findIndex(s=>s.id===model);
