import { createStore } from "zustand/vanilla";
import type { KnobValues, Lesson } from "@tbt/content";
import { defaultKnobs } from "@tbt/content";

export type Status = "idle" | "animating" | "settled";
export interface PlayerState {
  lessonId: string;
  total: number;
  /** step the learner is on */
  stepIndex: number;
  /** step whose scene is currently shown (differs from stepIndex only during replay) */
  sceneIndex: number;
  status: Status;
  knobs: KnobValues;
  quizAnswer: number | undefined;
  /** next transition has zero duration (deep link, replay reset) */
  instant: boolean;
  /** transition is the short knob tween */
  fast: boolean;
  next(): void;
  back(): void;
  goTo(i: number, opts?: { instant?: boolean }): void;
  replay(): void;
  setKnob(id: string, v: number | string): void;
  answerQuiz(i: number): void;
  settle(): void;
}

export const isGated = (lesson: Lesson, s: Pick<PlayerState, "stepIndex" | "quizAnswer">) =>
  Boolean(lesson.quiz && lesson.steps[s.stepIndex]?.id === lesson.quiz.revealAtStep && s.quizAnswer === undefined);

export function createPlayerStore(lesson: Lesson, initialStep = 0, schedule: (fn: () => void, ms: number) => void = (fn, ms) => void setTimeout(fn, ms)) {
  const total = lesson.steps.length;
  const clamp = (i: number) => Math.max(0, Math.min(total - 1, i));
  const start = clamp(initialStep);
  return createStore<PlayerState>()((set, get) => ({
    lessonId: lesson.id,
    total,
    stepIndex: start,
    sceneIndex: start,
    status: "idle",
    knobs: defaultKnobs(lesson),
    quizAnswer: undefined,
    instant: true,
    fast: false,
    goTo(i, opts) {
      const idx = clamp(i);
      set({ stepIndex: idx, sceneIndex: idx, status: "animating", instant: Boolean(opts?.instant), fast: false });
    },
    next() {
      const s = get();
      if (s.stepIndex >= total - 1 || isGated(lesson, s)) return;
      // finish-on-Next: a new target simply retargets the tween, so nobody waits on a seen animation
      set({ stepIndex: s.stepIndex + 1, sceneIndex: s.stepIndex + 1, status: "animating", instant: false, fast: false });
    },
    back() {
      const s = get();
      if (s.stepIndex <= 0) return;
      set({ stepIndex: s.stepIndex - 1, sceneIndex: s.stepIndex - 1, status: "animating", instant: false, fast: false });
    },
    replay() {
      const s = get();
      const target = s.stepIndex;
      set({ sceneIndex: Math.max(0, target - 1), instant: true, fast: false, status: "animating" });
      schedule(() => {
        if (get().stepIndex === target) set({ sceneIndex: target, instant: false, status: "animating" });
      }, 60);
    },
    setKnob(id, v) {
      set({ knobs: { ...get().knobs, [id]: v }, fast: true, instant: false, status: "animating" });
    },
    answerQuiz(i) {
      if (get().quizAnswer === undefined) set({ quizAnswer: i });
    },
    settle() {
      if (get().status === "animating") set({ status: "settled" });
    },
  }));
}
