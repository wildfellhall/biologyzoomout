// Exploration metadata is separate from the unchanged curriculum ontology.
const cellSource={label:'OpenStax Biology 2e · Cell structure',url:'https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells'};
const entries=[
 ['nucleus','Nucleus','A double membrane encloses chromatin. Nuclear pores regulate transport between nucleoplasm and cytoplasm.','APBIO-6.1-01',['nucleolus','chromosome','dna','nuclear-pore']],
 ['nucleolus','Nucleolus','rRNA production and ribosomal-subunit assembly occur in this membrane-free nuclear region.','APBIO-6.3-01',['rrna']],
 ['nuclear-pore','Nuclear pore','A protein complex spans the nuclear envelope and selectively transports macromolecules.','APBIO-6.3-03',[]],
 ['rough-er','Rough endoplasmic reticulum','Bound ribosomes feed newly synthesized secretory and membrane proteins into the ER.','APBIO-2.1-05',['ribosome','vesicle']],
 ['smooth-er','Smooth endoplasmic reticulum','A tubular membrane network participates in lipid synthesis, detoxification, and calcium storage.','APBIO-2.1-05',[]],
 ['golgi','Golgi apparatus','Cisternae modify and sort cargo received from the ER; vesicles leave from the trans face.','APBIO-2.1-06',['vesicle']],
 ['ribosome','Ribosome','Large and small subunits read mRNA and join amino acids into a polypeptide.','APBIO-6.4-01',[]],
 ['lysosome','Lysosome','Hydrolytic enzymes break down macromolecules in an acidic membrane-enclosed compartment.','APBIO-2.1-07',[]],
 ['peroxisome','Peroxisome','Oxidative reactions occur inside this compartment; catalase helps convert hydrogen peroxide to water and oxygen.','APBIO-2.1-04',[]],
 ['vesicle','Transport vesicle','A small membrane compartment carries cargo between endomembrane-system destinations.','APBIO-2.1-01',[]],
 ['centrosome','Centrosome','In a typical animal cell, two centrioles sit in a microtubule-organizing region.','APBIO-4.5-01',['cytoskeleton']],
 ['cytoskeleton','Cytoskeleton','Filaments provide support, organize cell contents, and support intracellular transport and movement.','APBIO-2.1-04',[]],
 ['vacuole','Central vacuole','The tonoplast encloses cell sap. Water uptake contributes to turgor against the cell wall.','APBIO-2.1-08',['tonoplast']],
 ['cell-wall','Cell wall','Cellulose microfibrils embedded in a matrix resist expansion of a plant cell.','APBIO-2.4-02',[]],
 ['atp-synthase','ATP synthase','Proton flow through a membrane-spanning rotor drives conformational changes that support ATP synthesis.','APBIO-3.5-04',[]],
 ['thylakoid','Thylakoid membrane','Photosystems and electron carriers couple light absorption to electron transfer and a proton gradient.','APBIO-3.4-02',['photosystem']],
 ['enzyme','Enzyme catalysis','A compatible substrate binds at an active site. Catalysis lowers the activation barrier; the hydrolysis animation shows two products leaving while the enzyme is regenerated.','APBIO-3.1-01',[]],
 ['leaf','Leaf cross-section','Mesophyll cells contain chloroplasts. Stomata connect internal air spaces to the atmosphere.','APBIO-8.2-01',['plant-cell','chloroplast']],
];
export const structureInfo=Object.fromEntries(entries.map(([id,name,summary,node,children])=>[id,{name,summary,nodes:[node],children,tag:'Structure',formula:'',source:cellSource,note:'Procedural cutaway for structure and function. Surface texture, colors, proportions, and molecule counts are illustrative; this is not microscopy data.'}]));
export const cellParts={
 'animal-cell':['nucleus','nucleolus','rough-er','smooth-er','golgi','free-ribosome','mitochondrion','lysosome','peroxisome','vesicle','centrosome','cytoskeleton','membrane'],
 'plant-cell':['cell-wall','membrane','vacuole','nucleus','nucleolus','rough-er','smooth-er','golgi','free-ribosome','mitochondrion','chloroplast','peroxisome','vesicle','cytoskeleton'],
 mitochondrion:['atp-synthase','mitochondrial-dna'], chloroplast:['thylakoid','chloroplast-atp-synthase','chloroplast-dna','starch-granule'], plant:['leaf'],
};
export function childrenOf(id) {return cellParts[id]||structureInfo[id]?.children||[];}
