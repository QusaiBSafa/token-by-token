import type { Lesson, Node, Scene } from "../../../src/schema";
import { TILE_H, tokenWidth } from "../../../src/layout";
import trace from "./trace.json";

interface W { w: string; u: number; v: number; group: string }
const words = (trace as unknown as { words: W[] }).words;
const GROUP_COLOR: Record<string, number> = { animals: 3, fruit: 2, vehicles: 5, people: 6 };

const MAP = { x: 290, y: 24, w: 650, h: 490 };
const mapPos = (word: W) => ({ x: MAP.x + 30 + word.u * (MAP.w - 60), y: MAP.y + 30 + word.v * (MAP.h - 60) });

function tile(word: W, mode: "list" | "map", i: number, state?: Node["state"]): Node {
  const w = tokenWidth(word.w);
  if (mode === "list") {
    return { id: word.w, kind: "token", x: 40 + (i % 2) * 120, y: 36 + Math.floor(i / 2) * 68, w, h: TILE_H, props: { label: word.w, color: GROUP_COLOR[word.group] } };
  }
  const p = mapPos(word);
  return { id: word.w, kind: "token", x: p.x - w / 2, y: p.y - TILE_H / 2, w, h: TILE_H, ...(state ? { state } : {}), props: { label: word.w, color: GROUP_COLOR[word.group] } };
}
const mapBox: Node = { id: "map", kind: "box", x: MAP.x, y: MAP.y, w: MAP.w, h: MAP.h, props: { label: "embedding space (2D view)" } };
const get = (name: string) => words.find((w) => w.w === name)!;

const listScene: Scene = {
  nodes: words.map((w, i) => tile(w, "list", i)),
  edges: [],
  metrics: [{ id: "n", label: "Words", value: words.length, format: "int" }],
};
const mapScene: Scene = { nodes: [mapBox, ...words.map((w) => tile(w, "map", 0))], edges: [], metrics: [{ id: "dims", label: "Real dimensions (shown in 2D)", value: 384, format: "int" }] };

const clusterLabels: Node[] = [
  { id: "c-animals", kind: "callout", x: MAP.x + 20, y: MAP.y + 62, w: 90, h: 26, props: { text: "animals" } },
  { id: "c-vehicles", kind: "callout", x: MAP.x + 244, y: MAP.y + 58, w: 90, h: 26, props: { text: "vehicles" } },
  { id: "c-fruit", kind: "callout", x: MAP.x + 20, y: MAP.y + 360, w: 90, h: 26, props: { text: "fruit" } },
  { id: "c-people", kind: "callout", x: MAP.x + 360, y: MAP.y + 260, w: 140, h: 26, props: { text: "people & royalty" } },
];
const clusterScene: Scene = { nodes: [mapBox, ...words.map((w) => tile(w, "map", 0)), ...clusterLabels], edges: [], metrics: [] };

const analogyScene: Scene = {
  nodes: [mapBox, ...words.map((w) => tile(w, "map", 0, ["man", "woman", "king", "queen"].includes(w.w) ? "active" : undefined)),
    { id: "formula", kind: "callout", x: MAP.x + 20, y: MAP.y + 420, w: 330, h: 40, props: { text: "king − man + woman ≈ queen" } }],
  edges: [
    { id: "a1", from: "man", to: "woman", label: "+ female", style: "dashed" },
    { id: "a2", from: "king", to: "queen", label: "+ female", style: "dashed" },
  ],
  highlight: ["man", "woman", "king", "queen", "formula"],
  metrics: [{ id: "err", label: "Distance: king−man+woman to queen", value: 0, format: "dec" }],
};

