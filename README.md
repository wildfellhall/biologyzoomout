# Biology Zoomout

A full-screen 3D viewer for AP Biology, from molecules to the biosphere. The website uses the original 2026–27 ontology without changing its 234 nodes, 496 learning relationships, 827 alignments, or 38 containment links.

## Run locally

```sh
npm ci
npm run dev -- --port 5173 --strictPort
```

Open **http://127.0.0.1:5173/**. This project is local-only. Keep the development server running while using the preview. `npm run build` creates a local build in `dist/`; `npm run preview` serves that build locally. Do not use the Sites skill or publish this project.

## Explore

- **Learn** opens four starter lessons: membrane transport, gradient-driven ATP production, light reactions, and natural selection. Each has six steps combining a worked explanation, a prediction, the existing 3D reaction, transfer practice, and written recall. The explorer still contains the complete ontology; these lessons are an initial subset, not a full AP course.
- Open **Paths** in the header (the current path name on desktop). Seventeen routes follow biological components, compartments, and ecological membership. DNA follows chromatin → chromosome → nucleus; membrane lipids follow phospholipid → bilayer → cell; chlorophyll follows photosystem → thylakoid → chloroplast. The chooser previews the complete route before returning to the scene. Additional routes cover starch, RNA, free and ER-bound ribosomes, organellar DNA, ATP synthases, cell water, enzymes, seed protein, and woodland trees.
- Drag to rotate. Scroll or pinch to zoom continuously along the selected route. The rail, slider, plus/minus buttons, and arrow keys follow that same route. Home/End use the route's actual endpoints.
- Select **Plant** or **Animal** where both apply. Leaf cells lead to leaves, flowering plants, and plant populations. Animal cells lead to epithelial tissue, a rabbit, and a rabbit population. Shared structures retain their position when changing paths; incompatible choices return to the new path's beginning.
- The upper-left molecular selector includes 29 published molecular structures and all 20 standard amino acids. Selecting a molecule chooses a compatible path, retaining the current context where applicable (for example, adenine in mitochondrial DNA).
- Click an organelle, or use **Inspect structure…**, to open its rotatable cutaway and update the zoom route. Scrolling out follows its biological parents. The back button returns to the prior inspected view; Escape first dismisses an open note, then returns. Animal and plant cells expose 13 and 14 choices. Nuclear, mitochondrial, and chloroplast DNA have distinct parents, as do mitochondrial/chloroplast ATP synthases, free/bound ribosomes, and the plasma membrane/tonoplast.
- **Field notes** opens one compact explanation with Notice, Function, and Context choices. Click a surface detail or use its selector to read about membrane carbohydrates, cortical fibers, wall channels, leaf veins, stomata, decomposers, litter, roots, and stream margins. Notes link to biological references and related original AP nodes. Organelles open with a short explanation; changing scale closes it. Expanded process explanations and the Index close notes to keep the scene clear.
- Relevant process animations appear and play automatically when entering a structure. The compact strip provides pause, scrubbing, and one synchronized explanation; reaction chapters pause at meaningful events. Its chevron opens the explanation, replay, speed, and selection-pressure controls. **View structure** hides the process; **Show process** restores it. Animations cover hydrolysis, DNA replication, facilitated diffusion, oxidative phosphorylation, light reactions, secretion, translation, natural selection, predator–prey dynamics, and secondary succession. A process stops when its sequence ends. Manual pause carries across views, and scrubbing pauses playback. Reduced-motion users see the process immediately with playback paused.
- Open the information button for rotation, labels, reset, representation, autoplay preference, composition, sources, and scientific qualifications. The autoplay preference stays in local storage. Dialogs suspend process playback while open. Space pauses the current process, or rotation when no process is active.
- Open **Index** (or press `/`) for the closable node tray. The scene resizes above it. Search the complete ontology or filter by unit, science practice, or foundational capability.
- Open a node to inspect its original evidence task, success criterion, prerequisites, other typed relationships, and College Board mappings. Reviewed markers stay in browser local storage; they do not claim mastery.
- Share a URL with its path, organism, current structure, molecule, fractional zoom, and node fragment to reproduce that view. Earlier scale/model URLs remain supported.

