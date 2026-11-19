import {structureInfo} from './structures.js';
export const stages = [
  {
    "id": "molecules",
    "name": "Molecules",
    "size": "~1 nm",
    "exponent": -9,
    "models": [
      "molecules"
    ],
    "unit": "01",
    "color": "#b4c995"
  },
  {
    "id": "macromolecules",
    "name": "Macromolecules",
    "size": "~10 nm",
    "exponent": -8,
    "models": [
      "dna",
      "protein",
      "amylose",
      "enzyme"
    ],
    "unit": "01 · 06",
    "color": "#d7b57d"
  },
  {
    "id": "membranes",
    "name": "Membranes",
    "size": "~10 nm",
    "exponent": -8,
    "models": [
      "membrane"
    ],
    "unit": "02 · 04",
    "color": "#b8bcdd"
  },
  {
    "id": "organelles",
    "name": "Organelles",
    "size": "~1 μm",
    "exponent": -6,
    "models": [
      "mitochondrion",
      "chloroplast"
    ],
    "unit": "02 · 03",
    "color": "#e6ae86"
  },
  {
    "id": "cells",
    "name": "Cells",
    "size": "~10 μm",
    "exponent": -5,
    "models": [
      "animal-cell",
      "plant-cell"
    ],
    "unit": "02 · 04 · 05 · 06",
    "color": "#b6cbbf"
  },
  {
    "id": "organisms",
    "name": "Organisms",
    "size": "~1 m",
    "exponent": 0,
    "models": [
      "plant"
    ],
    "unit": "04 · 05 · 06 · 08",
    "color": "#b5c78b"
  },
  {
    "id": "populations",
    "name": "Populations",
    "size": "~100 m",
    "exponent": 2,
    "models": [
      "population"
    ],
    "unit": "07 · 08",
    "color": "#d5b28f"
  },
  {
    "id": "communities",
    "name": "Communities",
    "size": "~1 km",
    "exponent": 3,
    "models": [
      "community"
    ],
    "unit": "08",
    "color": "#9ebda4"
  },
  {
    "id": "ecosystems",
    "name": "Ecosystems",
    "size": "~10 km",
    "exponent": 4,
    "models": [
      "ecosystem"
    ],
    "unit": "08",
    "color": "#8abac0"
  },
  {
    "id": "biosphere",
    "name": "Biosphere",
    "size": "~10,000 km",
    "exponent": 7,
    "models": [
      "biosphere"
    ],
    "unit": "07 · 08",
    "color": "#a8c6d9"
  }
];