const ORIGIN = { x: 330, y: 430 };
export function cosineScene(angleDeg: number): Scene {
  const a = 20;
  const b = a + angleDeg;
  const cos = Math.cos((angleDeg * Math.PI) / 180);
  return {
    nodes: [
      { id: "va", kind: "vector", x: ORIGIN.x, y: ORIGIN.y, w: 1, h: 1, props: { angle: a, len: 300, label: "“cat”", color: 3 } },
      { id: "vb", kind: "vector", x: ORIGIN.x, y: ORIGIN.y, w: 1, h: 1, props: { angle: b, len: 250, label: "other word", color: 6 } },
      { id: "cos-note", kind: "callout", x: 560, y: 60, w: 340, h: 70, props: { text: `angle ${Math.round(angleDeg)}° → cosine similarity ${cos.toFixed(2)}\nsmall angle = similar meaning` } },
    ],
    edges: [],
    metrics: [{ id: "cos", label: "Cosine similarity", value: cos, format: "dec" }],
  };
}

export function neighborScene(word: string): Scene {
  const me = get(word);
  const mp = mapPos(me);
  const dist = words
    .filter((w) => w.w !== word)
    .map((w) => ({ w, d: Math.hypot(w.u - me.u, w.v - me.v) }))
    .sort((a, b) => a.d - b.d);
  const near = dist.slice(0, 3);
  void mp;
  return {
    nodes: [mapBox, ...words.map((w) => tile(w, "map", 0, w.w === word ? "active" : near.some((n) => n.w.w === w.w) ? "done" : undefined))],
    edges: near.map((n, i) => ({ id: `nn${i}`, from: word, to: n.w.w, label: n.d.toFixed(2), style: "dashed" as const })),
    highlight: [word, ...near.map((n) => n.w.w)],
    metrics: [{ id: "nearest", label: `Nearest to “${word}”`, value: near[0]!.w.w }],
  };
}

export const lesson: Lesson = {
  id: "1.3",
  module: "foundations",
  slug: "embeddings",
  number: "1.3",
  title: "Embeddings",
  summary: "Words become points on a map, where nearby means similar and directions mean something.",
  minutes: 5,
  free: true,
  traceSource: "illustrative",
  terms: ["embedding", "vector", "cosine-similarity"],
  steps: [
    { id: "words", title: "Words are just labels", captionKey: "1.3.words", scene: listScene },
    { id: "map", title: "Place them on a map", captionKey: "1.3.map", scene: mapScene },
    { id: "clusters", title: "Similar meanings cluster", captionKey: "1.3.clusters", scene: clusterScene },
    { id: "analogy", title: "Directions carry meaning", captionKey: "1.3.analogy", scene: analogyScene },
    { id: "cosine", title: "Similarity is an angle", captionKey: "1.3.cosine", scene: cosineScene(35) },
    { id: "neighbors", title: "Find the nearest words", captionKey: "1.3.neighbors", scene: neighborScene("cat") },
  ],
  knobs: [
    { kind: "slider", id: "angle", label: "Angle between the two vectors (degrees)", min: 0, max: 180, step: 5, default: 35, showAtSteps: ["cosine"] },
    { kind: "select", id: "word", label: "Pick a word", options: words.map((w) => ({ value: w.w, label: w.w })), default: "cat", showAtSteps: ["neighbors"] },
  ],
  quiz: {
    question: "What do the king→queen and man→woman arrows have in common?",
    choices: [
      "They point the same way and are the same length: both encode “female”",
      "Nothing, the positions are random",
      "They are the same word written twice",
    ],
    answer: 0,
    revealAtStep: "analogy",
    explanation: "Training places words so that relationships become directions. Subtracting and adding vectors can follow those directions.",
  },
  takeaways: [
    "An embedding is a list of numbers that places a word, sentence or image as a point in space.",
    "Nearby points have similar meaning, and directions in the space can encode relationships.",
    "Cosine similarity compares two embeddings by the angle between them, and is the basis of semantic search.",
  ],
  references: [
    { label: "Efficient Estimation of Word Representations in Vector Space (Mikolov et al., 2013)", url: "https://arxiv.org/abs/1301.3781" },
    { label: "Sentence-BERT (Reimers and Gurevych, 2019)", url: "https://arxiv.org/abs/1908.10084" },
  ],
  trace,
  derive({ step, knobs }) {
    if (step.id === "cosine") return cosineScene(Number(knobs.angle ?? 35));
    if (step.id === "neighbors") return neighborScene(String(knobs.word ?? "cat"));
    return step.scene;
  },
};
