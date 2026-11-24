import { z } from "zod";

export const GLYPH_KINDS = [
  "token", "tokenStrip", "vector", "model", "layer", "db", "tool", "agent", "user",
  "bars", "grid", "callout", "text", "box", "dot", "meter",
] as const;
export type GlyphKind = (typeof GLYPH_KINDS)[number];

export const nodeStateSchema = z.enum(["idle", "active", "done", "error", "ghost"]);

export const nodeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(GLYPH_KINDS),
  x: z.number(),
  y: z.number(),
  w: z.number().optional(),
  h: z.number().optional(),
  /** glyph-specific: label, color, value, tokens[], items[]. Motion hints: from, to, absorb. */
  props: z.record(z.string(), z.unknown()).optional(),
  state: nodeStateSchema.optional(),
  /** read a value from the knob or trace: "knob.temperature" */
  bind: z.string().optional(),
});

export const edgeSchema = z.object({
  id: z.string().min(1),
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  style: z.enum(["solid", "dashed"]).optional(),
});

export const flowSchema = z.object({
  edge: z.string(),
  packets: z.number().int().min(1).max(12),
  color: z.string().optional(),
  durationMs: z.number().optional(),
  label: z.string().optional(),
});

export const metricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  format: z.enum(["int", "usd", "ms", "pct", "dec"]).optional(),
  bind: z.string().optional(),
  warnAt: z.number().optional(),
  dangerAt: z.number().optional(),
});

export const sceneSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  flows: z.array(flowSchema).optional(),
  metrics: z.array(metricSchema).optional(),
  highlight: z.array(z.string()).optional(),
  /** explicit entry order, seconds */
  sequence: z.array(z.object({ ids: z.array(z.string()), at: z.number() })).optional(),
});

export const stepSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  /** key into copy.en.ts */
  captionKey: z.string(),
  scene: sceneSchema,
  autoAdvanceMs: z.number().optional(),
});

export const knobSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("slider"), id: z.string(), label: z.string(), min: z.number(), max: z.number(), step: z.number(), default: z.number(), showAtSteps: z.array(z.string()).optional() }),
  z.object({ kind: z.literal("select"), id: z.string(), label: z.string(), options: z.array(z.object({ value: z.string(), label: z.string() })).min(1), default: z.string(), showAtSteps: z.array(z.string()).optional() }),
  z.object({ kind: z.literal("text"), id: z.string(), label: z.string(), default: z.string(), maxLength: z.number(), showAtSteps: z.array(z.string()).optional() }),
]);

export const quizSchema = z.object({
  question: z.string(),
  choices: z.array(z.string()).min(2),
  answer: z.number().int(),
  revealAtStep: z.string(),
  explanation: z.string(),
});

export const lessonSchema = z.object({
  id: z.string(),
  module: z.string(),
  slug: z.string(),
  number: z.string(),
  title: z.string(),
  summary: z.string(),
  minutes: z.number(),
  free: z.boolean(),
  steps: z.array(stepSchema).min(1),
  knobs: z.array(knobSchema).default([]),
  quiz: quizSchema.optional(),
  takeaways: z.array(z.string()).min(1),
  references: z.array(z.object({ label: z.string(), url: z.url() })),
  terms: z.array(z.string()).default([]),
  traceSource: z.enum(["real", "illustrative"]).optional(),
});

export type Node = z.infer<typeof nodeSchema>;
export type NodeState = z.infer<typeof nodeStateSchema>;
export type Edge = z.infer<typeof edgeSchema>;
export type Flow = z.infer<typeof flowSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Knob = z.infer<typeof knobSchema>;
export type Quiz = z.infer<typeof quizSchema>;
export type KnobValues = Record<string, number | string>;

export interface DeriveContext {
  scene: Scene;
  step: Step;
  stepIndex: number;
  knobs: KnobValues;
  trace: unknown;
}

/** A lesson is data, plus an optional pure derive() for knob-dependent scenes. */
export type Lesson = Omit<z.input<typeof lessonSchema>, "knobs" | "terms"> & {
  knobs?: Knob[];
  terms?: string[];
  trace?: unknown;
  derive?: (ctx: DeriveContext) => Scene;
};

export const moduleSchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  blurb: z.string(),
  accent: z.string(),
  live: z.boolean(),
});
export type ModuleMeta = z.infer<typeof moduleSchema>;