export const modelInfo = {
 enzyme:structureInfo.enzyme,
 dna:{name:'DNA double helix',tag:'Nucleic acid',formula:'C · H · O · N · P',summary:'Two antiparallel strands pair through complementary bases. The sugar–phosphate backbones are outside; paired bases are inside.',note:'Schematic double helix. Beads and rungs represent groups, not individual atoms; dimensions are illustrative.',legend:[['#cba87c','Sugar–phosphate backbone'],['#669b85','A–T pair'],['#ad8bb6','G–C pair']],nodes:['APBIO-1.6-01','APBIO-1.6-02','APBIO-1.6-03','APBIO-6.1-02']},
 protein:{name:'Crambin',tag:'Protein · 46 residues',formula:'46 residues',summary:'Crambin is a 46-residue plant protein. The surface uses experimentally determined heavy-atom coordinates.',note:'Heavy-atom space-filling representation from RCSB PDB 1CRN using approximate van der Waals radii. Hydrogens are omitted; this is not a solvent-accessible surface.',legend:[['#879b98','Carbon'],['#728fae','Nitrogen'],['#ba8077','Oxygen'],['#c4b36b','Sulfur']],nodes:['APBIO-1.7-01','APBIO-1.7-02','APBIO-1.7-04','APBIO-1.7-05']},
 amylose:{name:'Amylose segment',tag:'Carbohydrate polymer',formula:'(C₆H₁₀O₅)ₙ repeat units',summary:'Glucose residues joined by α(1→4) glycosidic bonds form a starch component. Repeated monomers build a larger carbohydrate.',note:'Six schematic glucose rings. Hydrogens and hydroxyl groups are omitted; this is a connectivity illustration, not an atom-complete conformer.',legend:[['#b8cba0','Glucose residue'],['#dd8e78','Linking oxygen']],nodes:['APBIO-1.4-01','APBIO-1.3-01']},
 membrane:{name:'Phospholipid bilayer',tag:'Selective boundary',formula:'Polar heads + nonpolar tails',summary:'Water-facing heads surround a hydrophobic interior. Embedded proteins create routes for particular molecules and signals.',note:'Schematic patch; each head and tail represents many atoms. The channel illustrates a possible protein, not all membrane proteins.',legend:[['#a2c4b2','Hydrophilic heads'],['#d7bd87','Hydrophobic tails'],['#baa7d2','Protein channel']],nodes:['APBIO-1.5-03','APBIO-2.3-01','APBIO-2.4-01','APBIO-2.6-01']},
 mitochondrion:{name:'Mitochondrion',tag:'Cellular energetics',formula:'Inner membrane · matrix · cristae',summary:'The folded inner membrane separates compartments. Electron transport supports a proton gradient that can drive ATP synthesis.',note:'Schematic cutaway. Folds and particles illustrate compartment relationships, not a quantitative simulation or fixed ATP yield.',legend:[['#cba382','Outer membrane'],['#d0b68a','Cristae'],['#d9efbb','Illustrative proton movement']],nodes:['APBIO-2.1-10','APBIO-3.5-03','APBIO-3.5-04','APBIO-3.5-07']},
 chloroplast:{name:'Chloroplast',tag:'Photosynthesis',formula:'Thylakoids · grana · stroma',summary:'Light reactions occur at thylakoid membranes. Their products help support carbon fixation in the stroma.',note:'Schematic cutaway; grana are stacks of thylakoids. Particle motion is illustrative and does not depict a measured rate.',legend:[['#96ba85','Thylakoid stacks'],['#d6ddb0','Stroma'],['#edce81','Light-energy cue']],nodes:['APBIO-2.1-09','APBIO-3.4-02','APBIO-3.4-03','APBIO-3.4-05']},
 'animal-cell':{name:'Animal cell',tag:'Eukaryotic cell',formula:'Organelles in a shared system',summary:'The nucleus, endomembrane system, and mitochondria have different roles. Their activities support one another within a selective boundary.',note:'Schematic cell; organelles are emphasized for legibility and are not shown at exact relative sizes or abundance.',legend:[['#b8a3cb','Nucleus'],['#e0b88a','Mitochondria'],['#b3cabb','Endomembranes']],nodes:['APBIO-2.1-01','APBIO-2.1-04','APBIO-2.10-01','APBIO-4.5-01']},
 'plant-cell':{name:'Plant cell',tag:'Eukaryotic cell',formula:'Cell wall · vacuole · chloroplasts',summary:'A wall supports the cell, the central vacuole contributes to turgor, and chloroplasts provide compartments for photosynthesis.',note:'Schematic cell. A representative photosynthetic plant cell, not a structure shared by every plant cell type.',legend:[['#8eac77','Cell wall'],['#abcad0','Central vacuole'],['#9cb76b','Chloroplasts']],nodes:['APBIO-2.1-08','APBIO-2.4-02','APBIO-2.7-01','APBIO-2.1-09']},
 plant:{name:'Flowering plant',tag:'Multicellular organism',formula:'Roots → stem → leaves → flower',summary:'Specialized structures exchange matter and energy. Gene expression, environmental conditions, and signaling contribute to the whole phenotype.',note:'Stylized flowering plant. Traits and proportions are illustrative, not a species-specific anatomical reconstruction.',legend:[['#a8bf7f','Photosynthetic tissue'],['#dcb6b8','Reproductive structures'],['#b49878','Roots']],nodes:['APBIO-5.5-01','APBIO-6.5-03','APBIO-8.1-01','APBIO-8.2-10']},
 population:{name:'Plant population',tag:'One species, many individuals',formula:'Variation · inheritance · change',summary:'Different flower colors represent variation within one population. Color alone does not establish a fitness difference or an inheritance pattern.',note:'In the selection animation, purple, pink, and yellow flowers represent AA, Aa, and aa genotypes. The scene shows a rounded sample of genotype frequencies; the timeline reports the model allele frequencies.',legend:[['#a575ba','AA'],['#d4a4b8','Aa'],['#e0c069','aa']],nodes:['APBIO-7.1-01','APBIO-7.4-01','APBIO-7.4-04','APBIO-8.3-01']},
 community:{name:'Woodland community',tag:'Multiple interacting populations',formula:'Producers · consumers · decomposers',summary:'Trees, herbivores, and decomposers illustrate different roles. Arrows, when enabled, show a simplified direction of food-energy transfer.',note:'Conceptual woodland. The food web is deliberately incomplete and shows energy transfer, not prerequisite relationships.',legend:[['#88ad8d','Producers'],['#c9ad88','Consumers'],['#d3a48d','Decomposers']],nodes:['APBIO-8.5-01','APBIO-8.5-02','APBIO-8.5-03','APBIO-8.5-05']},
 ecosystem:{name:'Watershed ecosystem',tag:'Biotic + abiotic systems',formula:'Sunlight · water · soil · organisms',summary:'Water connects land and aquatic habitats. Producers capture light energy, while matter moves between organisms and nonliving reservoirs.',note:'Illustrative watershed. Moving particles are process cues rather than simulated fluxes; no universal transfer efficiency is assumed.',legend:[['#9eb99b','Living community'],['#88b4bd','Water reservoir'],['#ebd292','Incoming light']],nodes:['APBIO-8.2-03','APBIO-8.2-04','APBIO-8.2-05','APBIO-8.7-05']},
 biosphere:{name:'Biosphere',tag:'Global connections',formula:'Atmosphere ↔ biosphere ↔ hydrosphere',summary:'Carbon, water, and nutrients move through reservoirs at different rates. Changes in one place can propagate across connected systems.',source:{label:'Earth texture · Three.js examples',url:'https://github.com/mrdoob/three.js/blob/dev/examples/textures/planets/earth_atmos_2048.jpg'},note:'Satellite-derived Earth texture distributed with Three.js examples (MIT). Clouds are baked into the texture and are not live weather. The atmosphere is exaggerated for visibility.',legend:[['#94b3a2','Terrestrial systems'],['#86afb9','Aquatic systems'],['#e6dbb4','Global exchanges']],nodes:['APBIO-8.2-04','APBIO-8.2-05','APBIO-8.2-08','APBIO-8.7-04']},
};

