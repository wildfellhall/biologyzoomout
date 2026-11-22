import framework from '../course/framework.json' with {type:'json'};
import {focusedTopics} from './questions.js';

// Each role is a placement criterion, not a required literal physical location.
// Sequence boards describe causal/process order; spatial boards identify parts.
// Shapes are authored teaching glyphs shared by the 2D and 3D representations.
const rows=[
['1.1','water','Water interactions',[
 ['Oxygen region','oxygen','The partially negative region of a water molecule.','Oxygen attracts shared electrons more strongly than hydrogen.'],
 ['Hydrogen region','hydrogen','A partially positive region of a water molecule.','Unequal sharing leaves the hydrogen side partially positive.'],
 ['Polar covalent bond','bond','The connection holding O and H together within one molecule.','Electrons are shared unequally within each O–H bond.'],
 ['Hydrogen bond','dashed','An attraction between neighboring water molecules.','A partially positive H is attracted to a neighboring electronegative atom.']]],
['1.2','grid','Elements in biological structures',[
 ['Carbon skeleton','chain','The connected framework of many organic molecules.','Carbon can form multiple covalent bonds and diverse molecular frameworks.'],
 ['Amino group','amino','A nitrogen-containing group found in amino acids.','Nitrogen is a constituent of amino acids and therefore proteins.'],
 ['Phosphate group','phosphate','A phosphorus-containing group used in nucleic acids and phospholipids.','Phosphorus is part of these phosphate-containing biological structures.'],
 ['Disulfide bridge','bridge','A sulfur-containing link that can stabilize a protein.','Two cysteine side chains can form a covalent disulfide linkage.']]],
['1.3','flow','Hydrolysis of a polymer',[
 ['Polymer segment','chain','Begin with covalently linked building blocks.','A polymer contains linked monomer-derived units.'],
 ['Water input','water','Supply the reactant used to cleave the link in this schematic.','Hydrolysis uses water as a bond is broken.'],
 ['Bond cleavage','broken-bond','Break a connection between adjacent units.','Hydrolysis breaks a covalent link rather than merely unfolding the chain.'],
 ['Shorter products','fragments','Finish with separated chain segments or monomers.','Cleavage produces smaller molecules; matter is conserved.']]],
['1.4','grid','Carbohydrate structures',[
 ['Glucose unit','hexagon','Identify the small sugar building block.','Glucose is a monosaccharide used in several larger carbohydrates.'],
 ['Glycosidic linkage','bond','Locate the covalent connection between sugar units.','Linkage geometry helps distinguish carbohydrate structures and functions.'],
 ['Branched storage polymer','branched','Identify a polymer with branch points for storage.','Glycogen and amylopectin have branched glucose chains.'],
 ['Cellulose fibers','fibers','Identify aligned structural chains in a plant wall.','Cellulose chains associate into reinforcing microfibrils.']]],
['1.5','membrane','Assemble a phospholipid membrane',[
 ['Polar heads','heads','Place water-facing groups at the membrane surface.','Polar head groups interact favorably with the aqueous environment.'],
 ['Nonpolar tails','tails','Place the hydrophobic regions toward the membrane interior.','The tails associate away from water in the bilayer core.'],
 ['Bent unsaturated tail','bent-tail','Identify the cis-double-bond bend among the tails.','A cis double bond can prevent tight packing.'],
 ['Water','water','Place the surrounding aqueous environment outside the hydrophobic core.','Water contacts the head groups on both sides of the membrane.']]],
['1.6','dna','Nucleotide and strand structure',[
 ['Phosphate','phosphate','Identify a charged component of the strand backbone.','Phosphates link sugars in the nucleic-acid backbone.'],
 ['Sugar','pentagon','Identify the five-carbon component joined to a base.','The sugar is ribose in RNA and deoxyribose in DNA.'],
 ['Nitrogenous base','base','Identify the sequence-bearing component of a nucleotide.','Base order stores sequence information.'],
 ['Complementary pairing','base-pair','Connect bases across antiparallel DNA strands.','A pairs with T and C with G in ordinary DNA.']]],
['1.7','flow','Levels of protein structure',[
 ['Primary structure','chain','Start with the amino-acid sequence.','Peptide bonds connect residues in a particular order.'],
 ['Secondary structure','helix','Identify a local backbone folding pattern.','Backbone hydrogen bonds stabilize helices and sheets.'],
 ['Tertiary structure','protein','Fold one polypeptide into its overall three-dimensional shape.','Interactions among different regions stabilize one chain’s fold.'],
 ['Quaternary structure','complex','Associate multiple polypeptides in a protein that has subunits.','Not every protein has multiple polypeptide subunits.']]],
['2.1','cell','Build a secretory route',[
 ['Bound ribosome','ribosome','Begin protein synthesis on the cytosolic face of the ER.','The ribosome synthesizes the polypeptide; it does not sort finished cargo.'],
 ['Rough ER','er','Receive and fold the nascent secretory protein.','Many secreted proteins enter the ER while they are translated.'],
 ['Golgi apparatus','golgi','Modify and sort cargo after delivery from the ER.','Golgi compartments process cargo and route it to destinations.'],
 ['Secretory vesicle','vesicle','Carry selected cargo to the plasma membrane.','Vesicle fusion can release luminal cargo outside the cell.']]],
['2.2','grid','Surface area and transport distance',[
 ['Plasma membrane','cell','Locate the boundary available for exchange.','Exchange occurs across a surface while metabolic needs scale with cell contents.'],
 ['Cytoplasmic volume','volume','Identify the three-dimensional interior that must be supplied.','Volume increases faster than surface area as similar shapes grow.'],
 ['Surface projection','fibers','Increase surface area without proportionally expanding interior volume.','Membrane folds or projections can increase exchange area.'],
 ['Diffusion distance','arrow','Trace a path from the boundary toward the interior.','Longer distances make diffusion alone less effective for rapid exchange.']]],
['2.3','membrane','A fluid, selective membrane',[
 ['Phospholipid heads','heads','Identify water-facing groups on a bilayer surface.','Amphipathic lipids orient their polar groups toward water.'],
 ['Hydrophobic core','tails','Identify the nonpolar region between the two surfaces.','Fatty-acid tails form a barrier to many charged solutes.'],
 ['Integral protein','channel','Place a protein spanning the bilayer.','Embedded proteins can perform transport, signaling and other functions.'],
 ['Lateral movement','arrow','Show movement along a leaflet rather than through the core.','Membrane fluidity includes sideways movement of many lipids.']]],
['2.4','membrane','Predict membrane permeability',[
 ['Polar surface','heads','Identify the lipid groups exposed to surrounding water.','A hydrophilic surface does not make the entire bilayer hydrophilic.'],
 ['Nonpolar barrier','tails','Locate the region that limits passage of hydrated ions.','The hydrophobic core is unfavorable for most charged solutes.'],
 ['Selective channel','channel','Provide an aqueous route for a compatible solute.','Channel selectivity depends on its structure and chemical interactions.'],
 ['Charged solute','ion','Place a hydrated particle that needs a suitable route through the membrane.','Charge makes direct passage through the lipid core unfavorable.']]],
['2.5','flow','Couple a gradient to uptake',[
 ['ATP hydrolysis','atp','Supply energy to the primary active transporter.','ATP hydrolysis can power uphill ion transport through a pump.'],
 ['Ion pump','channel','Build an electrochemical difference across the membrane.','A pump moves ions against their electrochemical gradient.'],
 ['Stored ion gradient','gradient','Retain potential energy in unequal ion distributions.','A membrane gradient can store energy after the pump acts.'],
 ['Cotransporter','carrier','Use downhill ion movement to drive another solute uphill.','Secondary active transport couples the movements of different solutes.']]],
['2.6','membrane','Facilitated diffusion',[
 ['Lipid surface','heads','Locate the water-facing boundary around the transport protein.','The protein sits within an amphipathic membrane.'],
 ['Lipid core','tails','Locate the barrier a compatible solute cannot readily cross alone.','A suitable protein provides a route around the unfavorable lipid environment.'],
 ['Transport protein','channel','Permit selective passive crossing through the membrane.','Facilitated diffusion uses a protein without directly requiring ATP.'],
 ['Concentration difference','gradient','Identify the difference that gives net diffusion a direction.','The protein provides access; the gradient provides the net driving difference.']]],
['2.7','flow','Turgor in a plant cell',[
 ['Hypotonic surroundings','water','Start with a surrounding solution that favors net water entry.','Water potential differences can favor movement into the cell.'],
 ['Water entry','arrow','Move water across the selectively permeable boundary.','Osmosis is net water movement, not transport of the dissolved solute.'],
 ['Vacuole expansion','vesicle','Increase internal volume as water is taken up.','A large central vacuole contributes to plant-cell turgor.'],
 ['Wall pressure','cell-wall','Oppose further expansion with a resistant outer structure.','Pressure against the wall can balance further net water uptake.']]],
['2.8','flow','Exocytosis without crossing lipid',[
 ['Cargo-containing vesicle','vesicle','Begin with cargo enclosed inside a membrane compartment.','Cargo remains in the vesicle lumen during transport.'],
 ['Docking at the surface','docking','Bring the carrier to its target membrane.','Targeting and docking precede fusion in this simplified sequence.'],
 ['Membrane fusion','fusion','Join the two membranes to create an aqueous opening.','Fusion makes the vesicle lumen continuous with the extracellular space.'],
 ['Extracellular cargo','fragments','Release the contents to the outside of the cell.','Soluble cargo need not diffuse through the bilayer’s hydrophobic core.']]],
['2.9','compartment','Mitochondrial compartments',[
 ['Outer membrane','boundary','Identify the organelle’s outer enclosing boundary.','The outer boundary separates the organelle from the surrounding cytosol.'],
 ['Intermembrane space','ions','Locate the region between the two membranes.','Respiratory proton pumping can enrich this compartment in H⁺.'],
 ['Inner membrane','folded-membrane','Locate the folded boundary that retains a proton gradient.','Electron transport complexes and ATP synthase occupy this membrane.'],
 ['Matrix','volume','Locate the aqueous space enclosed by the inner membrane.','The matrix supports reactions including the citric acid cycle.']]],
['2.10','flow','A simplified endosymbiosis hypothesis',[
 ['Ancestral host','cell','Begin with the cell that takes in another cell.','The host and engulfed cell initially represent different lineages.'],
 ['Engulfed bacterium','bacterium','Introduce a cell with its own genetic system.','Bacterial-like features support the ancestry of mitochondria and chloroplasts.'],
 ['Persistent association','symbiosis','Retain the internal cell rather than digesting it immediately.','An enduring association is needed for an endosymbiotic relationship.'],
 ['Integrated organelle','mitochondrion','Represent the later, host-dependent descendant.','Gene transfer and integration can produce dependence on the host.']]],
['3.1','enzyme','An enzyme-catalyzed reaction',[
 ['Substrate','substrate','Identify the reactant before it binds the enzyme.','The substrate must interact compatibly with the active site.'],
 ['Active site','pocket','Locate the catalytic pocket on the protein.','Binding and catalysis depend on the site’s geometry and chemistry.'],
 ['Enzyme','enzyme','Identify the catalyst that is regenerated after the reaction.','An enzyme lowers the activation barrier without being consumed.'],
 ['Products','fragments','Identify the molecules released after chemical change.','Products differ chemically from substrate, not just in position.']]],
['3.2','flow','How conditions change enzyme activity',[
 ['Environmental change','thermometer','Change a relevant condition such as temperature or pH.','Conditions can affect protein interactions and molecular motion.'],
 ['Altered protein interactions','bonds','Change interactions that stabilize functional structure.','Heat or pH changes can disturb the interactions supporting a fold.'],
 ['Changed active-site fit','pocket','Alter the region that binds and acts on the substrate.','An altered site may bind or catalyze less effectively.'],
 ['Changed reaction rate','bars','Observe altered product formation over time.','Rate changes are a functional consequence, not proof of a universal optimum.']]],
['3.3','flow','Coupling cellular work to ATP',[
 ['ATP','atp','Start with a molecule that can participate in a favorable coupled reaction.','ATP hydrolysis can be coupled to otherwise unfavorable cellular work.'],
 ['Coupled mechanism','enzyme','Connect energy-releasing chemistry to the required work.','Merely placing two reactions nearby does not guarantee coupling.'],
 ['Cellular work','arrow','Drive a process such as transport or molecular synthesis.','Energy transfer supports work while total energy is conserved.'],
 ['ADP and phosphate','fragments','Identify the lower-phosphate products after ATP hydrolysis.','ADP and inorganic phosphate can later be used to regenerate ATP.']]],
['3.4','compartment','Thylakoid light reactions',[
 ['Thylakoid membrane','boundary','Locate the boundary containing photosynthetic electron-transfer complexes.','The membrane separates two compartments needed for chemiosmosis.'],
 ['Lumen','ions','Locate the compartment in which H⁺ accumulates during light reactions.','Water splitting and electron transfer help increase luminal H⁺.'],
 ['ATP synthase','channel','Provide the coupled return route across the thylakoid membrane.','H⁺ return can drive ADP and phosphate to form ATP.'],
 ['Stroma','volume','Identify the destination of H⁺ return through ATP synthase.','The stroma surrounds the thylakoids and supports carbon fixation.']]],
['3.5','flow','Respiration: follow carbon and electrons',[
 ['Glycolysis','hexagon','Split glucose into smaller carbon molecules in the cytosol.','Glycolysis produces pyruvate and transfers some energy to ATP and NADH.'],
 ['Pyruvate oxidation','fragments','Prepare a two-carbon group for entry into the cycle.','Oxidation releases CO₂ and produces acetyl-CoA and NADH.'],
 ['Citric acid cycle','cycle','Oxidize acetyl-derived carbon while reducing electron carriers.','The cycle releases CO₂ and transfers electrons to carriers.'],
 ['Oxidative phosphorylation','mitochondrion','Couple electron transfer and a proton gradient to ATP production.','The inner membrane links respiratory electron transfer to ATP synthase.']]],
['4.1','flow','Communication between cells',[
 ['Signaling cell','cell','Produce a signal in one cell.','A cell can release a messenger that affects other cells.'],
 ['Extracellular messenger','ligand','Carry information through the space between cells.','A chemical signal can travel locally or over a longer distance.'],
 ['Target-cell receptor','receptor','Detect the messenger in a responsive cell.','Cells need suitable recognition machinery to respond.'],
 ['Cellular response','protein','Change an activity in the receiving cell.','Detection must be connected to downstream components to alter behavior.']]],
['4.2','signal','From reception to response',[
 ['Ligand','ligand','Place the signal outside the cell-surface receptor.','A polar extracellular ligand need not enter the cytosol.'],
 ['Receptor','receptor','Detect binding at the membrane.','Receptor activation can transmit a change across the membrane.'],
 ['Intracellular relay','protein','Carry the activation toward downstream targets.','Relay molecules connect reception to a response.'],
 ['Response','dna','Alter an output such as gene expression.','The same signal can produce different outputs in different cell types.']]],
['4.3','flow','Amplify a signal',[
 ['Active receptor','receptor','Initiate intracellular signaling after reception.','Activation at the receptor begins the pathway in this model.'],
 ['Relay enzyme','enzyme','Activate multiple downstream molecules per active enzyme.','One active component can act on several targets.'],
 ['Expanded relay pool','branched','Represent the increased number of activated targets.','Repeated activation steps can amplify the original signal.'],
 ['Cell response','protein','Change cellular behavior through active downstream targets.','Amplification increases response magnitude without multiplying the original ligand into proteins.']]],
['4.4','cycle','A negative-feedback loop',[
 ['Deviation','thermometer','Begin with a regulated variable moving away from its usual range.','The deviation is the change to which the loop responds.'],
 ['Detection','receptor','Detect the change and initiate control signaling.','A sensor or signaling system links a deviation to a response.'],
 ['Corrective response','arrow','Act in a direction that counteracts the deviation.','Negative feedback opposes the initiating change.'],
 ['Reduced stimulus','bars','Reduce further drive as the deviation diminishes.','The response limits continued activation rather than amplifying it indefinitely.']]],
['4.5','flow','Build the mitotic sequence',[
 ['Replicated chromosomes','chromosome','Begin division after DNA has already been copied.','S phase creates sisters before mitosis separates them.'],
 ['Spindle attachment','spindle','Connect replicated chromosomes to the division machinery.','Microtubule attachments help organize chromosome movement.'],
 ['Sister separation','separation','Move sister chromatids toward opposite poles.','Separated sisters are now individual daughter chromosomes.'],
 ['Two daughter cells','two-cells','Partition the cell while retaining the chromosome complement.','Normal mitosis and cytokinesis preserve the parent cell’s chromosome number in each daughter.']]],
['4.6','flow','A DNA-damage checkpoint',[
 ['DNA damage','broken-bond','Begin with an abnormality in genetic material.','Damage may threaten faithful transmission if it is not resolved.'],
 ['Checkpoint signaling','receptor','Detect a problem before allowing progression.','Checkpoint pathways connect cellular conditions to cell-cycle control.'],
 ['Cell-cycle delay','stop','Prevent immediate progression while repair is possible.','Delay can provide time to repair damage rather than pass it onward.'],
 ['Repair and reassessment','dna','Resume only if the relevant conditions are satisfied.','Severe unresolved damage can lead to other outcomes; repair is not guaranteed.']]],
['5.1','flow','Separate homologs, then sisters',[
 ['Replicated homologous pair','homologs','Begin with two replicated homologs in one diploid cell.','Each homolog has two sister chromatids after one S phase.'],
 ['Homolog separation','homolog-separation','Complete the first reductional division.','Meiosis I separates homologs while sisters usually remain joined.'],
 ['Sister separation','separation','Complete the second division without another S phase.','Meiosis II separates sisters in the haploid cells.'],
 ['Four haploid products','four-cells','Finish with cells containing one member of each homologous pair.','This generic symmetric model represents chromosome outcomes, not all gamete-maturation details.']]],
['5.2','flow','Create new allele combinations',[
 ['Homolog pairing','homologs','Bring corresponding homologous chromosomes together.','Pairing permits exchanges between corresponding regions.'],
 ['Crossing over','crossing','Exchange corresponding DNA between nonsister chromatids.','Crossing over rearranges existing alleles rather than inventing required new alleles.'],
 ['Independent orientation','spindle','Orient each homologous pair independently at the first division.','Different orientations produce different chromosome combinations.'],
 ['Varied gametes','four-cells','Distribute different combinations into haploid products.','Recombination and assortment contribute to genetic variation.']]],
['5.3','punnett','Aa × Aa: combine the gametes',[
 ['AA','pair-aa-upper','Combine A from each parent.','The upper-left combination receives two A alleles.'],
 ['Aa','pair-hetero','Combine A from the row parent with a from the column parent.','The heterozygote contains one allele of each type.'],
 ['Aa','pair-hetero','Combine a from the row parent with A from the column parent.','The two heterozygote pieces are interchangeable in this model.'],
 ['aa','pair-aa-lower','Combine a from each parent.','Under complete dominance, this genotype has the recessive phenotype.']]],
['5.4','punnett','Incomplete dominance: Rr × Rr',[
 ['RR · red','pair-aa-upper','Combine R gametes from both parents.','This homozygote has the red phenotype in the stated model.'],
 ['Rr · pink','pair-hetero','Combine R and r from different parents.','The heterozygote has a distinct intermediate phenotype.'],
 ['Rr · pink','pair-hetero','Combine r and R from different parents.','Discrete alleles remain intact; the two pink pieces are interchangeable.'],
 ['rr · white','pair-aa-lower','Combine r gametes from both parents.','The white homozygote reappears because alleles segregate rather than blend permanently.']]],
['5.5','flow','Genotype, environment and phenotype',[
 ['Shared genotype','dna','Start with genetically identical individuals.','A shared genotype holds one source of variation constant.'],
 ['Different environments','sun','Expose them to different light or nutrient conditions.','Environmental inputs can alter development and physiology.'],
 ['Different expression or growth','protein','Change cellular activities in response to conditions.','Responses can occur without changing the underlying DNA sequence.'],
 ['Different phenotypes','plants','Observe differences in form or performance.','Phenotypic differences alone do not establish inherited sequence differences.']]],
['6.1','dna','Recognize a nucleic-acid strand',[
 ['Sugar-phosphate backbone','chain','Locate the covalently connected sides of the strand.','The repeating sugar-phosphate structure supplies strand continuity.'],
 ['Base sequence','bases','Identify the variable component carrying sequence information.','Base order, rather than the repeating phosphate alone, encodes sequence information.'],
 ['Antiparallel orientation','opposed-arrows','Orient paired DNA strands in opposite directions.','One strand runs 5′ to 3′ while its partner runs 3′ to 5′.'],
 ['RNA strand','rna','Identify the single-strand representation containing uracil.','Typical RNA uses ribose and uracil; it can also fold by internal base pairing.']]],
['6.2','fork','Reconstruct a replication fork',[
 ['Parental templates','fork','Expose complementary bases on the original strands.','Each parental strand guides synthesis of a new complementary strand.'],
 ['Leading strand','strand','Extend a new strand continuously toward the advancing fork.','Its geometry permits continuous 5′ to 3′ synthesis in this schematic.'],
 ['Lagging fragments','fragments','Build short new segments away from the advancing fork.','Each fragment still grows 5′ to 3′ despite the opposite template orientation.'],
 ['DNA ligase','enzyme','Seal backbone nicks after adjacent DNA segments are prepared.','Ligase joins appropriately adjacent DNA; it does not reverse synthesis direction.']]],
['6.3','flow','From DNA to processed RNA',[
 ['DNA template','dna','Provide the sequence used to guide RNA synthesis.','RNA polymerase reads one template strand for a transcript.'],
 ['RNA polymerase','enzyme','Catalyze formation of the RNA strand.','RNA synthesis uses complementary pairing and proceeds 5′ to 3′.'],
 ['Pre-mRNA','rna','Represent a eukaryotic transcript before completion of processing.','A primary transcript can contain introns and exons.'],
 ['Processed mRNA','exons','Join retained exons and prepare the transcript for translation.','RNA processing can alter the transcript without changing the gene’s DNA sequence.']]],
['6.4','translation','Assemble a translation model',[
 ['mRNA','rna','Position the codon-containing message through the ribosome.','The message is read in the 5′ to 3′ direction.'],
 ['Ribosome','ribosome','Bring message, tRNAs and the reacting chain together.','Ribosomal structure positions components and catalyzes peptide transfer.'],
 ['Charged tRNA','trna','Match an anticodon to a codon while supplying an amino acid.','A charged tRNA couples codon recognition to an amino-acid contribution.'],
 ['Growing polypeptide','chain','Extend the amino-acid product at its C-terminal end.','The original N terminus is retained as new residues are added.']]],
['6.5','signal','Repression of transcription',[
 ['Regulatory signal','ligand','Provide a condition that can alter a regulator’s activity.','Signals can influence whether regulatory proteins bind DNA.'],
 ['Repressor','protein','Bind a regulatory DNA site to inhibit transcription in this model.','A repressor can limit transcription when the relevant binding interaction is active.'],
 ['Operator','bases','Locate the regulatory DNA sequence recognized by the repressor.','The operator is DNA, not a ribosomal stop codon.'],
 ['RNA output','rna','Observe the transcript whose production is regulated.','Regulation changes transcriptional output without requiring all genes to respond equally.']]],
['6.6','flow','One genome, specialized cells',[
 ['Shared genome','dna','Begin with cells retaining largely the same DNA information.','Most differentiated cells retain genes they do not currently express.'],
 ['Regulatory differences','receptor','Apply different combinations of regulators and signals.','Regulatory context affects which genes are active.'],
 ['Different protein sets','complex','Produce different functional molecules from expressed genes.','Protein abundance and activity contribute to cell identity.'],
 ['Specialized cell functions','two-cells','Generate different activities and structures.','Specialization can arise without assigning a different genetic code to each cell type.']]],
['6.7','flow','A coding-region frameshift',[
 ['Original reading frame','bases','Begin with a sequence grouped into codons.','Translation interprets ordered triplets beginning at a defined start.'],
 ['Single-base insertion','base','Add one nucleotide within the coding sequence.','Adding a count not divisible by three can disrupt the downstream frame.'],
 ['Regrouped codons','shifted-bases','Read downstream bases in new triplet groupings.','The triplet rule is retained but the boundaries change.'],
 ['Altered peptide','chain','Produce a potentially changed or shortened amino-acid chain.','Frameshifts can change many residues or create a premature stop.']]],
['6.8','cycle','One PCR cycle',[
 ['Denaturation','separation','Separate double-stranded DNA by heating.','Strand separation exposes templates for copying.'],
 ['Primer annealing','primers','Allow short DNA primers to bind complementary sites.','Primers supply starting 3′ ends for DNA polymerase.'],
 ['Extension','dna','Use a heat-stable polymerase to extend from the primers.','New DNA is synthesized from the available templates.'],
 ['Doubled templates','two-dna','Use the newly copied molecules in the next cycle.','Ideal doubling produces exponential amplification; actual efficiency may be lower.']]],
['7.1','flow','Natural selection across generations',[
 ['Inherited variation','variation','Begin with different heritable variants in a population.','Selection does not require variants to arise in response to need.'],
 ['Environmental pressure','sun','Apply conditions that affect performance or reproduction.','The environment influences which phenotypes contribute more offspring.'],
 ['Unequal reproduction','two-cells','Allow variants to contribute differently to the next generation.','Reproductive contribution, not survival alone, determines evolutionary fitness.'],
 ['Frequency change','bars','Compare inherited variants in later generations.','Evolution is population-level change rather than need-driven conversion of an individual’s alleles.']]],
['7.2','grid','Three patterns of selection',[
 ['Initial variation','distribution','Start with a spread of heritable phenotypes.','Selection acts on available phenotypic variation.'],
 ['Directional selection','directional','Favor one end of the trait distribution.','An advantage at one extreme can shift the population mean.'],
 ['Stabilizing selection','stabilizing','Favor intermediate phenotypes over both extremes.','An intermediate advantage can narrow the distribution.'],
 ['Disruptive selection','disruptive','Favor both extremes relative to intermediates.','An advantage at both ends can increase their relative representation.']]],
['7.3','flow','Artificial selection',[
 ['Heritable differences','plants','Begin with variation that can be transmitted to offspring.','Purely environmental differences need not yield an inherited selection response.'],
 ['Breeder’s choice','selection','Choose individuals with the desired phenotype to reproduce.','Artificial selection uses human criteria for reproductive choice.'],
 ['Selected reproduction','two-cells','Produce offspring from the chosen individuals.','Alleles from selected breeders contribute disproportionately.'],
 ['Population response','bars','Observe a possible shift over generations.','Selection can alter correlated traits as well as the intended trait.']]],
['7.4','flow','A population bottleneck',[
 ['Original population','variation','Begin with several inherited variants.','The initial gene pool contains alleles at particular frequencies.'],
 ['Chance reduction','bottleneck','Reduce population size without genotype-based survival in this scenario.','Random sampling can differ from the original allele distribution.'],
 ['Survivor sample','few-cells','Retain only the variants carried by the survivors.','A small sample may lose alleles or overrepresent others by chance.'],
 ['Changed gene pool','bars','Form later generations from the remaining alleles.','This frequency change need not reflect an adaptive advantage.']]],
['7.5','punnett','Random union of gametes',[
 ['AA · p²','pair-aa-upper','Combine two gametes carrying A, each with frequency p.','Independent union gives p × p = p².'],
 ['Aa · pq','pair-hetero','Combine A from the row with a from the column.','One heterozygote route has probability pq.'],
 ['Aa · pq','pair-hetero','Combine a from the row with A from the column.','The two heterozygote routes sum to 2pq and are interchangeable here.'],
 ['aa · q²','pair-aa-lower','Combine two gametes carrying a, each with frequency q.','Independent union gives q × q = q², with p + q = 1.']]],
['7.6','grid','Converging evidence for evolution',[
 ['Homologous anatomy','limb','Compare corresponding structures inherited with modification.','Shared structural patterns can persist despite different current functions.'],
 ['Molecular similarities','dna','Compare inherited sequence patterns among lineages.','Sequence relationships can provide evidence independent of gross shape.'],
 ['Fossil record','fossil','Use remains or traces placed in geological context.','Fossils document past forms and temporal patterns, with an incomplete record.'],
 ['Biogeography','islands','Compare the distribution of organisms across places.','Geographical relationships can reflect ancestry, isolation and dispersal.']]],
['7.7','tree','Read shared ancestry',[
 ['Root','root','Identify the ancestral starting node of this rooted tree.','The root orients the branching pattern; it is not the youngest tip.'],
 ['Shared derived character','base','Mark a change on the branch leading to A and B.','Under the stated simple model, both descendants inherit the change.'],
 ['A–B common ancestor','branch','Locate the node shared more recently by A and B.','The node represents a shared ancestral lineage rather than one modern species.'],
 ['Outgroup C','cell','Place the lineage outside the A–B clade.','An outgroup helps interpret character changes without being less evolved.']]],
['7.8','flow','Resistance under treatment',[
 ['Preexisting variants','variation','Begin with susceptible and resistant inherited variants.','Resistance can be present before the drug is applied.'],
 ['Antibiotic exposure','ligand','Change the environment in which survival and reproduction occur.','Treatment changes selection pressure rather than teaching a directed mutation.'],
 ['Resistant reproduction','bacterium','Increase the relative contribution of resistant survivors.','A reproductive advantage can increase representation of the resistance allele.'],
 ['Resistance frequency','bars','Track the population over generations.','Frequency can later decline if resistance is costly without the drug.']]],
['7.9','tree','Topology, not tip order',[
 ['Root','root','Locate the starting node that gives the tree direction.','A rooted topology supplies ancestry relationships but not necessarily dates.'],
 ['Internal branch','branch','Follow the lineage leading to the A–B split.','Branches connect ancestral nodes; their drawn lengths need not represent time.'],
 ['A–B common ancestor','two-cells','Find the most recent node uniting A and B.','Node rotation can swap tip order without changing this relationship.'],
 ['Lineage C','cell','Identify the lineage branching outside the A–B pair.','C shares an older common node with A and B in this topology.']]],
['7.10','flow','Divergence with reduced gene flow',[
 ['Interbreeding population','variation','Begin with a population exchanging alleles through reproduction.','Gene flow tends to connect the gene pools of interbreeding groups.'],
 ['Isolation','barrier','Reduce mating or successful genetic exchange between groups.','Isolation can arise geographically or through other reproductive barriers.'],
 ['Divergence','two-cells','Allow differences to accumulate under evolutionary processes.','Selection, drift and mutation can contribute after gene flow is reduced.'],
 ['Reproductive barrier','stop','Limit successful gene exchange when contact occurs.','Speciation concerns reproductive separation, not merely a difference in appearance.']]],
['7.11','grid','Sources and consequences of variation',[
 ['Mutation','base','Introduce a new sequence variant.','Mutation can create alleles without anticipating whether they will be useful.'],
 ['Recombination','crossing','Rearrange existing alleles into new combinations.','Crossing over reshuffles variation rather than necessarily creating new alleles.'],
 ['Gene flow','arrow','Move inherited variants between populations.','Migration and reproduction can introduce alleles into a gene pool.'],
 ['Environmental selection','sun','Change which variants contribute most successfully.','The usefulness of a variant depends on context; diversity does not guarantee every individual survives.']]],
['7.12','flow','One proposed early-life scenario',[
 ['Organic precursors','hexagon','Provide chemical building blocks under plausible early conditions.','Experiments can test chemical feasibility without recreating the unique history of life.'],
 ['Information and catalysis','rna','Consider a molecular class capable of both functions.','Some RNA molecules catalyze reactions as well as carrying sequence information.'],
 ['Compartments','vesicle','Enclose interacting molecules in simple boundaries.','Compartments can concentrate components and link their fates.'],
 ['Differential persistence','variation','Allow some reproducing systems to contribute more descendants.','This is a hypothesis about possible transitions, not a proven complete historical sequence.']]],
['8.1','flow','Respond to a light cue',[
 ['Light stimulus','sun','Supply an external environmental cue.','Light can provide information as well as energy.'],
 ['Reception','receptor','Detect the cue through suitable cellular components.','Organisms must detect a cue before coupling it to a regulated response.'],
 ['Growth signaling','protein','Transmit information that changes cellular activity.','Signaling can produce unequal growth across a shoot.'],
 ['Directional growth','plant','Change the form of an individual plant.','A growth response is not itself population-level evolution.']]],
['8.2','energy','Track energy through trophic levels',[
 ['Producers','plant','Incorporate energy into new organic biomass.','Producers supply the base of this simplified grazing food chain.'],
 ['Primary consumers','herbivore','Obtain energy by consuming producer material.','Only part of the energy in one level becomes biomass at the next.'],
 ['Secondary consumers','predator','Obtain energy by feeding on the primary consumers.','Successive transfers limit energy reaching higher consumer levels.'],
 ['Heat dissipation','heat','Account for energy transferred to the surroundings during metabolism.','Energy flows through ecosystems; it is not recycled as usable energy indefinitely.']]],
['8.3','population','Account for population change',[
 ['Births','two-cells','Add new individuals produced within the population.','Births increase population size.'],
 ['Immigration','arrow-in','Add individuals arriving from elsewhere.','Immigration adds individuals and can bring new alleles.'],
 ['Deaths','stop','Remove individuals that die.','Deaths reduce population size.'],
 ['Emigration','arrow-out','Remove individuals leaving the population.','Emigration is an outward movement, not a gain.']]],
['8.4','logistic','Read density-dependent growth',[
 ['Low-density growth','few-cells','Locate a population well below its carrying capacity.','The logistic density-dependent reduction is relatively small when N is small compared with K.'],
 ['Intermediate density','variation','Locate the region around K/2 in this model.','For fixed positive r and K, total logistic growth is largest at N = K/2.'],
 ['Carrying capacity','bars','Locate the level at which the model predicts zero net growth.','At N = K, the factor 1 − N/K is zero.'],
 ['Above-capacity decline','arrow-down','Predict the direction of change if N exceeds K.','The logistic factor becomes negative above K under the stated assumptions.']]],
['8.5','web','Build a simple food web',[
 ['Producer','plant','Supply biomass to a grazing consumer.','Plants incorporate carbon into organic compounds used by consumers.'],
 ['Herbivore','herbivore','Consume plant material and serve as prey.','Herbivores connect producers to higher consumer levels.'],
 ['Predator','predator','Reduce prey through consumption.','Predators can indirectly affect plants through their effects on herbivores.'],
 ['Decomposer','fungus','Break down dead organic matter from multiple levels.','Decomposition returns nutrients while metabolic energy is also dissipated.']]],
['8.6','grid','Dimensions of biodiversity',[
 ['Species richness','variation','Count how many species are present.','Richness is a species count rather than a measure of their relative abundances.'],
 ['Species evenness','bars','Compare how evenly individuals are distributed among species.','Equal richness can coexist with very different evenness.'],
 ['Genetic diversity','dna','Compare inherited variants within a species.','Genetic diversity concerns variation within gene pools.'],
 ['Ecosystem diversity','islands','Compare different habitats and communities in a region.','Biodiversity can be considered across multiple organizational levels.']]],
['8.7','flow','Nutrients and oxygen in a lake',[
 ['Nutrient input','phosphate','Add an excess of growth-limiting nutrients in this scenario.','Nutrient enrichment can increase algal production.'],
 ['Algal bloom','plants','Increase biomass near the beginning of the response.','A bloom supplies additional organic material when organisms die.'],
 ['Decomposer respiration','fungus','Use oxygen while processing abundant dead material.','Aerobic decomposition can increase oxygen demand.'],
 ['Low dissolved oxygen','oxygen','Reduce oxygen available to aquatic consumers.','Oxygen depletion can harm organisms even though nutrients initially increased production.']]],
];

