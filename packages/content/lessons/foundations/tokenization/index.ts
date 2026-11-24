import type { Lesson, Node, Scene } from "../../../src/schema";
import { TILE_H, tokenGrid, tokenRow, tokenWidth, stripWidth } from "../../../src/layout";
import { pseudoId, tokenize } from "../../../src/tokenizer";
import trace from "./trace.json";

interface Trace {
  sentence: string; tokens: string[]; ids: number[];
  arabic: { sentence: string; tokens: string[] };
  word: string; merges: [string, string][];
}
const t = trace as unknown as Trace;

/** Apply the first n merges; each part remembers the index of its first character. */
function applyMerges(word: string, n: number): { label: string; start: number; absorbs: number[] }[] {
  let parts = [...word].map((label, start) => ({ label, start, absorbs: [] as number[] }));
  for (const [a, b] of t.merges.slice(0, n)) {
    const next: typeof parts = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      const q = parts[i + 1];
      if (q && p.label === a && q.label === b) {
        next.push({ label: a + b, start: p.start, absorbs: [...p.absorbs, q.start, ...q.absorbs] });
        i++;
      } else next.push(p);
    }
    parts = next;
  }
  return parts;
}

const sentenceNode: Node = { id: "sentence", kind: "text", x: 230, y: 150, w: 500, h: 50, props: { label: t.sentence, size: 34, mono: true, align: "center" } };
const rowTokens = () =>
  tokenRow(t.tokens, { prefix: "t", y: 150, ids: undefined, extra: (i) => ({ props: { from: "sentence", ...(i === 1 ? {} : {}) } }) });

function withIds(nodes: Node[]): Node[] {
  return nodes.map((n, i) => ({ ...n, props: { ...n.props, id: t.ids[i] } }));
}

const dropFrom = (nodes: Node[]): Node[] => nodes.map((n) => ({ ...n, props: { ...n.props, from: undefined } }));

const tokenMeter = (v: number | string) => ({ id: "tokens", label: "Tokens", value: v, format: "int" as const });

function mergeScene(n: number): Scene {
  const parts = applyMerges(t.word, n);
  const labels = parts.map((p) => p.label);
  const total = stripWidth(labels);
  let x = 480 - total / 2;
  const nodes: Node[] = parts.map((p) => {
    const w = tokenWidth(p.label);
    const node: Node = {
      id: `c${p.start}`, kind: "token", x, y: 230, w, h: TILE_H,
      props: { label: p.label, ...(p.absorbs.length ? { absorb: p.absorbs.map((a) => `c${a}`) } : {}), ...(n === 0 ? { from: "t1" } : {}) },
    };
    x += w + 6;
    return node;
  });
  const label = n === 0 ? "characters" : `${n} merges`;
  return {
    nodes: [...nodes, { id: "mcount", kind: "text", x: 380, y: 320, w: 200, h: 30, props: { label: `${label} → ${parts.length} pieces`, size: 16, align: "center" } }],
    edges: [],
    metrics: [{ id: "pieces", label: "Pieces", value: parts.length, format: "int" }],
  };
}

function languagesScene(): Scene {
  const en = tokenRow(t.tokens, { prefix: "en", y: 150, cx: 480, extra: () => ({}) });
  const ar = tokenRow(t.arabic.tokens, { prefix: "ar", y: 330, cx: 480, extra: () => ({ props: { dir: "rtl" } }) });
  return {
    nodes: [
      { id: "en-label", kind: "text", x: 230, y: 108, w: 500, h: 26, props: { label: `English — “${t.sentence}”`, size: 15, align: "center" } },
      ...en,
      { id: "ar-label", kind: "text", x: 230, y: 288, w: 500, h: 26, props: { label: `Arabic — “${t.arabic.sentence}” (same meaning)`, size: 15, align: "center" } },
      ...ar,
    ],
    edges: [],
    metrics: [
      { id: "en", label: "English tokens", value: t.tokens.length, format: "int" },
      { id: "ar", label: "Arabic tokens", value: t.arabic.tokens.length, format: "int", warnAt: 7 },
    ],
  };
}

