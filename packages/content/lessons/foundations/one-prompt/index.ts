import type { Lesson, Node, Scene } from "../../../src/schema";
import { stripWidth } from "../../../src/layout";
import trace from "./trace.json";

type Dist = [string, number][];
interface Trace { prompt: string[]; steps: { chosen: string; probs: Dist }[] }
const t = trace as unknown as Trace;

const PROMPT_X = 130;
const PROMPT_Y = 60;

const user: Node = { id: "user", kind: "user", x: 40, y: 52, props: { label: "You" } };
const model = (state: Node["state"] = "idle"): Node => ({ id: "model", kind: "model", x: 380, y: 215, w: 170, h: 110, state, props: { label: "Language model" } });
const prompt = (tokens: string[], extra: Record<string, unknown> = {}): Node => ({
  id: "prompt", kind: "tokenStrip", x: PROMPT_X, y: PROMPT_Y, w: stripWidth(tokens), h: 36, props: { tokens, ...extra },
});
const bars = (dist: Dist, pickedIdx: number | null, extra: Record<string, unknown> = {}): Node => ({
  id: "bars", kind: "bars", x: 620, y: 150, w: 310, h: dist.length * 34,
  props: { title: "Next-token probabilities (top 5)", items: dist.map(([label, value], i) => ({ label, value, picked: i === pickedIdx })), ...extra },
});
const answer = (tokens: string[], from?: string): Node => ({
  id: "answer", kind: "tokenStrip", x: PROMPT_X, y: 440, w: stripWidth(tokens), h: 36, state: "active", props: { tokens, ...(from ? { from } : {}) },
});

const E = (id: string, from: string, to: string, label?: string, style?: "solid" | "dashed") => ({ id, from, to, ...(label ? { label } : {}), ...(style ? { style } : {}) });
const base = t.prompt;
const d0 = t.steps[0]!.probs;

const scenes: Record<string, Scene> = {
  prompt: { nodes: [user, prompt(base)], edges: [], metrics: [{ id: "n", label: "Tokens in the prompt", value: base.length, format: "int" }] },
  read: {
    nodes: [user, prompt(base), model("active")],
    edges: [E("e1", "prompt", "model", "read all tokens")],
    flows: [{ edge: "e1", packets: 5, durationMs: 1800, label: "token" }],
    metrics: [{ id: "n", label: "Tokens in the prompt", value: base.length, format: "int" }],
    highlight: ["prompt", "model"],
  },
  probs: {
    nodes: [user, prompt(base), model("active"), bars(d0, null, { from: "model" })],
    edges: [E("e1", "prompt", "model"), E("e2", "model", "bars", "score every word")],
    metrics: [
      { id: "v", label: "Words the model scores", value: 50257, format: "int" },
      { id: "s", label: "Shown here", value: 5, format: "int" },
    ],
    highlight: ["model", "bars"],
  },
  pick: {
    nodes: [user, prompt(base), model(), bars(d0, 0), answer([t.steps[0]!.chosen], "bars")],
    edges: [E("e1", "prompt", "model"), E("e2", "model", "bars"), E("e3", "bars", "answer", "pick one")],
    metrics: [{ id: "p", label: "Chance of the pick", value: 0.71, format: "pct" }],
    highlight: ["bars", "answer"],
  },
  append: {
    nodes: [user, prompt([...base, t.steps[0]!.chosen], { absorb: ["answer"] }), model(), bars(d0, 0)],
    edges: [E("e1", "prompt", "model", "run again", "dashed"), E("e2", "model", "bars")],
    flows: [{ edge: "e1", packets: 3, durationMs: 2400 }],
    metrics: [{ id: "n", label: "Tokens in the prompt", value: base.length + 1, format: "int" }],
    highlight: ["prompt"],
  },
  loop: loopScene(3),
};

function loopScene(n: number): Scene {
  const chosen = t.steps.slice(0, n).map((s) => s.chosen);
  const dist = t.steps[Math.min(n, t.steps.length - 1)]!.probs;
  return {
    nodes: [user, prompt([...base, ...chosen]), model("active"), bars(dist, 0)],
    edges: [E("e1", "prompt", "model", "again and again", "dashed"), E("e2", "model", "bars")],
    flows: [{ edge: "e1", packets: 2, durationMs: 1400 }],
    metrics: [
      { id: "g", label: "Tokens generated", value: n, format: "int" },
      { id: "r", label: "Model runs", value: n, format: "int" },
    ],
    highlight: ["prompt", "model"],
  };
}

export const lesson: Lesson = {
  id: "1.1",
  module: "foundations",
  slug: "one-prompt",
  number: "1.1",
  title: "One prompt, one token at a time",
  summary: "Watch a prompt turn into an answer, one predicted token per run.",
  minutes: 4,
  free: true,
  traceSource: "illustrative",
  terms: ["token", "prompt", "language-model", "probability"],
  steps: [
    { id: "prompt", title: "A prompt arrives", captionKey: "1.1.prompt", scene: scenes.prompt!, autoAdvanceMs: 2600 },
    { id: "read", title: "The model reads every token", captionKey: "1.1.read", scene: scenes.read!, autoAdvanceMs: 3200 },
    { id: "probs", title: "It scores every possible next token", captionKey: "1.1.probs", scene: scenes.probs!, autoAdvanceMs: 3200 },
    { id: "pick", title: "One token is picked", captionKey: "1.1.pick", scene: scenes.pick!, autoAdvanceMs: 3000 },
    { id: "append", title: "The pick joins the prompt", captionKey: "1.1.append", scene: scenes.append!, autoAdvanceMs: 3200 },
    { id: "loop", title: "Repeat until done", captionKey: "1.1.loop", scene: scenes.loop! , autoAdvanceMs: 3600 },
  ],
  knobs: [{ kind: "slider", id: "maxTokens", label: "Max tokens to generate", min: 1, max: 5, step: 1, default: 3, showAtSteps: ["loop"] }],
  quiz: {
    question: "Paris was just picked. What happens next?",
    choices: [
      "The model stops: the answer is finished",
      "“ Paris” is appended to the prompt and the model runs again",
      "The model rewrites the original prompt",
    ],
    answer: 1,
    revealAtStep: "append",
    explanation: "The model only ever predicts the next token. To continue, the new token is appended and the whole sequence goes in again.",
  },
  takeaways: [
    "A language model predicts one token at a time; an answer is many predictions in a row.",
    "At each step the model gives every possible next token a probability, then one is picked.",
    "The picked token is appended to the input, so each new token depends on all the earlier ones.",
  ],
  references: [
    { label: "Attention Is All You Need (Vaswani et al., 2017)", url: "https://arxiv.org/abs/1706.03762" },
    { label: "Language Models are Unsupervised Multitask Learners (GPT-2)", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" },
  ],
  trace,
  derive({ step, knobs }) {
    if (step.id !== "loop") return step.scene;
    return loopScene(Number(knobs.maxTokens ?? 3));
  },
};

