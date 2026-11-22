# Lesson questions and visual practice

Prepared before authoring, 2026-11-22. Course: 2026–27 AP Biology. College Board's course-change index still identifies the Fall 2025 CED; the current correction sheet includes June 2026 updates. The CED science-practice descriptions on PDF page 19 and instructional guidance on PDF page 187 support analyzing, explaining, and constructing biological representations. These activities are original instructional exercises, not College Board items or a calibrated assessment.

## Scope and design

- Add 67 original four-option MCQs: one per official topic lesson (60), plus seven questions specific to the focused model studies. Every lesson then has two checkpoint MCQs and two inline practice questions. Existing concept-review items retain their IDs and shared practice-bank records.
- Each new question requires conceptual application, interpretation, or a short calculation. Supply every needed quantity or sequence locally; numerical situations are authored examples. Every option receives misconception-specific feedback. Rotate key positions, audit ambiguity and length cues, and independently recompute quantitative answers. Calculators are permitted but not required.
- Give every lesson a four-part labeling task and an assembly task using a topic-appropriate representation. Reuse diagram/rendering families where the biological representation is shared; prompts, labels, placement criteria, and explanations must reflect the topic. Focused studies deliberately revisit the relevant concept with their detailed reaction model.
- Labeling identifies features using numbered diagram targets and a word bank. Assembly places biological components into spatial or causal roles. A connected 3D schematic shows the learner's placements and supports selecting pieces/targets directly. Diagram text descriptions and button-based placement remain usable without WebGL, dragging, or color perception.
- Use click/tap a piece, then a target, and keyboard-operable buttons as the common interaction. Never require precise dragging. Check a complete attempt before revealing correctness, explain each relationship, permit revision, and distinguish a revealed solution from unassisted work. Structural placement is practice, not a claim of physical molecular docking.
- Keep one task visible at a time within the existing lesson layout. Preserve the six-step lesson sequence, checkpoint IDs, completion status, review schedule, experiment records, and existing answer snapshots. New visual activity records use their own versioned key and retain prior attempts and versions. Failed saving must be visible.

## Mapping and verification

Each new question and activity maps to the existing topic and ontology-node IDs, with the framework's CED page locator. These are authored mappings, not new official College Board codes. Coverage means one additional exercise per topic, not coverage of every essential-knowledge statement. Labeling primarily practices identification; assembly and MCQs extend this to relationships and transfer. No AP score conversion or measured learning-gain claim is made.

Sources checked 2026-11-22: [course-change index](https://apcentral.collegeboard.org/courses/how-ap-develops-courses-and-exams/course-changes-overview), [CED](https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf), [corrections](https://apcentral.collegeboard.org/media/pdf/ap-biology-ced-clarifications-and-corrections.pdf), [exam format](https://apcentral.collegeboard.org/courses/ap-biology/exam). Existing lesson sources remain available in the lesson source panel. New diagrams are authored schematics; shapes, dimensions, counts, and timing are illustrative unless a task explicitly supplies quantities.

Validation: audit all 67 mappings, four distinct choices and exactly one key, feedback, key balance, meaningful slot definitions, deterministic placement/scoring, preserved first attempts and archived versions, incomplete-submission guards, answer concealment, keyboard/touch, small screens, offline reload, and retention of existing lesson/FRQ/experiment records. Structural tests do not establish psychometric validity.

## Completed verification

- `npm test`: 64 passing tests, including new content mappings, independent quantitative keys, equivalent Punnett placements, immutable first attempts, archived versions, FRQ coexistence, cached-tree labels, and independent 3D selection/correctness materials.
- Browser coverage exercised labeling, 3D construction, restoration, and the additional question in all 67 lessons. Focused interaction checks covered wrong answers, revision, reload, keyboard placement on SVG targets, 3D target buttons, touch at 390 px, overflow at 320 px, offline reload, and a combined WebGL/storage failure. A direct canvas click also selected a rendered piece and placed it in a numbered target.
- Existing interactive-lesson and responsive-layout browser suites passed, including automatic reaction playback, experiment conditions, checkpoint gating, written recall, and desktop/portrait/landscape layouts. No application or shader errors were observed in these checks.
- Production build succeeded. The existing large-bundle advisory remains; the app still pre-caches approximately 12.1 MB for offline use. No ontology data, checkpoint IDs, or saved lesson sequence indexes were changed.

Run `node tests/lesson-visual-practice-browser.mjs` against the local production preview for the complete browser check; `SKIP_COVERAGE=1` omits the 67-lesson construction sweep when repeating only interaction and fallback checks. Browser screenshots and reports stay under ignored `test-results/`.