## Source structure

`public/data/ontology.json` is a byte-for-byte copy of `/Users/sanahrajesh/AP-Biology-Ontology-2026-27/ap-biology-ontology.json` as provided for this task. Preserve IDs and relationship semantics when revising it.

`src/pathways.js` defines the navigation graph, named routes, and model metadata. Every adjacent step requires an explicit relationship, explanation, and biological reference; unknown transitions throw instead of silently joining unrelated models. Assembly, packaging, containment, catalytic binding, and ecological membership are separate relationship types. `src/content.js` retains curriculum groupings, descriptions, and legacy URL mappings; those groupings are not a zoom sequence. Every original node remains accessible.

`src/model-builders.js` retains molecular coordinate and bond rendering. `src/detailed-models.js` builds cell and organelle cutaways and animation geometry; `src/landscapes.js` builds plant and ecological models. `src/pathway-models.js` adds the intermediate structures, epithelial tissue, and animal context needed by the routes. `src/surfaces.js` supplies procedural color/bump textures, irregular geometry, and physically lit materials. `src/natural-materials.js` adds photographic bark and ground maps plus thin-leaf backlighting; `src/habitat-terrain.js` builds uneven ground and exposed soil. Larger scenes use an outdoor HDR environment with softer directional shadows. Cell and molecular views retain their scientific lighting.

`src/cell-detail.js` adds membrane edges, carbohydrate branches, peripheral fibers, cytoplasmic particles, nuclear pore complexes, and plant wall channels. Repeated small structures use instanced geometry. `src/world-detail.js` adds individual canopy leaves, ferns, fallen wood with growth rings, fungal fruiting bodies, soil roots, leaf epidermis/veins/stomata, and epithelial support fibers. Community and ecosystem views share a woodland and stream setting. `src/field-notes.js` holds feature explanations and source links separately from the curriculum ontology.

`src/organisms.js` and `src/organism-geometry.js` build the larger organisms. Trees and understory shrubs have tapering branch networks and instanced leaves; flowering plants have leaves arranged around branching stems, curved petals, buds, and roots exposed against a soil cutaway. Rabbit bodies, forelegs, and paws form a connected implicit surface. Close views add directional fur ribbons, eyelids, and whiskers; population views reuse lighter geometry. Fox bodies use implicit surfaces with separate limbs and tails. The woodland foreground remains open enough to see consumers beneath the canopy. Small breathing, ear, blinking, plant-sway, and stream motions follow the process timeline where applicable, so scrubbing and pause remain deterministic. Reduced motion holds these poses still. Clicking an already-open organism opens its field note.

`src/scene.js` normalizes and caches models, blends adjacent scenes during continuous zoom, and handles rotation, picking, pinch gestures, inspection, and playback. `src/structures.js` defines inspection links separately from curriculum relationships. `src/processes.js` holds reversible process states, model assumptions, and biological references. These transitions illustrate changes of biological organization; they do not claim that every scene is physically nested in one specimen.

`src/main.js` handles scale navigation, automatic process selection, model selection, the node tray, and local review state. `src/node-detail.js` renders the original node records and crosswalks. `src/styles.css` uses system fonts and a full-window layout. The visual identity uses warm paper, forest-green type, a vermilion progress accent, a serif wordmark, and an original expanding-ring symbol repeated in the favicon. Secondary controls live in the path and settings dialogs. A single reaction fact follows playback; additional controls expand on demand. There is no permanent sidebar or page introduction.

## Guided learning

