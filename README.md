# Biology Zoomout

An interactive AP Biology exploration from molecules to the biosphere. The website uses the original 2026–27 ontology without changing its 234 nodes, 496 learning relationships, 827 alignments, or 38 containment links.

## Run locally

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. Production output is generated with `npm run build`; `npm run preview` serves it locally. The deployed Site is private by default.

## Explore

- Drag a 3D model to rotate it. Scroll over the scene, use its side arrows, choose a scale on the rail, or use the scale slider to move through ten biological scales.
- Use the molecule families and selector to explore 29 published structures, including all 20 standard amino acids. Switch between ball-and-stick and space-filling representations.
- Choose alternate macromolecule, organelle, and cell models. Pause motion, hide labels, change inspection distance, or reset the view.
- Click a model label or learning card to open the original node. Follow typed relationships, read assessment criteria, and open the exact College Board source mapping.
- Search the complete ontology or filter by any AP unit, science practice, or foundational capability. Reviewed markers stay in browser local storage; they do not claim mastery.
- Share a URL with its scale, model/molecule, and node fragment to reproduce that view.

## Source structure

`public/data/ontology.json` is a byte-for-byte copy of `/Users/sanahrajesh/AP-Biology-Ontology-2026-27/ap-biology-ontology.json` as provided for this task. Preserve IDs and relationship semantics when revising it.

`src/content.js` contains the authored physical-scale navigation and model descriptions. Physical scale is not a compulsory teaching sequence. Every node has a home view; selected nodes also appear in other relevant contexts.

`src/scene.js` builds the Three.js models, rendering controls, process cues, and model hotspots. `src/main.js` renders cards, preserves source crosswalks, and handles navigation and local review state. `src/styles.css` provides responsive layouts. Google Fonts is used for typography, with local font fallbacks.

## Scientific provenance

- Small molecules: PubChem PUG REST published 3D conformers, with individual record URLs, formulas, coordinates, bond orders, and coordinate qualifications in `public/data/molecules.json`.
- Protein: RCSB PDB 1CRN, chain A; 46 alpha-carbon positions from 327 deposited heavy atoms. The rendered trace is a smooth connection between measured positions, not an atomic surface.
- DNA, amylose, membranes, cells, organisms, communities, ecosystems, and Earth are explicitly labeled schematics. Atom groups, relative dimensions, land cover, abundance, and process motion are illustrative. No quantitative biological simulation or universal ATP yield/energy-transfer efficiency is implied.
- The bilayer depicts amphipathic lipids schematically. Glycerophosphocholine in the small-molecule selector is identified as a headgroup-region molecule without fatty-acid tails; a DPPC conformer was omitted because the 3D record was unavailable.
- Prerequisites and other pedagogical links retain the ontology's authored-inference classification. Coverage is not College Board endorsement, demonstrated student mastery, or completion of the six outstanding classroom/resource conditions.

Re-fetch molecular assets with `node scripts/fetch-molecules.mjs`. The script caches completed data and throttles requests. `public/data/molecular-sources.json` records validation and skipped structures.

## Validation

```sh
npm test
node tests/browser.mjs
```

The browser regression defaults to local Google Chrome on macOS. Set `CHROME_PATH` to another installed Chromium browser and `TEST_BASE_URL` to a running preview URL when needed. Tests cover node/relationship reachability, scientific data integrity, all scales and alternate models, search, prerequisite navigation, deep links, local persistence, responsive layout, reduced motion, and WebGL fallback. Screenshots and reports are written to ignored `test-results/`.

The Site manifest is `.openai/hosting.json`. Static deployment output is `dist/`. Keep credentials out of project files.
