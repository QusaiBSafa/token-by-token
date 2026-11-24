import type { Lesson } from "./schema";
import { lesson as l11 } from "../lessons/foundations/one-prompt";
import { lesson as l12 } from "../lessons/foundations/tokenization";
import { lesson as l13 } from "../lessons/foundations/embeddings";
import { lesson as l14 } from "../lessons/foundations/context-window";
import { copyEn } from "./copy.en";
import { modules } from "./modules";
import type { Scene, Step, KnobValues } from "./schema";

export const lessons: Lesson[] = [l11, l12, l13, l14];

export const getLesson = (moduleId: string, slug: string) => lessons.find((l) => l.module === moduleId && l.slug === slug);
export const getLessonById = (id: string) => lessons.find((l) => l.id === id);
export const lessonsInModule = (moduleId: string) => lessons.filter((l) => l.module === moduleId);
export const getModule = (id: string) => modules.find((m) => m.id === id);
export const caption = (key: string) => copyEn[key] ?? key;
export const lessonHref = (l: Lesson, stepId?: string) => `/learn/${l.module}/${l.slug}${stepId ? `/${stepId}` : ""}`;

export function defaultKnobs(lesson: Lesson): KnobValues {
  return Object.fromEntries((lesson.knobs ?? []).map((k) => [k.id, k.default]));
}

function lookup(path: string, knobs: KnobValues, trace: unknown): unknown {
  const [root, ...rest] = path.split(".");
  let cur: unknown = root === "knob" ? knobs : root === "trace" ? trace : undefined;
  for (const key of rest) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key.replace(/\[(\d+)\]/, "$1")];
  }
  return cur;
}

/** Resolve the scene shown for a step: static scene, then optional derive(), then `bind` values. */
export function resolveScene(lesson: Lesson, stepIndex: number, knobs: KnobValues): Scene {
  const step = lesson.steps[Math.max(0, Math.min(stepIndex, lesson.steps.length - 1))] as Step;
  const parsed = step.scene as Scene;
  const scene = lesson.derive ? lesson.derive({ scene: parsed, step, stepIndex, knobs, trace: lesson.trace }) : parsed;
  const needsBind = scene.nodes.some((n) => n.bind) || scene.metrics?.some((m) => m.bind);
  if (!needsBind) return scene;
  return {
    ...scene,
    nodes: scene.nodes.map((n) => (n.bind ? { ...n, props: { ...n.props, value: lookup(n.bind, knobs, lesson.trace) } } : n)),
    metrics: scene.metrics?.map((m) => (m.bind ? { ...m, value: (lookup(m.bind, knobs, lesson.trace) as number | string) ?? m.value } : m)),
  };
}