export function homeStage(node) {
 const match=node.id.match(/^APBIO-(\d+)\.(\d+)-(\d+)/);
 if(!match) return node.id==='APBIO-F-01'?0:node.id==='APBIO-F-04'?4:4;
 const [,u,t,k]=match.map(Number);
 if(u===1) return [4,6,7].includes(t)?1:t===5&&k===3?2:0;
 if(u===2) return t===1||t===9?3:[2,10].includes(t)?4:2;
 if(u===3) return t<=2?1:3;
 if(u===4) return t===2?2:t===4?5:4;
 if(u===5) return t<=2?4:5;
 if(u===6) return t<=4?1:4;
 if(u===7) return [10,11].includes(t)?7:6;
 if(u===8) return t===1?5:t===2?([1,10].includes(k)?5:8):[3,4].includes(t)?6:[5,6].includes(t)?7:8;
 return 4;
}
export function nodesAtStage(model,index) {
 const ids=new Set(model.nodes.filter(n=>homeStage(n)===index).map(n=>n.id));
 for(const key of stages[index].models) for(const id of modelInfo[key]?.nodes||[]) ids.add(id);
 if(index===0) ['APBIO-1.4-01','APBIO-1.7-01','APBIO-1.6-01'].forEach(id=>ids.add(id));
 if(index===9) model.nodes.filter(n=>n.id.startsWith('APBIO-8.2')||n.id.startsWith('APBIO-8.7')||n.id.startsWith('APBIO-7.6')).forEach(n=>ids.add(n.id));
 return model.nodes.filter(n=>ids.has(n.id));
}
export const relationNames={prerequisite:'Prerequisite',recommended:'Helpful preparation',transfer:'Transfer',corequisite:'Develop together',related:'Related'};
export function relationsFor(model,id) {
 return model.edges.filter(e=>e.source===id||e.target===id).map(e=>({...e,other:e.source===id?e.target:e.source,incoming:e.target===id}));
}
export function formulaHTML(formula) { return String(formula).replace(/([A-Za-z)])(\d+)/g,'$1<sub>$2</sub>'); }
