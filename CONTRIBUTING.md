# Adding a lesson

A lesson is data. You should not need to write a React component unless a new glyph is truly needed (then add it to `packages/glyphs` and to the `/dev/glyphs` gallery).

1. **Create the folder** `packages/content/lessons/<module>/<slug>/` with an `index.ts` that exports `lesson: Lesson` (see `foundations/one-prompt` for a small one and `foundations/context-window` for scene builder functions).
2. **Describe scenes, not motion.** Each step has a `scene`: `nodes` (id, `kind`, x, y, optional w/h, `props`, `state`), `edges`, optional `flows`, `metrics`, `highlight`. The canvas is 960 × 540. Keep node ids **stable across steps** so the engine tweens them. Useful props:
   - `from: "<node id>"` on a new node: it flies out of that node.
   - `absorb: ["<id>", ...]` on a node: the listed nodes (which leave the scene) merge into it.
3. **Knobs.** Add `knobs` (slider, select or text) and a pure `derive({ step, knobs, trace })` that returns the scene for knob-dependent steps. Use `showAtSteps` to show a knob only where it matters.
4. **Captions** go in `packages/content/src/copy.en.ts`, keyed `"<lessonId>.<stepId>"`.
5. **Quiz** (optional): `revealAtStep` must be a step id; Next stays disabled on that step until it is answered.
6. **Traces:** put real model output in `trace.json` (`source: "real"`), or hand-written numbers marked `"source": "illustrative"` and set `traceSource` on the lesson so the UI labels it.
7. **Register** the lesson in `packages/content/src/registry.ts` and add glossary terms in `glossary.ts`.
8. **Check:** `pnpm content:check` (schema, id references, caption keys), then open `/dev/lessons/<id>` to review each step with the coordinate grid and slow motion, then `pnpm check` and `pnpm e2e`.

Rules: do not copy text, art, colours or layout from other courses; never commit API keys; ask before adding a paid service.