const layouts={
 flow:[[90,130],[245,130],[400,130],[555,130]],
 grid:[[165,85],[475,85],[165,255],[475,255]],
 water:[[150,120],[290,75],[225,165],[465,150]],
 membrane:[[160,95],[160,225],[415,160],[510,55]],
 dna:[[110,150],[255,150],[400,150],[545,150]],
 cell:[[90,130],[245,130],[400,130],[555,130]],
 compartment:[[95,155],[255,75],[415,155],[540,235]],
 enzyme:[[95,120],[245,120],[400,120],[550,120]],
 signal:[[90,130],[245,130],[400,130],[555,130]],
 cycle:[[170,85],[470,85],[470,255],[170,255]],
 punnett:[[235,105],[445,105],[235,255],[445,255]],
 fork:[[320,65],[145,200],[475,200],[545,75]],
 translation:[[100,155],[255,155],[400,155],[545,155]],
 tree:[[320,285],[240,205],[190,120],[525,70]],
 energy:[[100,110],[300,110],[500,110],[300,270]],
 population:[[110,85],[110,255],[530,85],[530,255]],
 logistic:[[105,270],[265,215],[460,130],[545,55]],
 web:[[100,100],[300,100],[500,100],[300,270]],
};
export const visualActivities=Object.fromEntries(rows.map(([topic,layout,title,parts])=>{
 const mapping=framework.topics.find(t=>t.id===topic),id=`topic-${topic.replace('.','-')}`;
 return [id,{id,version:1,topic,title,layout,nodes:mapping.nodes,source:`${framework.source}#page=${mapping.pdf_page}`,sequence:['flow','cell','signal','cycle'].includes(layout),
  note:'Authored schematic; shapes and spacing are illustrative. Place components by their biological roles, not by physical docking accuracy.',
  parts:parts.map(([label,shape,role,explanation],i)=>({id:`p${i}`,label,shape,role,explanation,point:layouts[layout][i]})),
  slots:parts.map((p,i)=>({id:`s${i}`,role:p[2],accepts:layout==='punnett'&&[1,2].includes(i)?['p1','p2']:[`p${i}`]}))}];
}));
// Focused lessons intentionally revisit these concepts with the detailed model.
for(const [id,topic]of Object.entries(focusedTopics)){
 const source=visualActivities[`topic-${topic.replace('.','-')}`];
 visualActivities[id]={...source,id,parts:source.parts.map(p=>({...p})),slots:source.slots.map(s=>({...s,accepts:[...s.accepts]}))};
}
visualActivities.membranes={...visualActivities['topic-2-6'],id:'membranes'};
visualActivities.gradient={...visualActivities['topic-2-9'],id:'gradient',topic:'3.5',title:'Locate the respiratory proton gradient',nodes:framework.topics.find(t=>t.id==='3.5').nodes,source:`${framework.source}#page=${framework.topics.find(t=>t.id==='3.5').pdf_page}`};
visualActivities.polypeptide={...visualActivities['topic-6-4'],id:'polypeptide',title:'Position the translation machinery'};