`src/lessons.js` contains original, source-linked lessons referencing unchanged ontology IDs. `src/lesson-ui.js` presents one step below the canvas and reuses the existing renderer, reaction controls, and simulation states. The model remains rotatable. Observation stages explain changes as they occur and can be revisited with the stage buttons or scrubber. The selection lesson changes the existing model's fitness scenario while holding its starting allele frequencies constant. Hypothetical inhibitor and uncoupler questions are identified as reasoning tasks, not newly simulated reaction conditions.

Practice questions give feedback for each alternative. Written recall requires a response before revealing a comparison and a two-point self-check; it is not automatically graded. First attempts remain recorded when an answer is corrected. Lesson completion requires responses to all three checkpoints and does not imply mastery. Opening a new path or inspecting another structure returns to exploration, while **Learn** resumes the saved lesson step. Links such as `/#lesson=gradient&step=2` open a particular lesson stage.

The design follows the [IES practice guide on organizing instruction and study](https://ies.ed.gov/ncee/wwc/PracticeGuide/1): retrieval, delayed review, worked examples alternating with practice, and connecting verbal and visual explanations. Evidence strength differs across recommendations; the app itself has not been evaluated for learning outcomes. Biological references appear in each lesson. The full model-source qualifications remain available through Model information.

Progress and written responses are stored only in this browser under `biology-zoomout-lessons-v1`, separately from ontology reading markers. Completed checkpoints enter a review queue for the following day. Successful due reviews use authored intervals of 3, 7, and then 21 days; an incorrect or “need practice” response returns after one day. These intervals are product choices, not a claim of an optimal scientific schedule. Extra practice before a due date does not postpone it. The app shows due reviews when reopened; it does not send notifications or synchronize across devices. When storage is unavailable, learning still works for the current session.

## Scientific provenance

- Small molecules: PubChem PUG REST published 3D conformers, with individual record URLs, formulas, coordinates, bond orders, and coordinate qualifications in `public/data/molecules.json`.
- Protein: RCSB PDB 1CRN, chain A; 327 deposited heavy atoms rendered with approximate van der Waals radii. Hydrogens are omitted; this is not a calculated solvent-accessible surface. Crambin follows a seed-protein route based on its isolation from Crambe seeds, with no asserted subcellular location. The nascent polypeptide in translation routes is a separate schematic model.
- DNA packaging uses an interphase chromosome territory, not a mitotic X inside an intact nucleus. Organelle DNA is represented by a circular diagram; actual topology and organization vary. The chlorophyll/PSII models are conceptual diagrams, not published atomic conformers. All these qualifications and the individual transition references are in Model information.
- Cells and organelles are procedural scientific cutaways, not scans or microscopy. Texture, colors, proportions, abundance, and biochemical playback times are illustrative. Biochemical particle counts do not imply fixed ATP yield or measured kinetics. The enzyme animation uses a balanced generic hydrolysis scheme, with lobes representing molecular groups.
- Fine fibers, pores, wall channels, leaf veins, and surface carbohydrates are enlarged for visibility. Cytoplasmic particles suggest crowding without measured concentrations. The woodland is an illustrative environment, not a reconstruction of a surveyed site. Field notes link these features to OpenStax Biology 2e and related AP nodes; this does not add new required College Board content to the ontology.
- Whole plants, rabbits, and fox-shaped predators are procedural illustrations, not scanned specimens or species-specific anatomical reconstructions. Fur/leaf textures and small pose changes are visual cues. Predator counts follow the existing population model; animal poses do not simulate individual hunting. Population flower and coat colors retain their original genotype meanings.
- Habitat surface maps and lighting: Poly Haven [Bark Brown 02](https://polyhaven.com/a/bark_brown_02) and [Forest Ground 01](https://polyhaven.com/a/forrest_ground_01), by Rob Tuytel; [Forest Ground 04](https://polyhaven.com/a/forest_ground_04), by Rob Tuytel and Rico Cilliers; and [Forest Slope](https://polyhaven.com/a/forest_slope), by Andreas Mischok. These photographic diffuse/normal/roughness maps and HDR lighting are unmodified 1K downloads under [CC0](https://polyhaven.com/license), stored locally in `public/textures/natural/`. `sources.json` records exact download URLs, file sizes, and SHA-256 checksums. Their use does not make the organism geometry a scanned specimen. Runtime recoloring, UV repetition, and lighting adapt the maps to the illustrative scenes.
- Natural selection uses deterministic diploid viability selection with random mating and no mutation, migration, or drift. The three fitness scenarios are assumptions, not measured effects of flower or fur color. Twenty-four plants or rabbits are a rounded visual sample; the displayed allele frequencies use the underlying model.
- Predator–prey dynamics use the Lotka–Volterra equations integrated with RK4, in arbitrary time units. Secondary succession is an authored 80-year example, not a prediction. Each animation's equations or assumptions and OpenStax reference are available in Model information.
- Earth uses the satellite-derived `earth_atmos_2048.jpg` distributed with the [Three.js examples](https://github.com/mrdoob/three.js/blob/dev/examples/textures/planets/earth_atmos_2048.jpg), stored locally as `public/textures/earth-blue-marble.jpg`. The Three.js MIT license is included beside it. Cloud cover is baked into the image, not live weather.
- The bilayer depicts amphipathic lipids schematically. Glycerophosphocholine in the small-molecule selector is identified as a headgroup-region molecule without fatty-acid tails; a DPPC conformer was omitted because the 3D record was unavailable.
- Prerequisites and other pedagogical links retain the ontology's authored-inference classification. Coverage is not College Board endorsement, demonstrated student mastery, or completion of the six outstanding classroom/resource conditions.

Re-fetch molecular assets with `node scripts/fetch-molecules.mjs`. The script caches completed data and throttles requests. `public/data/molecular-sources.json` records validation and skipped structures.

## Validation

```sh
npm test
node tests/browser.mjs
node tests/interactive-models.mjs
node tests/autoplay-browser.mjs
node tests/world-details.mjs
node tests/organisms-browser.mjs
node tests/lessons-browser.mjs
```

The browser regressions default to local Google Chrome on macOS. Set `CHROME_PATH` to another installed Chromium browser and `TEST_BASE_URL` to a running preview URL when needed. Use a production preview while editing to avoid Vite reloads interrupting a test. Tests cover every named route, plant/animal context, path switching, original nodes, every cell structure choice, mesh picking, nested inspection, all ten animations, scrubbing, playback, selection scenarios, phone layout, reduced motion, and WebGL fallback. The autoplay suite additionally verifies automatic entry, process replacement during forward/reverse zoom, manual pause across views, saved preferences, dialog suspension, and structure-only mode. Pure-model tests verify graph validity, compatible molecular routes, organelle parents, ontology integrity, frequency conservation, diffusion paths and particle counts, integration convergence, and deterministic scrubbing. Screenshots and reports are written to ignored `test-results/pathways/`, `test-results/interactive/`, and `test-results/atlas/`.

The previous hosting manifest has been removed. Local build output is `dist/`. Removing local deployment files does not delete an already hosted copy; remote deletion requires a confirmed deletion action through an available management interface.

The world-details regression checks feature picking, contextual notes, reference and node links, valid inspection routes, explanation dismissal, all new scene details, and phone layouts. It writes screenshots and a report to `test-results/world/`.

The organism tests check finite body geometry, connected rabbit paws, fur bounds, closed leaf tips, outward-facing branches, all eight larger-scale views, inspection returns, lighting restoration, reversible ecological playback, reduced motion, automatic playback, and phone layouts. Their screenshots and report are in `test-results/organisms/`.

Lesson tests check all model/route/node references, compatible reactions, first-attempt records, recall gating, completion, resume after reload, due dates, repeat practice, corrupt storage, feedback, environment comparisons, AP-node access, and phone layouts. Visual results are in `test-results/lessons/`. Rendering tests also protect custom material shaders when views are cloned and align reaction facts with binding, bond-change, and proton-return events.
