# Token by Token

An animated AI engineering course. Learners step through diagrams where tokens, vectors and models move on screen. Module 1, Foundations, is built and free: four lessons that follow one prompt through a language model.

| Lesson | What moves |
| --- | --- |
| 1.1 One prompt, one token at a time | Tokens enter the model, a probability chart appears, one token is picked and appended, the loop repeats |
| 1.2 Tokenization | A sentence splits into tiles with ids, byte-pair merges collapse pairs, other languages cost more tiles, and you can type your own text |
| 1.3 Embeddings | Words fly onto a map, clusters form, "king − man + woman ≈ queen", cosine similarity as an angle, nearest neighbours |
| 1.4 The context window | Messages fill a fixed tray, the oldest drops out, cost climbs each turn |

## Run it

```bash
nvm use            # Node 22
corepack enable    # pnpm 10
pnpm install
pnpm dev           # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `pnpm check` | typecheck, ESLint, `content:check` (zod + id validation of every lesson), Vitest |
| `pnpm build` | production build of `apps/web` |
| `pnpm e2e` | Playwright on the production build (run `pnpm build` first): lesson flows, deep links, axe, mobile |
| `pnpm content:check` | validate lessons only |

Dev-only pages (hidden in production unless `NEXT_PUBLIC_ENABLE_DEV=1`): `/dev/glyphs` (every glyph in every state, light and dark) and `/dev/lessons/<id>` (coordinate grid, step list, knobs, "copy scene JSON", 0.25× slow motion).

## Architecture

TypeScript monorepo (pnpm workspaces + Turborepo). There is no separate backend: the product is static content plus client-side animation, so one Next.js app covers it. The few server needs are route handlers.

```
apps/web            Next.js (App Router) app: landing, course map, lesson player, glossary, /api/feedback
packages/engine     SceneCanvas, diffScenes, playback store, meters, knobs, quiz, progress
packages/glyphs     SVG glyphs (token, tokenStrip, vector, model, bars, callout, user, db, tool, ...)
packages/content    zod schemas, lessons as data, captions (copy.en.ts), glossary, validation script
packages/ui         design tokens (tokens.css, tokens.ts)
tools/traces        Python trace pipeline (planned; lessons currently ship illustrative traces)
```

Dependency rules: `apps/web` may import any package; `engine` imports `glyphs` and `content` types only; `glyphs` imports only React and Motion; lessons never import React, they reference glyphs by string `kind`.

### How the animation works

A lesson is a list of **scenes** (node positions, edges, flows, meters). Authors describe where things are at each step, never how they move. `SceneCanvas` renders one `<svg viewBox="0 0 960 540">` in four layers (edges, flows, nodes, overlay rings) and animates the *difference* between consecutive scenes with Motion:

- `diffScenes(prev, next)` sorts nodes by stable id into **enter** (fade and scale in, 40 ms stagger in reading order, or fly out of another node via `props.from`), **update** (tween position, size, colour, numbers) and **exit** (fade out, or merge into the node that lists it in `props.absorb`).
- Because every step stores the full scene, Next, Back, Replay, deep links and knob changes all do the same thing: tween from the current scene to a target scene.
- Edges draw on with `pathLength`; packets travel edges in one `useAnimationFrame` loop.
- Knob-dependent scenes use a pure `derive(ctx) => Scene` on the lesson, which is unit-tested.
- Reduced motion swaps every transition for a 150 ms crossfade and flows become static labelled arrows.
- All motion constants live in `packages/engine/src/motion.ts`.

The playback controller is a small Zustand store (`packages/engine/src/store.ts`): Next while animating retargets the tween (nobody waits for an animation they have seen), quiz gates block Next until answered, deep links render with zero duration, knob changes use a 250 ms tween.

### Deviations from the technical plan

- **Versions:** Next.js 16, React 19, Tailwind 4, Zustand 5, zod 4, Motion 12, TypeScript 5.9, ESLint 9, Vitest 3, pnpm 10 (the plan said "use the newer stable major"; Motion 12, TypeScript 5 and ESLint 9 are kept deliberately for ecosystem compatibility).
- **Search:** ⌘K / Ctrl+K searches lesson titles, captions and the glossary with an in-browser index built on first open, instead of Pagefind.
- **Tokenizer lab:** lesson 1.2's text box uses a small illustrative tokenizer (`packages/content/src/tokenizer.ts`) rather than the `gpt-tokenizer` package, so counts are indicative, not exact.
- **Traces:** all four lessons use hand-written traces labelled `"source": "illustrative"` (the plan allows this for phase 1). The Python pipeline in `tools/traces` is not built yet.
- **WebKit:** Playwright runs on Chromium (desktop and a 390 px mobile viewport); WebKit is not installed in this environment.
- **Production URL step:** each step has a shareable URL via `history.replaceState`, so the canvas never remounts.

## Deployment

Vercel project `token-by-token`, root directory `apps/web`, framework Next.js, Node 22. No environment variables are required. Web Analytics and Speed Insights are wired in the layout and activate when enabled on the project. See [CONTRIBUTING.md](CONTRIBUTING.md) for adding lessons.