export function trySceneFor(text: string): Scene {
  const toks = tokenize(text || " ");
  const nodes = tokenGrid(toks, { prefix: "u", x0: 60, y0: 170, maxW: 840, ids: toks.map(pseudoId) });
  const chars = [...text].length;
  return {
    nodes: [
      { id: "try-label", kind: "text", x: 60, y: 110, w: 840, h: 26, props: { label: "Your text, as this tokenizer sees it (illustrative vocabulary):", size: 15 } },
      ...nodes,
    ],
    edges: [],
    metrics: [
      tokenMeter(toks.length),
      { id: "chars", label: "Characters", value: chars, format: "int" },
      { id: "cpt", label: "Characters per token", value: toks.length ? chars / toks.length : 0, format: "dec" },
    ],
  };
}

const sentenceScene: Scene = { nodes: [sentenceNode], edges: [], metrics: [tokenMeter("—")] };
const splitScene: Scene = { nodes: rowTokens(), edges: [], metrics: [tokenMeter(t.tokens.length)] };
const idsScene: Scene = { nodes: withIds(dropFrom(rowTokens())), edges: [], metrics: [tokenMeter(t.tokens.length)], highlight: ["t1"] };
const DEFAULT_TEXT = "Tokens are tiles, عربي too!";

export const lesson: Lesson = {
  id: "1.2",
  module: "foundations",
  slug: "tokenization",
  number: "1.2",
  title: "Tokenization",
  summary: "See text split into token tiles with ids, and why some text costs more.",
  minutes: 5,
  free: true,
  traceSource: "illustrative",
  terms: ["token", "tokenizer", "bpe", "token-id"],
  steps: [
    { id: "sentence", title: "Text is just characters", captionKey: "1.2.sentence", scene: sentenceScene },
    { id: "split", title: "It splits into tokens", captionKey: "1.2.split", scene: splitScene },
    { id: "ids", title: "Each token is a number", captionKey: "1.2.ids", scene: idsScene },
    { id: "chars", title: "Start from single characters", captionKey: "1.2.chars", scene: mergeScene(0) },
    { id: "merge-some", title: "Merge the most common pairs", captionKey: "1.2.merge-some", scene: mergeScene(3) },
    { id: "merge-all", title: "Keep merging", captionKey: "1.2.merge-all", scene: mergeScene(8) },
    { id: "languages", title: "Other languages cost more", captionKey: "1.2.languages", scene: languagesScene() },
    { id: "try", title: "Try your own text", captionKey: "1.2.try", scene: trySceneFor(DEFAULT_TEXT) },
  ],
  knobs: [{ kind: "text", id: "text", label: "Type any text", default: DEFAULT_TEXT, maxLength: 80, showAtSteps: ["try"] }],
  quiz: {
    question: "What does the model actually receive?",
    choices: ["The text characters", "A list of integer token ids", "Pictures of the letters"],
    answer: 1,
    revealAtStep: "ids",
    explanation: "Models only work with numbers. The tokenizer turns text into token ids before the model sees anything.",
  },
  takeaways: [
    "A tokenizer cuts text into pieces (tokens) and maps each piece to an integer id.",
    "Byte pair encoding builds its vocabulary by repeatedly merging the most frequent adjacent pair.",
    "Rare words and non-English text split into more tokens, which means more cost and less room in the context window.",
  ],
  references: [
    { label: "Neural Machine Translation of Rare Words with Subword Units (Sennrich et al., 2015)", url: "https://arxiv.org/abs/1508.07909" },
    { label: "Let's build the GPT Tokenizer (Andrej Karpathy)", url: "https://www.youtube.com/watch?v=zduSFxRajkE" },
  ],
  trace,
  derive({ step, knobs }) {
    if (step.id !== "try") return step.scene;
    return trySceneFor(String(knobs.text ?? DEFAULT_TEXT));
  },
};
