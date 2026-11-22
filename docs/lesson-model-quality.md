# Detailed lesson models

Lessons now share the cell cutaways, organelle interiors, enzyme geometry, plant anatomy, animal geometry, terrain textures and outdoor lighting used by Zoom Out. The quantitative lesson models remain the source of counts and outcomes; animation geometry does not independently determine measurements.

The new cellular renderer covers lipids; cell structure, size, permeability, active transport, channels, osmosis, vesicular transport, compartments and ancestry evidence; enzymes, coupling, photosynthesis and respiration; and communication, reception and cascades. The ecology renderer covers phenotype response, selection and variation, drift, speciation, plant responses, energy flow, population growth, density limitation, community effects, biodiversity and nutrient enrichment.

The original detailed replication, translation and division renderers remain in use. Other topics retain their dedicated teaching schematics. This is not a claim that every topic has a new model or an atom-resolved reconstruction.

## What the visuals mean

- Cellular lessons use the same organelle anatomy as the explorer. Secretory cargo follows ER → Golgi → surface; an export block retains it in ER. Vesicular cargo changes compartments at the membrane.
- Bilayers have spatial depth and two-tail lipids. Closed channels and ATP removal prevent the specified solute transfer. Particle totals are conserved. The current channel timeline depicts net redistribution; individual tracers are not Brownian trajectories.
- Osmosis changes membrane volume while retaining detailed organelles. Water tracers move both ways, with unequal directional traffic in the non-isotonic cases. Counts illustrate flux, not concentrations or a calibrated osmotic equation.
- Enzyme examples reuse the explorer's hydrolysis mechanism. Additional substrate represents the high-substrate condition. A low-pH-activity condition slows the illustrative reaction; this does not assert a universal pH optimum or a measured protein conformation.
- Chloroplast and mitochondrial anatomy is paired with an enlarged membrane mechanism. ATP/NADPH supply and CO₂ availability remain distinct. Oxygen removal stops the oxidative pathway while the fermentation comparison retains glycolytic output. Carbon/product symbols are an overview, not a stoichiometrically complete pathway.
- Signaling shows a membrane receptor and distinct intracellular relay and target molecules. A cascade block and direct downstream activation produce different outcomes. Each molecule owns its activation color.
- Population scenes add representative organisms instead of making one organism larger to mean more individuals. Each rabbit in the growth examples represents approximately twenty individuals; graphs show the exact mathematical expectation. These scenes are not individual-based ecological simulations.
- Community scenes show producer patches, rabbits and foxes. The stipulated predator-removal response changes herbivore representation and plant biomass. The energy diagram and on-model efficiency use the same lesson state; arrows indicate direction, not measured travel speed. Short organism-role labels keep the 3D scene readable on phones.
- The nutrient example is an aquatic scene with algae, detritus, decomposers, fish and dissolved-oxygen tracers. Fish remain illustrative inhabitants: no mortality threshold is inferred from the relative oxygen index. Not all nontransferred trophic energy is labeled as immediate heat.
- Plant response deforms shoot geometry above fixed roots. Genotype comparisons and diversity responses use illustrative size/vigor changes, not measured organ growth rates. Terrain and organism meshes reuse the existing local asset licenses.

Text follows the existing guided Continue flow. Concise stage explanations and comparison controls share the same timeline; no additional lesson tabs or side panels are introduced. The 3D viewport receives more desktop width during detailed observation steps. Reduced-motion preferences, saved answers, review scheduling, and the ontology remain intact.

## Sources consulted

- Alberts et al., *Molecular Biology of the Cell*: [ER-to-Golgi transport](https://www.ncbi.nlm.nih.gov/books/NBK26941/) and [cell communication](https://www.ncbi.nlm.nih.gov/books/NBK26813/).
- Cooper, *The Cell*: [photosynthesis](https://www.ncbi.nlm.nih.gov/books/NBK9861/).
- EPA: [nutrients and oxygen-demand pathways](https://www.epa.gov/caddis/nutrients).
- HHMI BioInteractive: [Modeling Trophic Cascades](https://www.biointeractive.org/classroom-resources/modeling-trophic-cascades). No media or lesson content from this resource is copied into the app.

## Validation

`tests/lesson-visual-quality.test.mjs` checks representative-count conservation, ecological treatment effects, continuous membrane transport, balanced exchange at equilibrium, independent energy/carbon controls, and signaling order.

`tests/lesson-visual-quality-browser.mjs` visits all 34 enhanced lessons, scrubs their timelines, runs a comparison condition, checks lighting, and captures desktop screenshots. It also checks eight phone layouts and collects runtime/shader errors. Screenshots are saved under the ignored `test-results/lesson-quality/` directory. `TOPICS=2-5,3-4,3-5 SKIP_PHONE=1` limits a rerun to selected lessons.

`tests/lesson-visual-rigs-browser.mjs` runs against the Vite development server and inspects actual Three.js objects after the scene cache's material-cloning step. It verifies independent target activation, relay blocking, downstream bypass, and restoration when scrubbing backward.

Validation on 2026-11-22: 74 unit tests passed; the complete visual run passed all 34 desktop comparisons and eight phone layouts with no runtime or shader errors. The Three.js material-ownership regression passed. Targeted desktop and phone reruns cover the subsequent annotation and pump refinements. One software-rendered screenshot timed out on an earlier targeted run; its rerun passed. The production build succeeds with Vite's existing large-bundle advisory.
