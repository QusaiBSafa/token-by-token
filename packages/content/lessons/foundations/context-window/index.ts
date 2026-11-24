import type { Lesson, Node, Scene } from "../../../src/schema";
import { TILE_H } from "../../../src/layout";

const TILE_W = 56;
const SLOT = 64;
const TOKENS_PER_MESSAGE = 120;
const USD_PER_MILLION_INPUT = 3; // illustrative price

const user: Node = { id: "user", kind: "user", x: 40, y: 60, props: { label: "You" } };
const model: Node = { id: "model", kind: "model", x: 760, y: 50, w: 150, h: 100, props: { label: "Model" } };

export function windowScene(window: number, messages: number, opts: { showCost?: boolean } = {}): Scene {
  const kept = Math.min(window, messages);
  const dropped = Math.max(0, messages - window);
  const trayW = window * SLOT + 16;
  const trayX = (960 - trayW) / 2;
  const trayY = 280;
  const nodes: Node[] = [
    user,
    model,
    { id: "tray", kind: "box", x: trayX, y: trayY, w: trayW, h: 76, props: { label: `context window · ${window} messages` } },
  ];
  for (let i = 1; i <= messages; i++) {
    const isKept = i > dropped;
    const slot = i - dropped - 1;
    if (!isKept && dropped - i >= 3) continue; // only the 3 most recent drops stay visible
    nodes.push(
      isKept
        ? { id: `m${i}`, kind: "token", x: trayX + 8 + slot * SLOT + (SLOT - TILE_W) / 2, y: trayY + 20, w: TILE_W, h: TILE_H, props: { label: `m${i}`, from: "user", color: ((i - 1) % 8) + 1 } }
        : // dropped messages slide out below the tray and fade
          { id: `m${i}`, kind: "token", x: trayX + 8 + (i - Math.max(1, dropped - 2)) * SLOT + (SLOT - TILE_W) / 2, y: trayY + 100, w: TILE_W, h: TILE_H, state: "ghost", props: { label: `m${i}`, color: ((i - 1) % 8) + 1 } },
    );
  }
  let billed = 0;
  for (let i = 1; i <= messages; i++) billed += Math.min(i, window) * TOKENS_PER_MESSAGE;
  const used = kept * TOKENS_PER_MESSAGE;
  const cost = (billed / 1_000_000) * USD_PER_MILLION_INPUT;
  if (dropped > 0) nodes.push({ id: "forgot", kind: "callout", x: 315, y: 440, w: 330, h: 54, props: { text: `${dropped} oldest message${dropped > 1 ? "s" : ""} no longer fit.\nThe model cannot see them.` } });
  return {
    nodes,
    edges: [{ id: "send", from: "tray", to: "model", label: "whole window sent every turn", style: "dashed" }],
    flows: opts.showCost ? [{ edge: "send", packets: Math.min(6, kept), durationMs: 2200 }] : undefined,
    metrics: [
      { id: "used", label: "Tokens in window", value: used, format: "int", warnAt: window * TOKENS_PER_MESSAGE * 0.8 },
      ...(opts.showCost || messages > 0 ? [{ id: "billed", label: "Tokens billed so far", value: billed, format: "int" as const }] : []),
      ...(opts.showCost ? [{ id: "cost", label: "Input cost so far (illustrative)", value: cost, format: "usd" as const, warnAt: 0.01 }] : []),
    ],
    highlight: dropped > 0 ? ["tray", "forgot"] : undefined,
  };
}

export const lesson: Lesson = {
  id: "1.4",
  module: "foundations",
  slug: "context-window",
  number: "1.4",
  title: "The context window",
  summary: "A fixed-size tray holds what the model can see, and every turn pays for all of it.",
  minutes: 5,
  free: true,
  traceSource: "illustrative",
  terms: ["context-window", "token", "input-cost"],
  steps: [
    { id: "tray", title: "The model sees a fixed-size window", captionKey: "1.4.tray", scene: windowScene(6, 0) },
    { id: "fill", title: "Messages fill it up", captionKey: "1.4.fill", scene: windowScene(6, 4) },
    { id: "full", title: "Until it is full", captionKey: "1.4.full", scene: windowScene(6, 6) },
    { id: "overflow", title: "Then the oldest drops out", captionKey: "1.4.overflow", scene: windowScene(6, 8) },
    { id: "cost", title: "Every turn resends the window", captionKey: "1.4.cost", scene: windowScene(6, 8, { showCost: true }) },
    { id: "try", title: "Try different sizes", captionKey: "1.4.try", scene: windowScene(8, 10, { showCost: true }) },
  ],
  knobs: [
    { kind: "slider", id: "window", label: "Window size (messages)", min: 3, max: 12, step: 1, default: 8, showAtSteps: ["try"] },
    { kind: "slider", id: "messages", label: "Messages sent", min: 1, max: 20, step: 1, default: 10, showAtSteps: ["try"] },
  ],
  quiz: {
    question: "The window holds 6 messages and message 7 arrives. What happens?",
    choices: [
      "The oldest message falls out, and the model never sees it again",
      "The window grows to fit",
      "The new message is ignored",
    ],
    answer: 0,
    revealAtStep: "overflow",
    explanation: "A window is a hard limit. Apps either drop old messages, or summarise them to save space.",
  },
  takeaways: [
    "The context window is the maximum number of tokens the model can read at once, prompt and answer together.",
    "When a conversation outgrows it, something has to go: old messages are dropped or summarised.",
    "Chat apps resend the whole window every turn, so cost grows with conversation length.",
  ],
  references: [
    { label: "Lost in the Middle: How Language Models Use Long Contexts (Liu et al., 2023)", url: "https://arxiv.org/abs/2307.03172" },
  ],
  derive({ step, knobs }) {
    if (step.id !== "try") return step.scene;
    return windowScene(Number(knobs.window ?? 8), Number(knobs.messages ?? 10), { showCost: true });
  },
};
